// /uptime: how long the bot process has been running.
const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const command = {
  data: new SlashCommandBuilder().setName("uptime").setDescription("Show how long the bot has been up"),
  async execute(interaction) {
    const mins = Math.floor(process.uptime() / 60);
    await interaction.reply({ content: `Up ${mins} min.`, flags: MessageFlags.Ephemeral });
  },
};

module.exports = { command };
