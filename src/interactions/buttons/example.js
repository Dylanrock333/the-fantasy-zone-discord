// Demo button handler (from /demo).
const { MessageFlags } = require("discord.js");

const handler = {
  customId: "example-button",
  async execute(interaction) {
    await interaction.reply({ content: "Button clicked!", flags: MessageFlags.Ephemeral });
  },
};

module.exports = { handler };
