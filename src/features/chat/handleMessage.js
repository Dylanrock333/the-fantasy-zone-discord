// Chat bridge logic: builds context, asks the fantasy agent, renders charts, and replies in chunks.
const { logger } = require("../../utils/logger");
const { settings } = require("../../config");
const { sendChat, renderChartImage } = require("../../utils/fantasyBotClient");
const { splitMessage } = require("../../utils/chunkedSend");
const { extractChartBlocks } = require("../../utils/chartBlocks");
const { withTyping } = require("../../utils/typingIndicator");

// Fetches the bot's recent messages in the channel to use as chat context (no history stored locally).
async function getRecentBotMessages(channel, beforeId, botId, count = settings.chat.contextMessages, searchLimit = settings.chat.contextSearchLimit) {
  const fetched = await channel.messages.fetch({ limit: searchLimit, before: beforeId });
  return [...fetched.values()]
    .filter((m) => m.author.id === botId)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .slice(-count);
}

// Renders each chart block to a PNG; falls back to attaching the raw JSON if rendering fails.
async function chartFiles(charts) {
  const files = [];
  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const name = (chart.title || `chart-${i + 1}`).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    try {
      files.push({ attachment: await renderChartImage(chart), name: `${name}.png` });
    } catch (err) {
      logger.error("chart image render failed:", err);
      files.push({ attachment: Buffer.from(JSON.stringify(chart, null, 2), "utf8"), name: `${name}.json` });
    }
  }
  return files;
}

// Handles one user message: build context, ask the agent, render charts, send the reply.
async function handleMessage(message, guildConfig, content) {
  await withTyping(message.channel, async () => {
    const recentBotMessages = await getRecentBotMessages(message.channel, message.id, message.client.user.id);
    const contextBlock = recentBotMessages.length
      ? `Context (my last ${recentBotMessages.length} messages in this channel):\n` +
        recentBotMessages.map((m) => `- ${m.content}`).join("\n") +
        "\n\n"
      : "";

    const reply = await sendChat(contextBlock + content, guildConfig.leagueId, message.channelId);
    const { text, charts } = extractChartBlocks(reply);
    const files = await chartFiles(charts);

    // Send the text in chunks, attaching any chart files to the last one (or alone if there's no text).
    const chunks = text ? splitMessage(text) : [];
    if (!chunks.length && files.length) {
      await message.reply({ files });
      return;
    }
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      await message.reply(isLast && files.length ? { content: chunks[i], files } : chunks[i]);
    }
  });
}

module.exports = { handleMessage };
