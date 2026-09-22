const { setPending, buildPanelComponents, getPending } = require("../../jobs/leaderboard");

const handler = {
  customId: "leaderboard-count-select",
  async execute(interaction) {
    const [size] = interaction.values;
    setPending(interaction.guildId, { size: Number(size) });
    await interaction.update({ components: buildPanelComponents(getPending(interaction.guildId)) });
  },
};

module.exports = { handler };
