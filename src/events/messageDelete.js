const { Events } = require("discord.js");
const { findGuildByPanelMessageId, deleteSession } = require("../features/tradeCompare/state");
const { ensurePanel } = require("../features/tradeCompare/bootstrap");
const { logger } = require("../utils/logger");

const name = Events.MessageDelete;
const once = false;

// Self-heals the standing trade-compare panel if someone deletes it - no
// command is needed to bring it back.
async function execute(message) {
  const guildId = findGuildByPanelMessageId(message.id);
  if (!guildId) return;

  deleteSession(message.id);
  logger.info(`Trade compare panel deleted in guild ${guildId}, reposting...`);
  try {
    await ensurePanel(message.client, guildId);
  } catch (err) {
    logger.error(`Trade compare: failed to repost panel for guild ${guildId}:`, err);
  }
}

module.exports = { name, once, execute };
