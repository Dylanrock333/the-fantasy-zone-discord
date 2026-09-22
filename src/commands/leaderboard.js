const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { postLeaderboard, SORT_LABELS, DEFAULT_SORT } = require("../jobs/leaderboard");

// Manual trigger for posting a position leaderboard into the leaderboard
// channel. Admin-only since it posts into that channel for real.
const command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Post the top fantasy players at a position into the leaderboard channel")
    .addStringOption((option) =>
      option
        .setName("position")
        .setDescription("Position to rank")
        .setRequired(true)
        .addChoices(
          { name: "QB", value: "QB" },
          { name: "RB", value: "RB" },
          { name: "WR", value: "WR" },
          { name: "TE", value: "TE" },
          { name: "K", value: "K" },
          { name: "DEF", value: "D/ST" }
        )
    )
    .addIntegerOption((option) =>
      option.setName("count").setDescription("How many players to list (default 15)").setMinValue(5).setMaxValue(25)
    )
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription("How to rank players (default: Total Points)")
        .addChoices(...Object.entries(SORT_LABELS).map(([value, name]) => ({ name, value })))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "Running leaderboard...", flags: MessageFlags.Ephemeral });
    const position = interaction.options.getString("position", true);
    const count = interaction.options.getInteger("count") ?? 15;
    const sortBy = interaction.options.getString("sort") ?? DEFAULT_SORT;
    try {
      const { label, sortLabel, count: postedCount } = await postLeaderboard(
        interaction.client,
        interaction.guildId,
        position,
        count,
        sortBy
      );
      await interaction.editReply(`Posted ${label} leaderboard ranked by ${sortLabel} (${postedCount} players).`);
    } catch (err) {
      await interaction.editReply(`Leaderboard failed: ${err.message}`);
    }
  },
};

module.exports = { command };
