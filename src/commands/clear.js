const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete the last 100 messages in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // filterOld=true skips messages older than 14 days instead of throwing
    const deleted = await interaction.channel.bulkDelete(100, true);
    await interaction.editReply(`Deleted ${deleted.size} message(s).`);
  },
};

module.exports = { command };
