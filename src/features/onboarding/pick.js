// Handles the onboarding team-picker selection: links the user, then provisions their
// private channels. Re-fetches the live team list because the select menu's value only
// carries the chosen ESPN owner id, not the full team object.
const { getGuildConfig } = require("../../config");
const { upsertUserTeam } = require("../../db");
const { getLeagueTeams } = require("../../utils/fantasyBotClient");
const { ensureMemberGroup, grantMemberRole } = require("./channels");
const { logger } = require("../../utils/logger");

async function handlePickTeam(interaction) {
  await interaction.deferUpdate();

  const espnOwnerId = interaction.values[0];
  const config = getGuildConfig(interaction.guildId, "leagueId");
  const { teams } = await getLeagueTeams(config.leagueId);
  const team = teams.find((t) => t.owners[0]?.id === espnOwnerId);

  upsertUserTeam({
    guildId: interaction.guildId,
    discordUserId: interaction.user.id,
    espnOwnerId,
    leagueId: config.leagueId,
    teamId: team?.id ?? null,
    teamName: team?.name ?? null,
  });

  try {
    await ensureMemberGroup(interaction.guild, interaction.user.id, team?.name);
    await grantMemberRole(interaction.guild, interaction.user.id);
  } catch (err) {
    logger.error("onboarding: failed to create private channel group:", err);
  }

  await interaction.editReply({ content: `Linked to **${team?.name ?? "your team"}**! Your private channels are ready.`, components: [] });
}

module.exports = { handlePickTeam };
