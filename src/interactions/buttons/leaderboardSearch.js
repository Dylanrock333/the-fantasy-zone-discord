const { MessageFlags } = require("discord.js");
const { getPending, replyLeaderboard, DEFAULT_SORT } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-search-button",
  async execute(interaction) {
    const { position, sortBy } = getPending(interaction.guildId);
    if (!position) {
      await interaction.reply({ content: "Pick a position first, then press Search.", flags: MessageFlags.Ephemeral });
      return;
    }
    await replyLeaderboard(interaction, position, sortBy || DEFAULT_SORT);
  },
};

module.exports = { handler };
