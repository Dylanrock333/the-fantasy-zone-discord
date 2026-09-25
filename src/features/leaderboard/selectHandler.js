// Builds a panel select handler: stores the pick as `field`, redraws the panel, and prefetches results.
const { setPending, getPending } = require("./state");
const { buildPanelComponents } = require("./panel");
const { prefetchLeaderboard } = require("./data");

function makeSelectHandler(customId, field, parse = String) {
  return {
    customId,
    async execute(interaction) {
      setPending(interaction.guildId, { [field]: parse(interaction.values[0]) });
      const pending = getPending(interaction.guildId);
      await interaction.update({ components: buildPanelComponents(pending) });
      prefetchLeaderboard(interaction.guildId, pending);
    },
  };
}

module.exports = { makeSelectHandler };
