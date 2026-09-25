// Leaderboard channel panel: builds the selects + Search button, renders results, and self-heals the message.
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getGuildConfig, settings } = require("../../config");
const { forEachGuild } = require("../../utils/forEachGuild");
const { getPending } = require("./state");
const {
  getLeaderboardText,
  POSITION_LABELS,
  SORT_LABELS,
  COUNT_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_SIZE,
} = require("./data");

// Search button handler: shows a loading state, then edits the panel in place with the result.
async function showLeaderboardResults(interaction, position, sortBy, size) {
  const pending = getPending(interaction.guildId);
  await interaction.update({
    content: `Loading **${POSITION_LABELS[position] || position}** leaderboard — ranked by ${SORT_LABELS[sortBy] || sortBy}…`,
    components: buildPanelComponents(pending, { loading: true }),
  });

  let content;
  try {
    ({ text: content } = await getLeaderboardText(interaction.guildId, position, sortBy, size));
  } catch (err) {
    content = `Leaderboard failed: ${err.message}`;
  }
  await interaction.editReply({ content, components: buildPanelComponents(pending) });
}

// Builds the panel's position/sort/count selects (current picks shown as default) and Search button.
function buildPanelComponents(pending = {}, { loading = false } = {}) {
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

  const countRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("leaderboard-count-select")
      .setPlaceholder("Choose how many")
      .addOptions(
        COUNT_OPTIONS.map((size) => ({
          label: `Top ${size}`,
          value: String(size),
          default: size === (pending.size || DEFAULT_SIZE),
        }))
      )
  );

  const searchRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("leaderboard-search-button")
      .setLabel(loading ? "Loading…" : "Search")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(loading)
  );

  return [positionRow, sortRow, countRow, searchRow];
}

// Posts a fresh panel into the guild's leaderboard channel.
async function sendLeaderboardPanel(client, guildId) {
  const config = getGuildConfig(guildId, "leaderboardChannelId");
  const channel = await client.channels.fetch(config.leaderboardChannelId);
  await channel.send({
    content: "**Player Leaderboard** — pick a position and ranking, then press Search.",
    components: buildPanelComponents(getPending(guildId)),
  });
}

// Sorted option values of a select on an already-posted panel message.
function selectOptionValues(panelMessage, customId) {
  const select = panelMessage.components.flatMap((row) => row.components).find((c) => c.customId === customId);
  return select?.options.map((o) => o.value).sort() ?? [];
}

function sameValues(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function hasComponent(panelMessage, customId) {
  return panelMessage.components.some((row) => row.components.some((c) => c.customId === customId));
}

// Self-healing panel: posts one if missing, or rebuilds an existing panel whose components are out of date.
async function syncLeaderboardPanel(client, guildId) {
  const config = getGuildConfig(guildId, "leaderboardChannelId");
  const channel = await client.channels.fetch(config.leaderboardChannelId);
  const messages = await channel.messages.fetch({ limit: settings.leaderboard.panelScanLimit });
  const panelMessage = messages.find((m) => m.author.id === client.user.id && hasComponent(m, "leaderboard-position-select"));

  if (!panelMessage) {
    await sendLeaderboardPanel(client, guildId);
    return;
  }

  // Out of date if any component is missing or any select's options differ from the current config.
  const isCurrent =
    hasComponent(panelMessage, "leaderboard-search-button") &&
    hasComponent(panelMessage, "leaderboard-count-select") &&
    sameValues(selectOptionValues(panelMessage, "leaderboard-position-select"), Object.keys(POSITION_LABELS).sort()) &&
    sameValues(selectOptionValues(panelMessage, "leaderboard-sort-select"), Object.keys(SORT_LABELS).sort()) &&
    sameValues(selectOptionValues(panelMessage, "leaderboard-count-select"), COUNT_OPTIONS.map(String).sort());

  if (!isCurrent) {
    await panelMessage.edit({ components: buildPanelComponents(getPending(guildId)) });
  }
}

// Runs the panel check for every configured guild (on startup).
async function syncLeaderboardPanelForAllGuilds(client) {
  await forEachGuild(client, syncLeaderboardPanel, "Leaderboard panel setup");
}

module.exports = {
  sendLeaderboardPanel,
  syncLeaderboardPanel,
  syncLeaderboardPanelForAllGuilds,
  showLeaderboardResults,
  buildPanelComponents,
};
