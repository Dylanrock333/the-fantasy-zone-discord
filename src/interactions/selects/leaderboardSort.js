const { setPending, buildPanelComponents, getPending } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-sort-select",
  async execute(interaction) {
    const [sortBy] = interaction.values;
    setPending(interaction.guildId, { sortBy });
    await interaction.update({ components: buildPanelComponents(getPending(interaction.guildId)) });
  },
};

module.exports = { handler };
