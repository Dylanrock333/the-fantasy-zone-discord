// Central config: env vars, settings (default.js + the APP_ENV file merged), and per-guild config.
// Import from here (require("../config")), not from the individual files.
require("dotenv/config");
const cron = require("node-cron");
const defaults = require("./default");

const ENVIRONMENTS = ["prod", "test"];
const APP_ENV = process.env.APP_ENV;
if (!ENVIRONMENTS.includes(APP_ENV)) {
  throw new Error(`APP_ENV must be one of ${ENVIRONMENTS.join(", ")} (got "${APP_ENV ?? ""}")`);
}

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

// Merges nested objects; arrays and scalars in `override` replace the base value.
function deepMerge(base, override) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? deepMerge(base[key], value) : value;
  }
  return out;
}

function deepFreeze(obj) {
  for (const value of Object.values(obj)) if (value && typeof value === "object") deepFreeze(value);
  return Object.freeze(obj);
}

const merged = deepMerge(defaults, require(`./${APP_ENV}`));
merged.leaderboard.maxSize = Math.max(...merged.leaderboard.countOptions);
merged.leaderboard.minSize = Math.min(...merged.leaderboard.countOptions);

// Fails at startup on a bad schedule or an incomplete guild, not at 00:00 Tuesday.
function validate({ schedules, guilds }) {
  for (const key of ["weeklyRecapCron", "matchupPreviewCron"]) {
    if (!cron.validate(schedules[key])) throw new Error(`Invalid cron expression for schedules.${key}: "${schedules[key]}"`);
  }
  if (!Object.keys(guilds).length) throw new Error(`No guilds configured for APP_ENV=${APP_ENV}`);
  for (const [guildId, guild] of Object.entries(guilds)) {
    for (const field of ["chatChannelId", "leagueId"]) {
      if (!guild[field]) throw new Error(`Guild ${guildId} is missing ${field}`);
    }
  }
}
validate(merged);
deepFreeze(merged);

const { guilds: GUILDS, ...settings } = merged;

const env = {
  APP_ENV,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  FANTASY_AGENT_URL: process.env.FANTASY_AGENT_URL || "http://localhost:8787",
};

// Throws if any of the named env vars is unset (each entry point requires only what it needs).
function requireEnv(...names) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length) throw new Error(`${missing.join(" and ")} must be set in the environment`);
}

// Returns a guild's config; throws if the guild (or the requested channel field) isn't configured.
function getGuildConfig(guildId, requiredField) {
  const config = GUILDS[guildId];
  if (!config) throw new Error(`No guild config for guild ${guildId}`);
  if (requiredField && !config[requiredField]) {
    throw new Error(`No ${requiredField} configured for guild ${guildId}`);
  }
  return config;
}

module.exports = { env, requireEnv, settings, GUILDS, getGuildConfig };
