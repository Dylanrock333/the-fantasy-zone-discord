const { MessageFlags } = require("discord.js");

const handler = {
  customId: "example-select",
  async execute(interaction) {
    const [value] = interaction.values;
    await interaction.reply({ content: `Selection made: ${value}`, flags: MessageFlags.Ephemeral });
  },
};

module.exports = { handler };
