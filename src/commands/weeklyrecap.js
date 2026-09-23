// /weeklyrecap: runs the weekly recap on demand, outside the Tuesday cron (admin-only).
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { postWeeklyRecap } = require("../jobs/weeklyRecap");

const command = {
  data: new SlashCommandBuilder()
    .setName("weeklyrecap")
    .setDescription("Manually run this week's league summary + power rankings into #weekly-reports")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "Running weekly recap...", flags: MessageFlags.Ephemeral });
    try {
      const { week, teamCount } = await postWeeklyRecap(interaction.client, interaction.guildId);
      await interaction.editReply(`Posted week ${week} recap (${teamCount} teams ranked).`);
    } catch (err) {
      await interaction.editReply(`Weekly recap failed: ${err.message}`);
    }
  },
};

module.exports = { command };
