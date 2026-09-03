const handler = {
  customId: "example-button",
  async execute(interaction) {
    await interaction.reply({ content: "Button clicked!", ephemeral: true });
  },
};

module.exports = { handler };
