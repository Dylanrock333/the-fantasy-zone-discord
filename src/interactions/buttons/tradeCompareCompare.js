const { getSession, updateSession } = require("../../features/tradeCompare/state");
const { renderPanel, buildTradeMessage } = require("../../features/tradeCompare/panel");
const { askFantasyAgent } = require("../../utils/fantasyAgentClient");
const { splitMessage } = require("../../utils/splitMessage");
const { withTyping } = require("../../utils/typingIndicator");
const { logger } = require("../../utils/logger");

// Embed field values cap at 1024 chars - fit what we can there, overflow
// goes out as plain follow-up messages via splitMessage's 2000-char chunks.
const EMBED_FIELD_BUDGET = 1000;

const handler = {
  customId: "tradeCompare:compare",
  async execute(interaction) {
    const session = getSession(interaction.message.id);
    if (!session) {
      await interaction.update({ content: "This trade panel expired - it'll refresh automatically.", embeds: [], components: [] });
      return;
    }

    // Lock the panel immediately so a second click can't fire a second
    // request while the first is still in flight.
    updateSession(interaction.message.id, { status: "comparing" });
    await interaction.update(renderPanel(session, { locked: true }));

    try {
      const reply = await withTyping(interaction.channel, () =>
        askFantasyAgent(buildTradeMessage(session), session.leagueId)
      );
      const embedText = reply.length > EMBED_FIELD_BUDGET ? `${reply.slice(0, EMBED_FIELD_BUDGET)}…` : reply;
      updateSession(interaction.message.id, { status: "done" });
      await interaction.editReply(renderPanel(session, { resultText: embedText }));

      if (reply.length > EMBED_FIELD_BUDGET) {
        for (const chunk of splitMessage(reply.slice(EMBED_FIELD_BUDGET))) {
          await interaction.followUp(chunk);
        }
      }
    } catch (err) {
      logger.error("trade compare: /api/chat request failed:", err);
      updateSession(interaction.message.id, { status: "error" });
      await interaction.editReply(renderPanel(session, { error: "Something went wrong getting the AI take - hit Compare Trade to retry." }));
    }
  },
};

module.exports = { handler };
