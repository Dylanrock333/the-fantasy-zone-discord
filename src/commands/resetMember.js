// /reset-member: admin tool to unlink a member and delete their private channel group.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { deleteMemberData } = require("../features/onboarding/channels");

const command = {
  data: new SlashCommandBuilder()
    .setName("reset-member")
    .setDescription("Unlink a member and delete their private channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((o) => o.setName("user").setDescription("Discord member to reset").setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser("user", true);
    await deleteMemberData(interaction.guild, user.id);
    await interaction.editReply(`Reset ${user.tag}: team link, private channels, and Member role removed.`);
  },
};

module.exports = { command };
