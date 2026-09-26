// Chat bridge logic: builds context, asks the fantasy agent, and replies in chunks.
const { logger } = require("../../utils/logger");
const { settings } = require("../../config");
const { sendChat } = require("../../utils/fantasyBotClient");
const { splitMessage } = require("../../utils/chunkedSend");
const { withTyping } = require("../../utils/typingIndicator");

// Fetches the bot's recent messages in the channel to use as chat context (no history stored locally).
async function getRecentBotMessages(channel, beforeId, botId, count = settings.chat.contextMessages, searchLimit = settings.chat.contextSearchLimit) {
  const fetched = await channel.messages.fetch({ limit: searchLimit, before: beforeId });
  return [...fetched.values()]
    .filter((m) => m.author.id === botId)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .slice(-count);
}

// Handles one user message: build context, ask the agent, send the reply.
async function handleMessage(message, guildConfig, content) {
  await withTyping(message.channel, async () => {
    const recentBotMessages = await getRecentBotMessages(message.channel, message.id, message.client.user.id);
    // Prepend the bot's recent replies so the agent knows what it last said here.
    const contextBlock = recentBotMessages.length
      ? `Context (my last ${recentBotMessages.length} messages in this channel):\n` +
        recentBotMessages.map((m) => `- ${m.content}`).join("\n") +
        "\n\n"
      : "";

    const reply = await sendChat(contextBlock + content, guildConfig.leagueId, message.channelId);
    for (const chunk of splitMessage(reply)) {
      await message.reply(chunk);
    }
  });
}

module.exports = { handleMessage };
