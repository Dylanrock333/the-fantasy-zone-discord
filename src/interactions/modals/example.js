const handler = {
  customId: "example-modal",
  async execute(interaction) {
    const value = interaction.fields.getTextInputValue("example-input");
    await interaction.reply({ content: `Modal submitted! You said: ${value || "(nothing)"}`, ephemeral: true });
  },
};

module.exports = { handler };
