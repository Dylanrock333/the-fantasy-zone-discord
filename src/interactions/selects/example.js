const handler = {
  customId: "example-select",
  async execute(interaction) {
    const [value] = interaction.values;
    await interaction.reply({ content: `Selection made: ${value}`, ephemeral: true });
  },
};

module.exports = { handler };
