// Component builders and render logic for the trade-compare standing panel.
// renderPanel is a pure function of session state - every interaction
// handler ends by calling it and pushing the result back onto the panel
// message (interaction.update, or interaction.editReply once already
// acknowledged).
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

// Footer marker on every panel embed - how bootstrap.js recognizes an
// already-posted panel message across bot restarts, without a DB.
const PANEL_MARKER = "trade-compare-panel";

const DEFAULT_PROMPT =
  "what do you think of this trade, take into consideration the team and pull in player stats";

function buildTeamSelectRow(customId, teams, selectedId, placeholder) {
  const options = teams.slice(0, 25).map((t) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(t.name.slice(0, 100))
      .setValue(String(t.id))
      .setDefault(t.id === selectedId)
  );
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(options);
  return new ActionRowBuilder().addComponents(menu);
}

function buildPlayerSelectRow(customId, roster, selectedIds, placeholder) {
  const capped = roster.slice(0, 25);
  const options = capped.map((p) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${p.name} (${p.position})`.slice(0, 100))
      .setValue(String(p.id))
      .setDefault(selectedIds.includes(p.id))
  );
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(capped.length)
    .addOptions(options);
  return new ActionRowBuilder().addComponents(menu);
}

function buildActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("tradeCompare:compare").setLabel("Compare Trade").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("tradeCompare:editPrompt").setLabel("Edit Prompt").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tradeCompare:cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
  );
}

function describeSelection(roster, selectedIds) {
  const names = selectedIds
    .map((id) => roster.find((p) => p.id === id)?.name)
    .filter(Boolean);
  return names.length ? names.join(", ") : "*(none selected)*";
}

function playerNames(roster, selectedIds) {
  return selectedIds
    .map((id) => roster.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

// The exact text sent to fantasy-bot's /api/chat. States the trade from
// both directions on purpose - the personality node requires every fact to
// come from tool results, not inference, so spelling out both sides
// minimizes the chance the model has to infer who's giving up what.
function buildTradeMessage(session) {
  const aGives = playerNames(session.rosterA, session.selectedA);
  const bGives = playerNames(session.rosterB, session.selectedB);
  return (
    `Hypothetical trade: ${session.teamA.name} would trade away ${aGives} and receive ${bGives} ` +
    `from ${session.teamB.name} (who would trade away ${bGives} and receive ${aGives}).\n\n` +
    session.prompt
  );
}

function renderPanel(session, { locked = false, error = null, resultText = null } = {}) {
  const embed = new EmbedBuilder()
    .setTitle("🔀 Trade Compare")
    .setColor(0x5865f2)
    .setFooter({ text: PANEL_MARKER })
    .setDescription(locked ? "Comparing trade..." : "Pick teams and players, then hit **Compare Trade**.");

  const fields = [
    { name: "Team A", value: session.teamA ? session.teamA.name : "*(pick a team below)*", inline: true },
    { name: "Team B", value: session.teamB ? session.teamB.name : "*(pick a team once Team A is set)*", inline: true },
  ];

  if (session.teamA) {
    fields.push({ name: `${session.teamA.name} gives up`, value: describeSelection(session.rosterA, session.selectedA) });
  }
  if (session.teamB) {
    fields.push({ name: `${session.teamB.name} gives up`, value: describeSelection(session.rosterB, session.selectedB) });
  }
  if (session.teamA && session.teamB) {
    fields.push({
      name: "Prompt",
      value: session.prompt === DEFAULT_PROMPT ? `*${session.prompt}*` : session.prompt,
    });
  }
  if (error) fields.push({ name: "⚠️ Error", value: error });
  if (resultText) fields.push({ name: "🤖 AI take", value: resultText });

  embed.addFields(fields);

  const rows = [];
  if (!locked) {
    rows.push(buildTeamSelectRow("tradeCompare:teamSelectA", session.teams, session.teamA?.id, "Pick Team A"));
    if (session.teamA) {
      rows.push(
        buildPlayerSelectRow("tradeCompare:playerSelectA", session.rosterA, session.selectedA, `${session.teamA.name} roster`)
      );
      rows.push(buildTeamSelectRow("tradeCompare:teamSelectB", session.teams, session.teamB?.id, "Pick Team B"));
    }
    if (session.teamB) {
      rows.push(
        buildPlayerSelectRow("tradeCompare:playerSelectB", session.rosterB, session.selectedB, `${session.teamB.name} roster`)
      );
    }
    if (session.selectedA.length && session.selectedB.length) {
      rows.push(buildActionRow());
    }
  } else {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("tradeCompare:cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger).setDisabled(true)
      )
    );
  }

  return { embeds: [embed], components: rows };
}

module.exports = {
  PANEL_MARKER,
  DEFAULT_PROMPT,
  renderPanel,
  buildTradeMessage,
};
