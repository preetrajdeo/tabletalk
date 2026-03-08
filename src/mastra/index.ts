import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";

// import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe } from "./inngest";
import {
  handleTableCommand,
  handleModalSubmission,
  handleTableAction
} from "./slackTableCommands";
import { getSlackClient } from "./slackClient";
import { initTokenStore, saveInstallation } from "./tokenStore";

class ProductionPinoLogger extends MastraLogger {
  protected logger: pino.Logger;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
  ) {
    super(options);

    this.logger = pino({
      name: options.name || "app",
      level: options.level || LogLevel.INFO,
      base: {},
      formatters: {
        level: (label: string, _number: number) => ({
          level: label,
        }),
      },
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    });
  }

  debug(message: string, args: Record<string, any> = {}): void {
    this.logger.debug(args, message);
  }

  info(message: string, args: Record<string, any> = {}): void {
    this.logger.info(args, message);
  }

  warn(message: string, args: Record<string, any> = {}): void {
    this.logger.warn(args, message);
  }

  error(message: string, args: Record<string, any> = {}): void {
    this.logger.error(args, message);
  }
}

export const mastra = new Mastra({
  // storage: sharedPostgresStorage,  // Disabled for testing without PostgreSQL
  agents: {},
  workflows: {},
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {},
    }),
  },
  bundler: {
    // A few dependencies are not properly picked up by
    // the bundler if they are not added directly to the
    // entrypoint.
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
      "pg",
    ],
    // sourcemaps are good for debugging.
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5001,
    middleware: [
      async (c, next) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        logger?.debug("[Request]", { method: c.req.method, url: c.req.url });
        try {
          await next();
        } catch (error) {
          logger?.error("[Response]", {
            method: c.req.method,
            url: c.req.url,
            error,
          });
          if (error instanceof MastraError) {
            if (error.id === "AGENT_MEMORY_MISSING_RESOURCE_ID") {
              // This is typically a non-retirable error. It means that the request was not
              // setup correctly to pass in the necessary parameters.
              throw new NonRetriableError(error.message, { cause: error });
            }
          } else if (error instanceof z.ZodError) {
            // Validation errors are never retriable.
            throw new NonRetriableError(error.message, { cause: error });
          }

          throw error;
        }
      },
    ],
    apiRoutes: [
      // This API route is used to register the Mastra workflow (inngest function) on the inngest server
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
        // The inngestServe function integrates Mastra workflows with Inngest by:
        // 1. Creating Inngest functions for each workflow with unique IDs (workflow.${workflowId})
        // 2. Setting up event handlers that:
        //    - Generate unique run IDs for each workflow execution
        //    - Create an InngestExecutionEngine to manage step execution
        //    - Handle workflow state persistence and real-time updates
        // 3. Establishing a publish-subscribe system for real-time monitoring
        //    through the workflow:${workflowId}:${runId} channel
      },
      // Redirect to Slack OAuth authorization page
      {
        path: "/slack/install",
        method: "GET",
        createHandler: async () => {
          return async (c) => {
            const clientId = process.env.SLACK_CLIENT_ID;
            const appUrl = process.env.APP_URL ?? "";
            const redirectUri = `${appUrl}/slack/oauth/callback`;
            const scopes = "chat:write,chat:write.public,commands,users:read";

            if (!clientId) {
              return c.text("SLACK_CLIENT_ID environment variable not set.", 500);
            }

            const url =
              `https://slack.com/oauth/v2/authorize` +
              `?client_id=${encodeURIComponent(clientId)}` +
              `&scope=${encodeURIComponent(scopes)}` +
              `&redirect_uri=${encodeURIComponent(redirectUri)}`;

            return c.redirect(url, 302);
          };
        },
      },
      // OAuth callback — Slack redirects here after a workspace installs the app
      {
        path: "/slack/oauth/callback",
        method: "GET",
        createHandler: async ({ mastra }) => {
          return async (c) => {
            const logger = mastra.getLogger();
            const code = c.req.query("code");
            const error = c.req.query("error");

            if (error) {
              logger?.warn("[OAuth Callback] User denied installation", { error });
              return c.html(
                `<h2>Installation cancelled</h2><p>You can close this tab.</p>`
              );
            }

            if (!code) {
              return c.text("Missing code parameter.", 400);
            }

            const clientId = process.env.SLACK_CLIENT_ID;
            const clientSecret = process.env.SLACK_CLIENT_SECRET;
            const appUrl = process.env.APP_URL ?? "";
            const redirectUri = `${appUrl}/slack/oauth/callback`;

            if (!clientId || !clientSecret) {
              logger?.error("[OAuth Callback] Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET");
              return c.text("Server misconfiguration: missing Slack credentials.", 500);
            }

            // Exchange the temporary code for a permanent bot token
            const params = new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
            });

            const response = await fetch(
              `https://slack.com/api/oauth.v2.access?${params.toString()}`,
              { method: "GET" }
            );

            const data = (await response.json()) as any;

            if (!data.ok) {
              logger?.error("[OAuth Callback] Token exchange failed", { error: data.error });
              return c.html(
                `<h2>Installation failed</h2><p>${data.error}</p><p>Please try again.</p>`
              );
            }

            const teamId = data.team?.id;
            const teamName = data.team?.name;
            const botToken = data.access_token;
            const botUserId = data.bot_user_id;

            await saveInstallation(teamId, botToken, botUserId, teamName);
            logger?.info("[OAuth Callback] Installation saved", { teamId, teamName });

            return c.html(`
              <!DOCTYPE html>
              <html>
                <head><title>TableTalk Installed</title></head>
                <body style="font-family:sans-serif;text-align:center;padding:60px;">
                  <h1>🎉 TableTalk is installed!</h1>
                  <p>TableTalk has been added to <strong>${teamName}</strong>.</p>
                  <p>Head back to Slack and try <code>/table</code> in any channel.</p>
                </body>
              </html>
            `);
          };
        },
      },
      // Slack slash command endpoint for /table command
      {
        path: "/slack/commands",
        method: "POST",
        createHandler: async ({ mastra }) => {
          return async (c) => {
            try {
              const body = await c.req.parseBody();
              const logger = mastra.getLogger();

              logger?.info("[Slack Command]", { command: body.command });

              const teamId = body.team_id as string | undefined;

              if (body.command === "/table") {
                const slack = await getSlackClient(teamId);
                await handleTableCommand(body, slack);

                // Respond immediately to Slack
                return c.text("", 200);
              }

              if (body.command === "/table-edit") {
                const slack = await getSlackClient(teamId);
                await handleTableCommand(body, slack);

                // Respond immediately to Slack
                return c.text("", 200);
              }

              return c.json({ error: "Unknown command" }, 400);
            } catch (error) {
              const errorDetails = error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : { error: String(error) };
              mastra.getLogger()?.error("[Slack Command Error]", errorDetails);
              console.error("[Slack Command Full Error]:", error);
              return c.json({ error: "Internal error" }, 500);
            }
          };
        },
      },
      // Slack interactive components (modals, buttons)
      {
        path: "/slack/interactions",
        method: "POST",
        createHandler: async ({ mastra }) => {
          return async (c) => {
            try {
              const body = await c.req.parseBody();
              const payload = JSON.parse(body.payload as string);
              const logger = mastra.getLogger();

              logger?.info("[Slack Interaction]", {
                type: payload.type,
                callback_id: payload.view?.callback_id,
              });

              const teamId = payload.team?.id as string | undefined;
              const slack = await getSlackClient(teamId);

              // Handle different interaction types
              if (payload.type === "view_submission") {
                await handleModalSubmission(payload, slack);
                // Return response_action: "clear" to close all modals
                return c.json({ response_action: "clear" });
              } else if (payload.type === "block_actions") {
                // Check if this is a modal button action (has payload.view)
                const isModalAction = !!payload.view;

                await handleTableAction(payload, slack);

                // For modal actions, we must return an empty 200 response immediately
                // The actual modal update happens via slack.views.update() in handleTableAction
                return c.text("", 200);
              }

              return c.json({ error: "Unknown interaction type" }, 400);
            } catch (error) {
              const errorDetails = error instanceof Error
                ? { message: error.message, stack: error.stack, name: error.name }
                : { error: String(error) };
              mastra.getLogger()?.error("[Slack Interaction Error]", errorDetails);
              console.error("[Slack Interaction Full Error]:", error);
              return c.json({ error: "Internal error" }, 500);
            }
          };
        },
      },
    ],
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new ProductionPinoLogger({
          name: "Mastra",
          level: "info",
        })
      : new PinoLogger({
          name: "Mastra",
          level: "info",
        }),
});

// Initialize the token store (creates the DB table if it doesn't exist yet)
initTokenStore().catch((err) =>
  console.error("[TokenStore] Failed to initialize:", err)
);

/*  Sanity check 1: Throw an error if there are more than 1 workflows.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error(
    "More than 1 workflows found. Currently, more than 1 workflows are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

/*  Sanity check 2: Throw an error if there are more than 1 agents.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error(
    "More than 1 agents found. Currently, more than 1 agents are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}
