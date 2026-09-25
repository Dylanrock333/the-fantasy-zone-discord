// /help: lists the registered slash commands.
const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const command = {
  data: new SlashCommandBuilder().setName("help").setDescription("List available commands"),
  async execute(interaction) {
    const lines = interaction.client.commands.map((c) => `/${c.data.name}: ${c.data.description}`);
    await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral });
  },
};

module.exports = { command };
