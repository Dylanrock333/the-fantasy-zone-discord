# The Fantasy Zone Discord Bot

Discord bot client for [fantasy-bot](https://github.com/Dylanrock333/fantasy-bot):
it calls that API's endpoints (`/api/chat`, `/api/weekly-recap`,
`/api/matchup-preview`) and renders the JSON back into Discord (slash
commands, scheduled jobs, poster images).

## Commands

| Command | Who | Does |
|---|---|---|
| `/leaderboard <position> [count] [sort]` | Manage Guild | Posts a top-players leaderboard for a position into the current channel |
| `/weeklyrecap` | Manage Guild | Runs the weekly recap on demand (same job as the Tuesday cron) |
| `/matchup-preview` | Manage Guild | Runs the matchup preview on demand (same job as the Thursday cron) |
| `/clear` | Manage Messages | Bulk-deletes the last 100 messages in the channel |
| `/ping` | anyone | Liveness check |
| `/uptime` | anyone | Shows how long the bot process has been up |
| `/help` | anyone | Lists the registered slash commands |

Outside slash commands:
- **Chat bridge** - any message in a guild's configured fantasy channel, or any
  message that @mentions the bot, is forwarded as a chat question to the
  fantasy-bot API and the reply is posted back.
- **Leaderboard panel** - a standing message in the leaderboard channel with
  position / ranking / count selects and a Search button (re-posted or repaired on startup).
- **Trade compare panel** - a standing embed where members pick two teams and
  players, then get an AI take on the trade (re-posted if deleted).
- **Scheduled posts** - weekly recap (Tue 00:00) and matchup preview (Thu 17:00 CT).

## Architecture

Triggers (events, commands, interactions, cron) stay thin and call feature
logic in `features/` (or `jobs/` for scheduled reports).

```
index.js                      Entry point: logs in, loads commands/events/handlers, starts cron jobs
events/                       Discord event triggers
  ready.js                      On login: syncs the leaderboard and trade-compare panels
  interactionCreate.js          Routes slash commands / buttons / modals / selects by name or customId
  messageCreate.js              Chat bridge trigger: filters, then calls features/chat
  messageDelete.js              Re-posts the trade-compare panel if it's deleted
commands/                     One file per slash command (table above), loaded automatically
interactions/                 Component handlers keyed by customId (a file exports `handler` or `handlers`)
  buttons/leaderboard/, buttons/tradeCompare/   Grouped by feature
  selects/leaderboard.js, selects/tradeCompare.js
  modals/tradeComparePromptModal.js
features/                     Feature logic
  chat/handleMessage.js         Context, agent call, chunked reply
  leaderboard/                  data.js (fetch + cache + text), panel.js (build/sync/results), state.js (pending picks), selectHandler.js
  tradeCompare/                 panel.js (render), panelSetup.js (post/recover), state.js (sessions, withSession),
                                pick.js (team/player picks), compare.js (run the comparison)
jobs/
  weeklyRecap.js, matchupPreview.js   Report logic, used by both cron and the manual commands
  scheduler.js                  node-cron schedules for the two report jobs
utils/
  fantasyBotClient.js           HTTP client for the fantasy-bot API (one shared request helper)
  loaders.js                    Auto-loads commands/events/button/modal/select handlers (recurses into subfolders)
  chunkedSend.js                Splits text to Discord's 2000-char limit (splitMessage, sendChunked, replyChunked)
  forEachGuild.js, typingIndicator.js, imageUtils.js, logger.js
config/                       default.js (shared settings), prod.js / test.js (guilds + overrides, picked by APP_ENV),
                                index.js (loads env + merged settings, validates, exports env / settings / GUILDS / getGuildConfig)
```

Flow for a chat message: `messageCreate` -> `features/chat/handleMessage` ->
`fantasyBotClient.sendChat` (calls the fantasy-bot API) ->
`chunkedSend.splitMessage` chunks long replies -> reply sent to Discord.

## Setup

```bash
npm install
cp .env.example .env   # fill in APP_ENV (prod|test), DISCORD_TOKEN, DISCORD_CLIENT_ID, FANTASY_AGENT_URL
npm run deploy-commands # registers slash commands with Discord
npm run dev             # or `npm start` for production
```

Requires a running [fantasy-bot](https://github.com/Dylanrock333/fantasy-bot)
instance reachable at `FANTASY_AGENT_URL`. Add each guild you run in to
`src/config/prod.js` or `test.js` (channel IDs + `leagueId`) before it'll respond.
Currently `test.js` lists both guilds and `prod.js` only the main one.
Tunables (cron schedules, cache TTL, limits) live in `src/config/default.js`; an env file only needs the values it overrides.

## Roadmap / infra TODOs

Cross-cutting ops work spanning this repo and
[fantasy-bot](https://github.com/Dylanrock333/fantasy-bot). Tracked here
(and mirrored in the fantasy-bot README) until there's a shared issue
tracker.

1. **Per-user private channels** - let a member get a private channel/thread
   with the bot (strategy chat, personal stats) that other league members
   can't read. Likely private threads or per-user permission overwrites
   created on demand, plus routing that user's commands/jobs into it.
2. **Prod vs. test deployments** - split into a prod deployment (real
   league list) and a test deployment (small set of leagues Dylan controls)
   so new features land in test first. Needs the bot to run as two
   processes with separate tokens/env and their own `src/config/prod.js` / `test.js` guild lists, each
   pointed at its own fantasy-bot API instance.
3. **Zero-downtime prod updates** - deploy changes to prod without a hard
   restart that drops in-flight interactions or the `node-cron` scheduler's
   jobs. Process-manager/rolling-deploy concern more than app code.
4. **Consolidate commands/commish tools** - unify admin (commissioner-only)
   commands and any "reset the server" style operations behind one
   consistent surface instead of ad hoc scripts/commands.
5. **(Bonus) One-click server duplication** - an endpoint that spins up a
   duplicate Discord server from a name + league id and returns a commish
   invite link. First joiner claims commish (1 per league, needs a
   succession/hierarchy plan for if they leave); team names get pulled in
   automatically; each subsequent joiner picks a team that then sticks to
   their Discord user id (admin-resettable) so the bot knows whose team is
   asking by default. Biggest lift of the five - needs a user/team/league
   identity model that doesn't exist yet on either side.
