// Chat bridge trigger: forwards messages in the fantasy channel (or @mentions) to the chat feature.
const { Events } = require("discord.js");
const { logger } = require("../utils/logger");
const { GUILDS } = require("../config");
const { handleMessage } = require("../features/chat/handleMessage");

const name = Events.MessageCreate;
const once = false;

async function execute(message) {
  if (message.author.bot) return;

  const guildConfig = GUILDS[message.guildId]; // undefined for DMs and unconfigured guilds
  if (!guildConfig) return;

  const inFantasyChannel = message.channelId === guildConfig.chatChannelId;
  const mentioned = message.mentions.has(message.client.user);
  if (!inFantasyChannel && !mentioned) return;

  const content = mentioned
    ? message.content.replace(`<@${message.client.user.id}>`, "").trim()
    : message.content.trim();
  if (!content) return;

  try {
    await handleMessage(message, guildConfig, content);
  } catch (err) {
    logger.error("fantasy agent error:", err);
    await message.reply("Something went wrong talking to the fantasy agent.");
  }
}

module.exports = { name, once, execute };
