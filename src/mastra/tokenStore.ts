/**
 * Per-workspace Slack token storage backed by Postgres.
 * Each workspace that installs TableTalk gets its own bot token stored here.
 */

import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL || "postgresql://localhost:5432/mastra",
    });
  }
  return pool;
}

export async function initTokenStore(): Promise<void> {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS slack_installations (
      team_id   TEXT PRIMARY KEY,
      bot_token TEXT NOT NULL,
      bot_user_id TEXT,
      team_name TEXT,
      installed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function saveInstallation(
  teamId: string,
  botToken: string,
  botUserId?: string,
  teamName?: string
): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO slack_installations (team_id, bot_token, bot_user_id, team_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (team_id) DO UPDATE
       SET bot_token    = EXCLUDED.bot_token,
           bot_user_id  = EXCLUDED.bot_user_id,
           team_name    = EXCLUDED.team_name,
           installed_at = NOW()`,
    [teamId, botToken, botUserId ?? null, teamName ?? null]
  );
}

export async function getTokenForTeam(teamId: string): Promise<string | null> {
  const db = getPool();
  const result = await db.query<{ bot_token: string }>(
    "SELECT bot_token FROM slack_installations WHERE team_id = $1",
    [teamId]
  );
  return result.rows[0]?.bot_token ?? null;
}
