// Demo modal submit handler: echoes the entered text.
const { MessageFlags } = require("discord.js");

const handler = {
  customId: "example-modal",
  async execute(interaction) {
    const value = interaction.fields.getTextInputValue("example-input");
    await interaction.reply({ content: `Modal submitted! You said: ${value || "(nothing)"}`, flags: MessageFlags.Ephemeral });
  },
};

module.exports = { handler };
