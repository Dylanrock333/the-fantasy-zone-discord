const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { postMatchupPreview } = require("../jobs/matchupPreview");

// Manual trigger for running the matchup preview on demand, outside the
// Thursday cron. Admin-only since it posts into the matchup channel for real.
const command = {
  data: new SlashCommandBuilder()
    .setName("matchup-preview")
    .setDescription("Manually run this week's matchup preview into the matchup channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "Running matchup preview...", flags: MessageFlags.Ephemeral });
    try {
      const { week, matchupCount } = await postMatchupPreview(interaction.client, interaction.guildId);
      await interaction.editReply(`Posted week ${week} matchup preview (${matchupCount} matchups).`);
    } catch (err) {
      await interaction.editReply(`Matchup preview failed: ${err.message}`);
    }
  },
};

module.exports = { command };
