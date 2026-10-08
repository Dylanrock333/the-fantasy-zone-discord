// /set-team: admin tool to manually link a Discord user to their ESPN fantasy identity.
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { upsertUserTeam, getUserTeam } = require("../db");
const { getGuildConfig } = require("../config");
const { ensureMemberGroup, renameMemberCategory, grantMemberRole } = require("../features/onboarding/channels");

const command = {
  data: new SlashCommandBuilder()
    .setName("set-team")
    .setDescription("Link a Discord user to their ESPN fantasy team")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((o) => o.setName("user").setDescription("Discord member").setRequired(true))
    .addStringOption((o) => o.setName("espn-owner-id").setDescription("ESPN owner GUID, e.g. {80F60FFF-...}").setRequired(true))
    .addIntegerOption((o) => o.setName("team-id").setDescription("ESPN team id (optional, cached for display)"))
    .addStringOption((o) => o.setName("team-name").setDescription("Team name (optional, cached for display)")),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser("user", true);
    const espnOwnerId = interaction.options.getString("espn-owner-id", true);
    const teamId = interaction.options.getInteger("team-id");
    const teamName = interaction.options.getString("team-name");
    const { leagueId } = getGuildConfig(interaction.guildId, "leagueId");

    upsertUserTeam({ guildId: interaction.guildId, discordUserId: user.id, espnOwnerId, leagueId, teamId, teamName });
    const label = teamName ?? getUserTeam(interaction.guildId, user.id)?.team_name;
    await ensureMemberGroup(interaction.guild, user.id, label);
    if (teamName) await renameMemberCategory(interaction.guild, user.id, teamName);
    await grantMemberRole(interaction.guild, user.id);

    await interaction.editReply(`Linked ${user.tag} to ESPN owner \`${espnOwnerId}\`${teamName ? ` (${teamName})` : ""}.`);
  },
};

module.exports = { command };
