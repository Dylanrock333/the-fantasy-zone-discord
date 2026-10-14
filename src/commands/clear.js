// /clear: bulk-deletes the channel's last 100 messages. Mods (Manage Messages) can run it
// anywhere; everyone else can only run it in their own private chat channel.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getChannel } = require("../db");

const command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete the last 100 messages in this channel")
    .setDefaultMemberPermissions(null),
  async execute(interaction) {
    const isMod = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
    const ownChannel = getChannel(interaction.guildId, "chat", interaction.user.id);
    if (!isMod && ownChannel?.channel_id !== interaction.channel.id) {
      return interaction.reply({ content: "You can only use /clear in your own channel.", flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // filterOld=true skips messages older than 14 days instead of throwing
    const deleted = await interaction.channel.bulkDelete(100, true);
    await interaction.editReply(`Deleted ${deleted.size} message(s).`);
  },
};

module.exports = { command };
