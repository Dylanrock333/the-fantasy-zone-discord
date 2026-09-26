// Keeps the "Bot is typing..." indicator showing while slow work (like an agent call) runs.
const { settings } = require("../config");

// Shows typing in channel until fn finishes, refreshing it before Discord's ~10s expiry; returns fn's result.
async function withTyping(channel, fn) {
  await channel.sendTyping();
  const interval = setInterval(() => {
    channel.sendTyping().catch(() => {});
  }, settings.chat.typingRefreshMs);

  try {
    return await fn();
  } finally {
    clearInterval(interval);
  }
}

module.exports = { withTyping };
