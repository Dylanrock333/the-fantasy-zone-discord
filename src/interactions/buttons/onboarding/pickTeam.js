// "Pick Your Team" button: opens an ephemeral select menu of unclaimed teams.
const { MessageFlags } = require("discord.js");
const { getGuildConfig } = require("../../../config");
const { getUserTeam, listUserTeamsForGuild } = require("../../../db");
const { getLeagueTeams } = require("../../../utils/fantasyBotClient");
const { buildTeamSelectMenu } = require("../../../features/onboarding/panel");
const { logger } = require("../../../utils/logger");

const handler = {
  customId: "onboarding:pickTeam",
  async execute(interaction) {
    const existing = getUserTeam(interaction.guildId, interaction.user.id);
    if (existing) {
      await interaction.reply({
        content: `You're already linked to **${existing.team_name || "your team"}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const config = getGuildConfig(interaction.guildId, "leagueId");
      const { teams } = await getLeagueTeams(config.leagueId);
      const claimed = new Set(listUserTeamsForGuild(interaction.guildId).map((row) => row.espn_owner_id));
      const unclaimed = teams.filter((t) => t.owners[0] && !claimed.has(t.owners[0].id));

      if (!unclaimed.length) {
        await interaction.editReply({ content: "Every team in this league is already claimed - ask an admin to check with `/set-team`." });
        return;
      }

      await interaction.editReply(buildTeamSelectMenu(unclaimed));
    } catch (err) {
      logger.error("onboarding: failed to load teams for picker:", err);
      await interaction.editReply({ content: "Could not load the team list - try again." });
    }
  },
};

module.exports = { handler };
