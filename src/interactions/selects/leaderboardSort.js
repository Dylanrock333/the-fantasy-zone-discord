const { setPending, buildPanelComponents, getPending, prefetchLeaderboard } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-sort-select",
  async execute(interaction) {
    const [sortBy] = interaction.values;
    setPending(interaction.guildId, { sortBy });
    const pending = getPending(interaction.guildId);
    await interaction.update({ components: buildPanelComponents(pending) });
    prefetchLeaderboard(interaction.guildId, pending);
  },
};

module.exports = { handler };
