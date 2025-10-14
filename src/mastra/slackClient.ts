/**
 * Simple Slack client for local development
 * Uses bot token from environment variable
 */

import { WebClient } from "@slack/web-api";

export async function getSlackClient(): Promise<WebClient> {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    throw new Error(
      "SLACK_BOT_TOKEN environment variable not set. " +
      "Get your bot token from https://api.slack.com/apps → Your App → OAuth & Permissions → Bot User OAuth Token"
    );
  }

  const slack = new WebClient(token);

  // Test the connection
  try {
    await slack.auth.test();
  } catch (error) {
    throw new Error(
      `Failed to connect to Slack. Check that your SLACK_BOT_TOKEN is valid. Error: ${error}`
    );
  }

  return slack;
}
