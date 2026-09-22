const { MessageFlags } = require("discord.js");
const { getPending, replyLeaderboard, DEFAULT_SORT, DEFAULT_SIZE } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-search-button",
  async execute(interaction) {
    const { position, sortBy, size } = getPending(interaction.guildId);
    if (!position) {
      await interaction.reply({ content: "Pick a position first, then press Search.", flags: MessageFlags.Ephemeral });
      return;
    }
    await replyLeaderboard(interaction, position, sortBy || DEFAULT_SORT, size || DEFAULT_SIZE);
  },
};

module.exports = { handler };
