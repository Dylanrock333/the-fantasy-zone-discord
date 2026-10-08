// /set-channel: admin tool to record a shared (whole-guild) or private (per-user) channel mapping.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { upsertChannel, CHANNEL_TYPES } = require("../db");

const command = {
  data: new SlashCommandBuilder()
    .setName("set-channel")
    .setDescription("Record a shared or per-user channel mapping")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("channel-type")
        .setDescription("Which feature this channel is for")
        .setRequired(true)
        .addChoices(...CHANNEL_TYPES.map((t) => ({ name: t, value: t })))
    )
    .addChannelOption((o) => o.setName("channel").setDescription("The channel to map").setRequired(true))
    .addUserOption((o) => o.setName("user").setDescription("Omit for a shared, guild-wide channel")),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelType = interaction.options.getString("channel-type", true);
    const channel = interaction.options.getChannel("channel", true);
    const user = interaction.options.getUser("user");

    upsertChannel({ guildId: interaction.guildId, discordUserId: user?.id, channelType, channelId: channel.id });
    const scope = user ? `private to ${user.tag}` : "shared guild-wide";
    await interaction.editReply(`Set \`${channelType}\` -> <#${channel.id}> (${scope}).`);
  },
};

module.exports = { command };
