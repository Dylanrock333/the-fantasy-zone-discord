// Discord's typing indicator expires after ~10s, so this keeps refreshing it
// until the wrapped work finishes.
const { settings } = require("../config");

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
