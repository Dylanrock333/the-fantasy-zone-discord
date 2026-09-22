const { setPending, buildPanelComponents, getPending, prefetchLeaderboard } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-position-select",
  async execute(interaction) {
    const [position] = interaction.values;
    setPending(interaction.guildId, { position });
    const pending = getPending(interaction.guildId);
    await interaction.update({ components: buildPanelComponents(pending) });
    prefetchLeaderboard(interaction.guildId, pending);
  },
};

module.exports = { handler };
