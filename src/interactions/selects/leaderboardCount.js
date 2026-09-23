// Leaderboard panel count select: stores the pick, redraws the panel, and prefetches results.
const { setPending, buildPanelComponents, getPending, prefetchLeaderboard } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-count-select",
  async execute(interaction) {
    const [size] = interaction.values;
    setPending(interaction.guildId, { size: Number(size) });
    const pending = getPending(interaction.guildId);
    await interaction.update({ components: buildPanelComponents(pending) });
    prefetchLeaderboard(interaction.guildId, pending);
  },
};

module.exports = { handler };
