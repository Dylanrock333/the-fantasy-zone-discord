// Leaderboard panel Search button: runs the search for the guild's pending picks.
const { MessageFlags } = require("discord.js");
const { getPending } = require("../../../features/leaderboard/state");
const { showLeaderboardResults } = require("../../../features/leaderboard/panel");
const { DEFAULT_SORT, DEFAULT_SIZE } = require("../../../features/leaderboard/data");

const handler = {
  customId: "leaderboard-search-button",
  async execute(interaction) {
    const { position, sortBy, size } = getPending(interaction.guildId);
    if (!position) {
      await interaction.reply({ content: "Pick a position first, then press Search.", flags: MessageFlags.Ephemeral });
      return;
    }
    await showLeaderboardResults(interaction, position, sortBy || DEFAULT_SORT, size || DEFAULT_SIZE);
  },
};

module.exports = { handler };
