// /leaderboard: posts a position leaderboard into the current channel (admin-only).
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { settings } = require("../config");
const { getLeaderboardText, SORT_LABELS, DEFAULT_SORT, DEFAULT_SIZE } = require("../features/leaderboard/data");
const { replyChunked } = require("../utils/chunkedSend");

const command = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Post the top fantasy players at a position in this channel")
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
      option.setName("count").setDescription("How many players to list (default 15)").setMinValue(settings.leaderboard.minSize).setMaxValue(settings.leaderboard.maxSize)
    )
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription("How to rank players (default: Total Points)")
        .addChoices(...Object.entries(SORT_LABELS).map(([value, name]) => ({ name, value })))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.deferReply();
    const position = interaction.options.getString("position", true);
    const count = interaction.options.getInteger("count") ?? DEFAULT_SIZE;
    const sortBy = interaction.options.getString("sort") ?? DEFAULT_SORT;
    try {
      const { text } = await getLeaderboardText(interaction.guildId, position, sortBy, count);
      await replyChunked(interaction, text);
    } catch (err) {
      await interaction.editReply(`Leaderboard failed: ${err.message}`);
    }
  },
};

module.exports = { command };
