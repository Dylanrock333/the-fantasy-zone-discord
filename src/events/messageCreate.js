const { Events } = require("discord.js");
const { logger } = require("../utils/logger");
const { askFantasyAgent, renderChartImage } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { extractChartBlocks } = require("../utils/chartRenderer");
const { withTyping } = require("../utils/typingIndicator");
const { getServerConfig } = require("../config/servers");

const name = Events.MessageCreate;
const once = false;

// Pulls the bot's last N messages in this channel straight from Discord's
// API, so we don't need to persist any history ourselves.
async function getRecentBotMessages(channel, beforeId, botId, count = 5, searchLimit = 10) {
  const fetched = await channel.messages.fetch({ limit: searchLimit, before: beforeId });
  return [...fetched.values()]
    .filter((m) => m.author.id === botId)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .slice(-count);
}

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

  try {
    await withTyping(message.channel, async () => {
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

      const reply = await askFantasyAgent(contextBlock + content, serverConfig.leagueId);
      const { text, charts } = extractChartBlocks(reply);

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

      const chunks = text ? splitMessage(text) : [];
      if (!chunks.length && files.length) {
        await message.reply({ files });
      } else {
        for (let i = 0; i < chunks.length; i++) {
          const isLast = i === chunks.length - 1;
          await message.reply(isLast && files.length ? { content: chunks[i], files } : chunks[i]);
        }
      }
    });
  } catch (err) {
    logger.error("fantasy agent error:", err);
    await message.reply("Something went wrong talking to the fantasy agent.");
  }
}

module.exports = { name, once, execute };
