const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getServerConfig } = require("../config/servers");
const { getLeaderboard } = require("../utils/fantasyAgentClient");
const { sendChunked } = require("../utils/splitMessage");
const { runForAllGuilds } = require("../utils/guildJobs");

const POSITION_LABELS = { QB: "QB", RB: "RB", WR: "WR", TE: "TE", K: "K", "D/ST": "DEF" };
// Add entries here to grow the "Ranked by" list (channel menu + /leaderboard command both read this).
const SORT_LABELS = {
  points: "Total Points",
  avg_points: "Avg Points/Game",
  projected_points: "Projected Points",
  percent_owned: "Ownership %",
};
// How each ranking's value is displayed on a leaderboard line.
const STAT_FORMATTERS = {
  points: (p) => `${p.total_points.toFixed(1)} pts`,
  avg_points: (p) => `${p.avg_points.toFixed(1)} pts/gm`,
  projected_points: (p) => `${p.projected_total_points.toFixed(1)} proj pts`,
  percent_owned: (p) => (p.percent_owned < 0 ? "ownership unknown" : `${p.percent_owned.toFixed(0)}% owned`),
};
const DEFAULT_SORT = "points";
const DEFAULT_SIZE = 15;

// Remembers each guild panel's queued (not-yet-searched) position/sort
// choice (the data isn't per-user, so one shared value per guild is
// enough). The selects only update this; the Search button is what
// actually fetches and renders, so picking both fields doesn't trigger two
// loads in a row.
const pendingByGuild = new Map();
const getPending = (guildId) => pendingByGuild.get(guildId) || {};
const setPending = (guildId, updates) => pendingByGuild.set(guildId, { ...getPending(guildId), ...updates });

// Fetches and formats the top players at `position`, ranked by `sortBy`.
async function getLeaderboardData(guildId, position, sortBy = DEFAULT_SORT, size = DEFAULT_SIZE) {
  const config = getServerConfig(guildId);
  const { players } = await getLeaderboard(config.leagueId, position, size, sortBy);

  const format = STAT_FORMATTERS[sortBy] || STAT_FORMATTERS[DEFAULT_SORT];
  const lines = players.map((p) => `${p.rank}. **${p.name}** (${p.pro_team}) — ${format(p)} — ${p.owner_team_name || "Free Agent"}`);
  const text = `**${POSITION_LABELS[position] || position} Leaderboard — Ranked by ${SORT_LABELS[sortBy] || sortBy} (Top ${players.length})**\n${lines.join("\n")}`;

  return { text, count: players.length };
}

// Posts the leaderboard for `position` straight into the guild's configured
// leaderboard channel. Used by the /leaderboard command.
async function postLeaderboard(client, guildId, position, size = DEFAULT_SIZE, sortBy = DEFAULT_SORT) {
  const config = getServerConfig(guildId, "leaderboardChannelId");
  const channel = await client.channels.fetch(config.leaderboardChannelId);
  const { text, count } = await getLeaderboardData(guildId, position, sortBy, size);
  await sendChunked(channel, text);
  return { position, label: POSITION_LABELS[position] || position, sortLabel: SORT_LABELS[sortBy] || sortBy, count };
}

// Used by the Search button: fetches the leaderboard and edits the panel
// message itself in place (rather than replying), so each new search
// replaces the last result instead of stacking new messages. Omitting
// `components` leaves the select menus and button on the message untouched.
async function replyLeaderboard(interaction, position, sortBy) {
  await interaction.deferUpdate();
  const { text } = await getLeaderboardData(interaction.guildId, position, sortBy);
  await interaction.editReply({ content: text });
}

// Builds the position/sort select rows plus the Search button. Whichever
// option matches `pending` is marked default, so the dropdown itself shows
// the current pick (instead of resetting to its placeholder) once closed.
function buildPanelComponents(pending = {}) {
  const positionRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("leaderboard-position-select")
      .setPlaceholder("Choose a position")
      .addOptions(
        Object.entries(POSITION_LABELS).map(([value, label]) => ({ label, value, default: value === pending.position }))
      )
  );

  const sortRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("leaderboard-sort-select")
      .setPlaceholder("Choose a ranking")
      .addOptions(
        Object.entries(SORT_LABELS).map(([value, label]) => ({
          label,
          value,
          default: value === (pending.sortBy || DEFAULT_SORT),
        }))
      )
  );

  const searchRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("leaderboard-search-button").setLabel("Search").setStyle(ButtonStyle.Primary)
  );

  return [positionRow, sortRow, searchRow];
}

// Posts the interactive position/ranked-by/search menu into the guild's
// configured leaderboard channel.
async function postLeaderboardPanel(client, guildId) {
  const config = getServerConfig(guildId, "leaderboardChannelId");
  const channel = await client.channels.fetch(config.leaderboardChannelId);
  await channel.send({
    content: "**Player Leaderboard** — pick a position and ranking, then press Search.",
    components: buildPanelComponents(getPending(guildId)),
  });
}

// Reads a select component's current option values off an already-posted
// panel message, so they can be compared against what the code expects now.
function selectOptionValues(panelMessage, customId) {
  const select = panelMessage.components.flatMap((row) => row.components).find((c) => c.customId === customId);
  return select?.options.map((o) => o.value).sort() ?? [];
}

function sameValues(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// True if `customId` appears anywhere on the message's components.
function hasComponent(panelMessage, customId) {
  return panelMessage.components.some((row) => row.components.some((c) => c.customId === customId));
}

// Makes sure the guild's leaderboard channel has an up-to-date menu panel:
// posts one if none exists yet, or refreshes an existing panel's
// components in place if POSITION_LABELS/SORT_LABELS have grown, or the
// Search button is missing, since it was posted.
async function ensureLeaderboardPanel(client, guildId) {
  const config = getServerConfig(guildId, "leaderboardChannelId");
  const channel = await client.channels.fetch(config.leaderboardChannelId);
  const messages = await channel.messages.fetch({ limit: 20 });
  const panelMessage = messages.find((m) => m.author.id === client.user.id && hasComponent(m, "leaderboard-position-select"));

  if (!panelMessage) {
    await postLeaderboardPanel(client, guildId);
    return;
  }

  const isCurrent =
    hasComponent(panelMessage, "leaderboard-search-button") &&
    sameValues(selectOptionValues(panelMessage, "leaderboard-position-select"), Object.keys(POSITION_LABELS).sort()) &&
    sameValues(selectOptionValues(panelMessage, "leaderboard-sort-select"), Object.keys(SORT_LABELS).sort());

  if (!isCurrent) {
    await panelMessage.edit({ components: buildPanelComponents(getPending(guildId)) });
  }
}

// Runs the panel check/post for every configured guild; used on bot startup.
async function ensureLeaderboardPanelForAllGuilds(client) {
  await runForAllGuilds(client, ensureLeaderboardPanel, "Leaderboard panel setup");
}

module.exports = {
  postLeaderboard,
  postLeaderboardPanel,
  ensureLeaderboardPanel,
  ensureLeaderboardPanelForAllGuilds,
  replyLeaderboard,
  buildPanelComponents,
  getPending,
  setPending,
  SORT_LABELS,
  DEFAULT_SORT,
};
