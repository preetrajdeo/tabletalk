/**
 * Slack client factory.
 * Resolves the bot token for a given workspace (team_id) from Postgres,
 * falling back to the static SLACK_BOT_TOKEN env var for legacy / single-workspace use.
 */

import { WebClient } from "@slack/web-api";
import { getTokenForTeam } from "./tokenStore";

export async function getSlackClient(teamId?: string): Promise<WebClient> {
  let token: string | null | undefined;

  if (teamId) {
    token = await getTokenForTeam(teamId);
  }

  // Fallback: static env var (covers the original single-workspace install
  // and local development where DATABASE_URL may not be set)
  if (!token) {
    token = process.env.SLACK_BOT_TOKEN ?? null;
  }

  if (!token) {
    throw new Error(
      teamId
        ? `No bot token found for team ${teamId}. The workspace may need to reinstall the app at https://tabletalk-production.up.railway.app/slack/install`
        : "SLACK_BOT_TOKEN environment variable not set."
    );
  }

  return new WebClient(token);
}
