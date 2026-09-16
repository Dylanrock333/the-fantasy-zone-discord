const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { postWeeklyRecap } = require("../jobs/weeklyRecap");

// Manual trigger for testing the weekly recap without waiting for the cron
// job. Admin-only since it posts into the weekly-reports channel for real.
const command = {
  data: new SlashCommandBuilder()
    .setName("weeklyrecap")
    .setDescription("Manually run this week's league summary + power rankings into #weekly-reports")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "Running weekly recap...", ephemeral: true });
    try {
      const { week, teamCount } = await postWeeklyRecap(interaction.client, interaction.guildId);
      await interaction.editReply(`Posted week ${week} recap (${teamCount} teams ranked).`);
    } catch (err) {
      await interaction.editReply(`Weekly recap failed: ${err.message}`);
    }
  },
};

module.exports = { command };
