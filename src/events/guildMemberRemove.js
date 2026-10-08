// On leave or removal: delete the member's team link and private channel group.
const { Events } = require("discord.js");
const { deleteMemberData } = require("../features/onboarding/channels");
const { logger } = require("../utils/logger");

const name = Events.GuildMemberRemove;
const once = false;

async function execute(member) {
  try {
    await deleteMemberData(member.guild, member.id);
  } catch (err) {
    logger.error(`Failed to clean up member ${member.id} in guild ${member.guild.id}:`, err);
  }
}

module.exports = { name, once, execute };
