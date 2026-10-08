// Component builders and render logic for the standing "Pick Your Team" panel.
// The panel itself is static (no per-session state); picking happens in an
// ephemeral reply only the clicking member sees.
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const { settings } = require("../../config");

// PANEL_MARKER is the footer on the panel embed - how panelSetup.js recognizes an
// already-posted panel message across bot restarts, without a DB.
const PANEL_MARKER = "onboarding-team-picker-panel";

// The standing panel: instructions + a button that opens the ephemeral team-picker.
function renderPanel() {
  const embed = new EmbedBuilder()
    .setTitle("🏈 Pick Your Team")
    .setColor(0x5865f2) // Discord blurple
    .setFooter({ text: PANEL_MARKER })
    .setDescription(
      "Link your Discord account to your fantasy team so the bot always knows who's asking - " +
        "no more saying who you are every time.\n\n" +
        "Press **Pick Your Team** below. Only you'll see the list, and teams someone else already " +
        "claimed won't show up."
    );

  const button = new ButtonBuilder().setCustomId("onboarding:pickTeam").setLabel("Pick Your Team").setStyle(ButtonStyle.Primary);
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] };
}

// Ephemeral select menu of unclaimed teams, keyed by ESPN owner GUID (not team_id) so picking
// needs no extra lookup to resolve identity.
function buildTeamSelectMenu(teams) {
  const options = teams
    .slice(0, settings.panels.selectOptionCap)
    .map((t) => new StringSelectMenuOptionBuilder().setLabel(t.name.slice(0, 100)).setValue(t.owners[0].id));

  const menu = new StringSelectMenuBuilder().setCustomId("onboarding:teamSelect").setPlaceholder("Pick your team").addOptions(options);
  return { content: "Pick your team:", components: [new ActionRowBuilder().addComponents(menu)] };
}

module.exports = { PANEL_MARKER, renderPanel, buildTeamSelectMenu };
