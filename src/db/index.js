// SQLite persistence: user_teams (discord user <-> ESPN owner identity) and
// channels (shared + per-user private channel IDs). Opened once at require-time,
// schema created idempotently, so every boot is safe to re-run.
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { env } = require("../config");

fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
const db = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS user_teams (
    guild_id         TEXT    NOT NULL,
    discord_user_id  TEXT    NOT NULL,
    espn_owner_id    TEXT    NOT NULL,
    league_id        INTEGER NOT NULL,
    team_id          INTEGER,
    team_name        TEXT,
    updated_at       TEXT    NOT NULL,
    PRIMARY KEY (guild_id, discord_user_id, espn_owner_id)
  );

  CREATE TABLE IF NOT EXISTS channels (
    guild_id         TEXT NOT NULL,
    discord_user_id  TEXT NOT NULL DEFAULT '',
    channel_type     TEXT NOT NULL,
    channel_id       TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    PRIMARY KEY (guild_id, discord_user_id, channel_type)
  );
`);

// user_teams: one row per (guild, discord user, ESPN owner).
const upsertUserTeamStmt = db.prepare(`
  INSERT INTO user_teams (guild_id, discord_user_id, espn_owner_id, league_id, team_id, team_name, updated_at)
  VALUES (@guildId, @discordUserId, @espnOwnerId, @leagueId, @teamId, @teamName, @updatedAt)
  ON CONFLICT (guild_id, discord_user_id, espn_owner_id) DO UPDATE SET
    league_id = excluded.league_id,
    team_id = excluded.team_id,
    team_name = excluded.team_name,
    updated_at = excluded.updated_at
`);

// Inserts or overwrites a user's team link; updated_at defaults to now.
function upsertUserTeam({ guildId, discordUserId, espnOwnerId, leagueId, teamId = null, teamName = null, updatedAt = new Date().toISOString() }) {
  upsertUserTeamStmt.run({ guildId, discordUserId, espnOwnerId, leagueId, teamId, teamName, updatedAt });
}

// Returns a user's row in a guild (there's normally exactly one per guild), or undefined.
function getUserTeam(guildId, discordUserId) {
  return db.prepare("SELECT * FROM user_teams WHERE guild_id = ? AND discord_user_id = ?").get(guildId, discordUserId);
}

// All members of a guild, for building "already claimed" lists.
function listUserTeamsForGuild(guildId) {
  return db.prepare("SELECT * FROM user_teams WHERE guild_id = ?").all(guildId);
}

// channels: shared rows use discordUserId = "" (the DEFAULT); private rows use the real user id.
const upsertChannelStmt = db.prepare(`
  INSERT INTO channels (guild_id, discord_user_id, channel_type, channel_id, created_at)
  VALUES (@guildId, @discordUserId, @channelType, @channelId, @createdAt)
  ON CONFLICT (guild_id, discord_user_id, channel_type) DO UPDATE SET
    channel_id = excluded.channel_id
`);

// Inserts or overwrites a channel mapping; omit discordUserId (or pass "") for a shared channel.
function upsertChannel({ guildId, discordUserId = "", channelType, channelId, createdAt = new Date().toISOString() }) {
  upsertChannelStmt.run({ guildId, discordUserId, channelType, channelId, createdAt });
}

// A single channel mapping; omit discordUserId for a shared channel.
function getChannel(guildId, channelType, discordUserId = "") {
  return db.prepare("SELECT * FROM channels WHERE guild_id = ? AND discord_user_id = ? AND channel_type = ?").get(guildId, discordUserId, channelType);
}

// Every channel row for a guild (shared and private).
function listChannelsForGuild(guildId) {
  return db.prepare("SELECT * FROM channels WHERE guild_id = ?").all(guildId);
}

module.exports = {
  db,
  upsertUserTeam,
  getUserTeam,
  listUserTeamsForGuild,
  upsertChannel,
  getChannel,
  listChannelsForGuild,
};
