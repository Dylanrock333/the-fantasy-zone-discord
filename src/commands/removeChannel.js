// /remove-channel: admin tool to delete a shared or per-user channel mapping.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { deleteChannel, CHANNEL_TYPES } = require("../db");

const command = {
  data: new SlashCommandBuilder()
    .setName("remove-channel")
    .setDescription("Delete a shared or per-user channel mapping")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("channel-type")
        .setDescription("Which feature's channel to remove")
        .setRequired(true)
        .addChoices(...CHANNEL_TYPES.map((t) => ({ name: t, value: t })))
    )
    .addUserOption((o) => o.setName("user").setDescription("Omit to remove the shared, guild-wide channel")),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelType = interaction.options.getString("channel-type", true);
    const user = interaction.options.getUser("user");

    deleteChannel(interaction.guildId, channelType, user?.id);
    const scope = user ? `private to ${user.tag}` : "shared guild-wide";
    await interaction.editReply(`Removed \`${channelType}\` (${scope}).`);
  },
};

module.exports = { command };
