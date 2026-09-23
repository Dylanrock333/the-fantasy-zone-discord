// Chat bridge: forwards messages in the fantasy channel (or @mentions) to the fantasy agent and replies.
const { Events } = require("discord.js");
const { logger } = require("../utils/logger");
const { askFantasyAgent, renderChartImage } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { extractChartBlocks } = require("../utils/chartRenderer");
const { getServerConfig } = require("../config/servers");

const name = Events.MessageCreate;
const once = false;

// Fetches the bot's recent messages in the channel to use as chat context (no history stored locally).
async function getRecentBotMessages(channel, beforeId, botId, count = 5, searchLimit = 10) {
  const fetched = await channel.messages.fetch({ limit: searchLimit, before: beforeId });
  return [...fetched.values()]
    .filter((m) => m.author.id === botId)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .slice(-count);
}

// Handles one user message: build context, ask the agent, render charts, send the reply.
async function execute(message) {
  if (message.author.bot) return;

  const serverConfig = message.guildId ? getServerConfig(message.guildId) : undefined;
  if (!serverConfig) return;

  const inFantasyChannel = message.channelId === serverConfig.channelId;
  const mentioned = message.mentions.has(message.client.user);
  if (!inFantasyChannel && !mentioned) return;

  const content = mentioned
    ? message.content.replace(`<@${message.client.user.id}>`, "").trim()
    : message.content.trim();
  if (!content) return;

  await message.channel.sendTyping();
  // Typing indicator expires after ~10s; keep refreshing it while the agent call runs.
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 8000);

  try {
    const recentBotMessages = await getRecentBotMessages(
      message.channel,
      message.id,
      message.client.user.id
    );
    const contextBlock = recentBotMessages.length
      ? `Context (my last ${recentBotMessages.length} messages in this channel):\n` +
        recentBotMessages.map((m) => `- ${m.content}`).join("\n") +
        "\n\n"
      : "";

    const reply = await askFantasyAgent(contextBlock + content, serverConfig.leagueId, message.channelId);
    const { text, charts } = extractChartBlocks(reply);

    // Render each chart block to a PNG; fall back to attaching the raw JSON if rendering fails.
    const files = [];
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      const name = (chart.title || `chart-${i + 1}`).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      try {
        files.push({ attachment: await renderChartImage(chart), name: `${name}.png` });
      } catch (err) {
        logger.error("chart image render failed:", err);
        files.push({
          attachment: Buffer.from(JSON.stringify(chart, null, 2), "utf8"),
          name: `${name}.json`,
        });
      }
    }

    // Send the text in chunks, attaching any chart files to the last one (or alone if there's no text).
    const chunks = text ? splitMessage(text) : [];
    if (!chunks.length && files.length) {
      await message.reply({ files });
    } else {
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        await message.reply(isLast && files.length ? { content: chunks[i], files } : chunks[i]);
      }
    }
  } catch (err) {
    logger.error("fantasy agent error:", err);
    await message.reply("Something went wrong talking to the fantasy agent.");
  } finally {
    clearInterval(typingInterval);
  }
}

module.exports = { name, once, execute };
