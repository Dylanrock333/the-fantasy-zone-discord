# Technical Docs: the-fantasy-zone-discord

Node 20 / discord.js 14 / node-cron 4 / dotenv. CommonJS. No DB, no tests. Env: `APP_ENV` (`prod`|`test`, required), `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` (deploy script only), `FANTASY_AGENT_URL` (default `http://localhost:8787`).

## 1. Features & responsibilities

Bot is responsible for (Discord side):
- Chat bridge: forwards fantasy-channel messages / @mentions to the API, replies with the result.
- Scheduled posts: Tuesday weekly recap, Thursday matchup preview (image + text) per guild.
- Player leaderboard: self-healing channel panel (selects + Search button) and `/leaderboard`.
- Trade-compare: standing embed panel (team/player selects) that asks the API for an AI trade take.
- Admin slash commands (`/weeklyrecap`, `/matchup-preview`, `/clear`), `/ping`, `/uptime`, `/help`.
- Message chunking (2000 char), typing indicator, per-guild config, in-memory UI state (pending picks, sessions, 5-min leaderboard cache).

Delegated to fantasy-bot API: all ESPN/league data, LLM chat + memory (keyed by channel ID), recap/preview/power-ranking generation and images (base64), leaderboard ranking, league teams/rosters, current-week calculation (week=0).

## 2. Repo tree map

Rule: triggers (events, commands, interactions, cron) stay thin and call logic in `features/` (or `jobs/` for scheduled reports).

```
/
├── package.json               deps + scripts: dev, start, deploy-commands
├── Dockerfile                 node:20-slim, npm ci --omit=dev, runs src/index.js
├── README.md                  overview, command table, architecture
├── .env.example               env var names (values blank)
├── .githooks/commit-msg       strips AI-attribution trailers from commits
├── .beads/                    beads issue-tracker scaffolding (not runtime)
└── src/
    ├── index.js               entry: client (Guilds, GuildMessages, MessageContent; Message/Channel partials), load handlers, login, start cron
    ├── deploy-commands.js     one-off: registers src/commands as guild commands for every guild in this APP_ENV's GUILDS
    ├── config/
    │   ├── default.js         shared settings: schedules, leaderboard, chat, recap, panels, limits
    │   ├── prod.js / test.js  guilds + any overrides, deep-merged over default.js (arrays/scalars replace); test.js holds both guilds, prod.js only main
    │   └── index.js           loads dotenv, picks file by APP_ENV, validates (cron, guild fields), freezes; exports env, requireEnv, settings, GUILDS, getGuildConfig
    ├── commands/              slash-command triggers: clear, help, leaderboard, matchuppreview, ping, uptime, weeklyrecap
    ├── events/                Discord event triggers
    │   ├── ready.js               ClientReady: sync leaderboard panel + ensure trade-compare panel
    │   ├── interactionCreate.js   routes command/button/modal/select by name or customId; generic ephemeral error reply
    │   ├── messageCreate.js       chat trigger: filters, then calls features/chat
    │   └── messageDelete.js       re-posts trade-compare panel if deleted
    ├── interactions/          component triggers keyed by customId (file exports `handler` or a `handlers` array)
    │   ├── buttons/leaderboard/   leaderboardSearch
    │   ├── buttons/tradeCompare/  cancel, compare, editPrompt
    │   ├── selects/               leaderboard.js (position/sort/count), tradeCompare.js (team + players, A and B)
    │   └── modals/                tradeComparePromptModal
    ├── features/              feature logic
    │   ├── chat/handleMessage.js      context fetch, agent call, chunked reply
    │   ├── leaderboard/
    │   │   ├── data.js                labels, 5-min response cache, prefetch, getLeaderboardText
    │   │   ├── panel.js               buildPanelComponents, sendLeaderboardPanel, syncLeaderboardPanel(+ForAllGuilds), showLeaderboardResults
    │   │   ├── state.js               per-guild pending picks
    │   │   └── selectHandler.js       makeSelectHandler(customId, field, parse)
    │   └── tradeCompare/
    │       ├── panel.js               embed + component builders, buildTradeMessage prompt
    │       ├── panelSetup.js          find/post/recover standing panel per guild
    │       ├── state.js               sessions Map, panel-by-guild Map, newSession/emptyPicks, withSession guard
    │       ├── pick.js                pickTeam / pickPlayers for side A or B
    │       └── compare.js             runCompare: lock panel, ask agent, render result + follow-ups
    ├── jobs/                  scheduled report logic (used by cron and the manual commands)
    │   ├── weeklyRecap.js         postWeeklyRecap + ForAllGuilds
    │   ├── matchupPreview.js      postMatchupPreview + ForAllGuilds; feeds last recap text as context
    │   └── scheduler.js           two node-cron schedules
    └── utils/
        ├── fantasyBotClient.js    one request() helper + a wrapper per API endpoint (sendChat, getLeaderboard, ...)
        ├── loaders.js             recursive readdir loaders for commands/events/buttons/modals/selects
        ├── chunkedSend.js         splitMessage, sendChunked, replyChunked
        ├── forEachGuild.js        forEachGuild(client, fn, label)
        ├── imageUtils.js          base64 -> AttachmentBuilder
        ├── typingIndicator.js     withTyping: refresh typing every 8s
        └── logger.js              console wrapper
```

## 3. Command map

Slash commands (all guild-registered via `npm run deploy-commands`). No prefix commands. Permission = Discord default member permission (server admins can override in Integrations UI); no in-code checks.

| Command | Options | Permission | Does | Calls |
|---|---|---|---|---|
| `/leaderboard` | `position` (QB/RB/WR/TE/K/DEF->"D/ST", req), `count` (int 5-25, def 15), `sort` (points/avg_points/projected_points/percent_owned, def points) | ManageGuild | Posts top-N leaderboard in current channel, split into follow-ups if long | `getLeaderboardText` -> `POST /api/leaderboard` (5-min promise cache) |
| `/weeklyrecap` | none | ManageGuild | Runs recap now into weeklyReportsChannel | `postWeeklyRecap` -> `POST /api/weekly-recap` |
| `/matchup-preview` | none | ManageGuild | Runs preview now into matchupChannel | `postMatchupPreview` -> `POST /api/matchup-preview` |
| `/clear` | none | ManageMessages | `bulkDelete(100, true)` in current channel, ephemeral result | Discord only |
| `/ping` | none | everyone | "Pong!" | none |
| `/uptime` | none | everyone | Ephemeral process uptime in minutes | none |
| `/help` | none | everyone | Ephemeral list of registered commands | none |

Component handlers (customId -> action):

| customId | Type | Does | API |
|---|---|---|---|
| `leaderboard-position-select` / `-sort-select` / `-count-select` | select | store per-guild pending pick, redraw panel, prefetch | `POST /api/leaderboard` (prefetch) |
| `leaderboard-search-button` | button | requires position; edits panel in place with result | `POST /api/leaderboard` (cached) |
| `tradeCompare:teamSelectA` / `B` | select | reject same team; load roster into session | `GET /api/league/{id}/teams/{tid}/players` |
| `tradeCompare:playerSelectA` / `B` | select | store selected player IDs | none |
| `tradeCompare:compare` | button | lock panel, send trade prompt, show reply in embed field (<=1000 chars) + follow-ups | `POST /api/chat` |
| `tradeCompare:editPrompt` / `tradeCompare:promptModal` | button / modal | edit custom prompt (<=1000 chars) | none |
| `tradeCompare:cancel` | button | reset session to fresh | none |

Non-slash trigger: any non-bot message in `chatChannelId` or @mentioning the bot (see section 4).

## 4. Feature / channel map

Per-guild config lives in `src/config/<APP_ENV>.js` and each process sees only its own environment's guilds. Currently `test.js` lists both guilds below (the original two, IDs unchanged since the first commit) and `prod.js` lists only the main guild. Same `leagueId` 1992397255 in both:

| Field | Purpose | main guild `1544547612659679294` | test guild `1547852208677199943` |
|---|---|---|---|
| `chatChannelId` | chat channel (all messages answered) | 1544548090025877604 | 1548100929906151537 |
| `weeklyReportsChannelId` | Tuesday recap; also read for last recap text | 1549139619004686366 | 1549126393076654130 |
| `matchupChannelId` | Thursday preview | 1549303658452222003 | 1550018778983702548 |
| `leaderboardChannelId` | standing leaderboard panel | 1551612311863558356 | 1551612094900600984 |
| `tradeCompareChannelId` | standing trade-compare panel | omitted (disabled, logs warn; absent in both prod.js and test.js) | 1550331446365917224 |
| `leagueId` | passed to every API call | yes | yes |

`getGuildConfig(guildId, requiredField)` throws if guild or the field is missing.

Message flow (`events/messageCreate.js` -> `features/chat/handleMessage.js`):
1. Ignore bots; guild config lookup; proceed only if in `chatChannelId` or bot is @mentioned; strip mention; skip empty.
2. `withTyping` -> fetch last 10 channel msgs before this one, keep bot's last 5 as text "Context" block (no local history).
3. `sendChat(context + content, leagueId, channelId)` -> `POST /api/chat` (session_id = channel ID).
4. `splitMessage(reply)` (2000 cap, cut at newline); `message.reply` each chunk.
5. Any error -> "Something went wrong talking to the fantasy agent."

Scheduled jobs (`jobs/scheduler.js`, node-cron; run for every guild in GUILDS, per-guild failure isolated by `forEachGuild`):

| Job | Schedule | Channel | Posts |
|---|---|---|---|
| Weekly recap | `0 0 * * 2` (Tue 00:00, server-local TZ, no tz set) | weeklyReportsChannelId | power-rankings PNG + "Week N League Summary" text |
| Matchup preview | `0 17 * * 4` America/Chicago (Thu 17:00) | matchupChannelId | matchup PNG + "Week N Matchups Ahead" text; passes latest bot message in weeklyReports channel as `previous_recap_context` |

Other event handlers:
- `ClientReady` (`ready.js`): logs tag; `syncLeaderboardPanelForAllGuilds` (scan last 20 msgs, post panel or rebuild if components/options outdated); `ensureTradePanelForAllGuilds` (trade-compare: scan last 50 msgs for embed footer `trade-compare-panel`, reuse or post; fetches `GET /api/league/{id}/teams`).
- `InteractionCreate`: dispatch by type/customId; error -> ephemeral "Something went wrong."
- `MessageDelete`: if deleted message is a tracked trade-compare panel, drop session and repost.
- Trade-compare state is in-memory; restart resets panel to fresh session.

API endpoints used: `POST /api/chat`, `/api/weekly-recap`, `/api/matchup-preview`, `/api/leaderboard`; `GET /api/league/{id}/teams`, `/api/league/{id}/teams/{tid}/players`.

## Audit notes (open items)

- `features/tradeCompare/panel.js`: selects are silently capped at `settings.panels.selectOptionCap` (25) options.
- The main guild is duplicated in `prod.js` and `test.js` (and omits `tradeCompareChannelId`); `panelSetup.js` also checks a `TEMP_` prefix that no config uses.
- Weekly recap cron has no timezone while preview uses America/Chicago.
- `.beads/` and `.githooks/` tooling is unrelated to runtime (Dockerfile only copies `src`).
- Naming leftovers: `jobs/` holds only report posts; `commands/weeklyrecap.js` / `matchuppreview.js` are unhyphenated vs. their job files; `withSession` lives in `tradeCompare/state.js` but is a guard, not state; env var is still `FANTASY_AGENT_URL`.
- `jobs/weeklyRecap.js` and `jobs/matchupPreview.js` share a fetch / post image / `sendChunked` shape; left separate since they differ enough.

## Backlog: code debt

- Consider moving `jobs/` to `features/recap` + `features/matchup`, and `withSession` to its own file.
- Give the weekly recap cron an explicit timezone.

## Recent refactor (resolved)

- Removed `/demo` and example handlers; added `/uptime` and `/help`.
- Leaderboard moved from `jobs/` to `features/leaderboard/` (data, panel, state, selectHandler).
- Chat logic extracted from `messageCreate.js` to `features/chat/handleMessage.js`; trade-compare logic to `compare.js` / `pick.js`; `withSession` guard replaced 7 copies of the expired-panel check.
- Selects consolidated to `selects/leaderboard.js` and `selects/tradeCompare.js`; loader accepts `handlers` arrays and recurses into subfolders.
- Central config: `config/` (default, prod, test, index) driven by required `APP_ENV`; all env reads and tunable constants moved there.
- `fantasyBotClient.js` deduplicated onto one `request()` helper (all errors now include API detail).
- `messageCreate.js` returns quietly for DMs and unconfigured guilds (was an unhandled throw).
- `panel.js` `playerNames` merged into `selectedNames`.
- Renames: `askFantasyAgent`->`sendChat`, `SERVERS`->`GUILDS`, `bootstrap.js`->`panelSetup.js`, `runForAllGuilds`->`forEachGuild`, `splitMessage.js`->`chunkedSend.js`.
