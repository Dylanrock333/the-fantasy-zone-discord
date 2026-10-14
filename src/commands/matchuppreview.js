// /matchup-preview: runs the matchup preview on demand, outside the Thursday cron (admin-only).
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { postMatchupPreview } = require("../jobs/matchupPreview");

const command = {
  data: new SlashCommandBuilder()
    .setName("matchup-preview")
    .setDescription("Manually run this week's matchup preview into the matchup channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((opt) =>
      opt.setName("week").setDescription("Week to run instead of the current week").setRequired(false)
    ),
  async execute(interaction) {
    await interaction.reply({ content: "Running matchup preview...", flags: MessageFlags.Ephemeral });
    try {
      const weekOverride = interaction.options.getInteger("week") ?? 0;
      const { week, matchupCount } = await postMatchupPreview(interaction.client, interaction.guildId, weekOverride);
      await interaction.editReply(`Posted week ${week} matchup preview (${matchupCount} matchups).`);
    } catch (err) {
      await interaction.editReply(`Matchup preview failed: ${err.message}`);
    }
  },
};

module.exports = { command };
