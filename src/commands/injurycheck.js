const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { postInjuryAlertsForAllGuilds } = require("../jobs/injuryAlerts");

// Manual trigger for running the injury check on demand, outside the
// 5-minute cron. Unlike /matchup-preview, this posts to *every* configured
// guild's injury channel, not just the invoking one - inherent to the
// injury job's "fetch once, fan out" design (injury data is NFL-wide, not
// league-specific). Admin-only since it posts for real.
const command = {
  data: new SlashCommandBuilder()
    .setName("injury-check")
    .setDescription("Manually run the injury check (posts to every configured guild's injury channel)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "Checking injuries...", flags: MessageFlags.Ephemeral });
    try {
      await postInjuryAlertsForAllGuilds(interaction.client);
      await interaction.editReply("Injury check complete.");
    } catch (err) {
      await interaction.editReply(`Injury check failed: ${err.message}`);
    }
  },
};

module.exports = { command };
