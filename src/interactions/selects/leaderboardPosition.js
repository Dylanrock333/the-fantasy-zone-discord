const { setPending, buildPanelComponents, getPending } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-position-select",
  async execute(interaction) {
    const [position] = interaction.values;
    setPending(interaction.guildId, { position });
    await interaction.update({ components: buildPanelComponents(getPending(interaction.guildId)) });
  },
};

module.exports = { handler };
