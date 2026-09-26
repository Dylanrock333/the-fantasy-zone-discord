// Compare Trade flow: lock the panel, ask the agent for a take, render it (overflow goes out as follow-ups).
const { updateSession } = require("./state");
const { renderPanel, buildTradeMessage } = require("./panel");
const { sendChat } = require("../../utils/fantasyBotClient");
const { splitMessage } = require("../../utils/chunkedSend");
const { withTyping } = require("../../utils/typingIndicator");
const { logger } = require("../../utils/logger");
const { settings } = require("../../config");

// Embed field values cap at 1024 chars - fit what we can there, overflow
// goes out as plain follow-up messages via splitMessage's 2000-char chunks.
const EMBED_FIELD_BUDGET = settings.limits.embedFieldBudget;

// Compare Trade button: sends the trade to the agent and shows its reply on the panel.
async function runCompare(interaction, session) {
  const messageId = interaction.message.id;

  // Lock the panel immediately so a second click can't fire a second
  // request while the first is still in flight.
  updateSession(messageId, { status: "comparing" });
  await interaction.update(renderPanel(session, { locked: true }));

  try {
    const reply = await withTyping(interaction.channel, () =>
      sendChat(buildTradeMessage(session), session.leagueId, session.channelId)
    );
    const embedText = reply.length > EMBED_FIELD_BUDGET ? `${reply.slice(0, EMBED_FIELD_BUDGET)}…` : reply;
    updateSession(messageId, { status: "done" });
    await interaction.editReply(renderPanel(session, { resultText: embedText }));

    if (reply.length > EMBED_FIELD_BUDGET) {
      for (const chunk of splitMessage(reply.slice(EMBED_FIELD_BUDGET))) {
        await interaction.followUp(chunk);
      }
    }
  } catch (err) {
    logger.error("trade compare: /api/chat request failed:", err);
    updateSession(messageId, { status: "error" });
    await interaction.editReply(renderPanel(session, { error: "Something went wrong getting the AI take - hit Compare Trade to retry." }));
  }
}

module.exports = { runCompare };
