// Per-member private channel group: one category named "<Team Name> private channels"
// holding the member's private channels. Self-heals for linked members on startup, and
// deleteMemberData tears the whole group down when a member is reset or leaves.
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { GUILDS } = require("../../config");
const {
  getChannel,
  upsertChannel,
  deleteChannel,
  listChannelsForGuild,
  listUserTeamsForGuild,
  deleteUserTeam,
} = require("../../db");
const { forEachGuild } = require("../../utils/forEachGuild");
const { logger } = require("../../utils/logger");

// Private channel types and the names Discord shows for them. Trade-compare stays on the
// existing shared, guild-wide standing panel (tradeCompareChannelId) - it's a two-team
// comparison, not something one person owns privately, and that panel already resets per use.
// Starting with just one private channel; more can be added here later.
const PRIVATE_CHANNEL_NAMES = { chat: "🔒fantasy-bot" };
const CATEGORY_TYPE = "category";
const MEMBER_ROLE_NAME = "Member";
const ANCHOR_CATEGORY_PATTERN = /general|war.?room/i;

function categoryName(teamName) {
  return `${teamName || "Your team"} private channels`.slice(0, 100);
}

// Position new member categories right after the general/war-room category, if one exists.
function anchorPosition(guild) {
  const anchor = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && ANCHOR_CATEGORY_PATTERN.test(c.name));
  return anchor ? anchor.position : undefined;
}

function memberOverwrites(guild, discordUserId) {
  return [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: discordUserId, allow: [PermissionFlagsBits.ViewChannel] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel] },
  ];
}

// Returns the member's category channel, or null if it isn't in Discord anymore.
async function fetchRecorded(guild, discordUserId, channelType) {
  const row = getChannel(guild.id, channelType, discordUserId);
  if (!row) return null;
  return guild.channels.fetch(row.channel_id).catch(() => null);
}

// Creates the member's category if missing (or if the recorded one was deleted), and
// re-pins an existing one back above the anchor category if it has drifted - keeps every
// member's category grouped together even after manual reordering or new categories appear.
async function ensureMemberCategory(guild, discordUserId, teamName) {
  const existing = await fetchRecorded(guild, discordUserId, CATEGORY_TYPE);
  if (existing) {
    const position = anchorPosition(guild);
    if (position !== undefined && existing.position !== position) await existing.setPosition(position);
    return existing;
  }

  const category = await guild.channels.create({
    name: categoryName(teamName),
    type: ChannelType.GuildCategory,
    position: anchorPosition(guild),
    permissionOverwrites: memberOverwrites(guild, discordUserId),
  });
  upsertChannel({ guildId: guild.id, discordUserId, channelType: CATEGORY_TYPE, channelId: category.id });
  logger.info(`Created category "${category.name}" for user ${discordUserId} in guild ${guild.id}`);
  return category;
}

// Renames the member's category to match their current team. Channel names are fixed by type.
async function renameMemberCategory(guild, discordUserId, teamName) {
  const category = await fetchRecorded(guild, discordUserId, CATEGORY_TYPE);
  if (!category) return ensureMemberCategory(guild, discordUserId, teamName);
  if (category.name !== categoryName(teamName)) await category.setName(categoryName(teamName));
  return category;
}

// Ensures every private channel exists under the member's category (recreating any missing
// one) and matches PRIVATE_CHANNEL_NAMES' current name, so renaming an entry there renames
// everyone's channel on the next self-heal without them doing anything.
async function ensurePrivateChannels(guild, discordUserId, category) {
  for (const [channelType, name] of Object.entries(PRIVATE_CHANNEL_NAMES)) {
    const existing = await fetchRecorded(guild, discordUserId, channelType);
    if (existing) {
      if (existing.name !== name) await existing.setName(name);
      continue;
    }

    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: memberOverwrites(guild, discordUserId),
    });
    upsertChannel({ guildId: guild.id, discordUserId, channelType, channelId: channel.id });
    logger.info(`Created #${name} for user ${discordUserId} in guild ${guild.id}`);
  }
}

// Deletes any private channel whose type was removed from PRIVATE_CHANNEL_NAMES, so dropping
// an entry there tears down everyone's channel for it on the next self-heal.
async function removeObsoletePrivateChannels(guild, discordUserId) {
  const obsolete = listChannelsForGuild(guild.id).filter(
    (r) => r.discord_user_id === discordUserId && r.channel_type !== CATEGORY_TYPE && !(r.channel_type in PRIVATE_CHANNEL_NAMES)
  );
  for (const row of obsolete) {
    await guild.channels.delete(row.channel_id).catch(() => null);
    deleteChannel(guild.id, row.channel_type, discordUserId);
    logger.info(`Removed obsolete private channel (${row.channel_type}) for user ${discordUserId} in guild ${guild.id}`);
  }
}

// Full setup for one member: category, then the channels inside it, then drop anything stale.
async function ensureMemberGroup(guild, discordUserId, teamName) {
  const category = await ensureMemberCategory(guild, discordUserId, teamName);
  await ensurePrivateChannels(guild, discordUserId, category);
  await removeObsoletePrivateChannels(guild, discordUserId);
  return category;
}

// Grants the Member role if the server has one (no-op otherwise, logged once per call).
async function grantMemberRole(guild, discordUserId) {
  const role = guild.roles.cache.find((r) => r.name === MEMBER_ROLE_NAME);
  if (!role) return logger.warn(`No "${MEMBER_ROLE_NAME}" role in guild ${guild.id}; skipping role grant`);
  const member = await guild.members.fetch(discordUserId);
  await member.roles.add(role);
}

// Deletes everything tied to a member: channels, the category, DB rows, and the Member role.
// Used by reset and by guildMemberRemove.
async function deleteMemberData(guild, discordUserId) {
  const rows = listChannelsForGuild(guild.id).filter((r) => r.discord_user_id === discordUserId);
  for (const row of rows) {
    await guild.channels.delete(row.channel_id).catch(() => null);
    deleteChannel(guild.id, row.channel_type, discordUserId);
  }
  deleteUserTeam(guild.id, discordUserId);

  const role = guild.roles.cache.find((r) => r.name === MEMBER_ROLE_NAME);
  const member = await guild.members.fetch(discordUserId).catch(() => null);
  if (role && member) await member.roles.remove(role).catch(() => null);
}

// Self-heal sweep for one guild: every already-linked member (from the DB, not Discord's
// member list) gets their category and channels verified or recreated.
async function ensureMemberGroupsForGuild(client, guildId) {
  if (!GUILDS[guildId]) return;
  const guild = await client.guilds.fetch(guildId);

  for (const row of listUserTeamsForGuild(guildId)) {
    try {
      await ensureMemberGroup(guild, row.discord_user_id, row.team_name);
    } catch (err) {
      logger.error(`Private channel self-heal failed for user ${row.discord_user_id} in guild ${guildId}:`, err);
    }
  }
}

// Runs the self-heal sweep for every configured guild (on startup).
async function ensureMemberGroupsForAllGuilds(client) {
  await forEachGuild(client, ensureMemberGroupsForGuild, "Private channel self-heal");
}

module.exports = {
  ensureMemberCategory,
  renameMemberCategory,
  ensureMemberGroup,
  grantMemberRole,
  deleteMemberData,
  ensureMemberGroupsForAllGuilds,
};
