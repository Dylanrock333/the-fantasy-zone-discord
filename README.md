# The Fantasy Zone Discord Bot

Discord bot client for [fantasy-bot](https://github.com/Dylanrock333/fantasy-bot):
it calls that API's endpoints (`/api/chat`, `/api/chart`, `/api/weekly-recap`,
`/api/matchup-preview`) and renders the JSON back into Discord (slash
commands, scheduled jobs, chart/poster images).

## Commands

| Command | Who | Does |
|---|---|---|
| `/leaderboard <position> [count] [sort]` | Manage Guild | Posts a top-players leaderboard for a position into the current channel |
| `/weeklyrecap` | Manage Guild | Runs the weekly recap on demand (same job as the Tuesday cron) |
| `/matchup-preview` | Manage Guild | Runs the matchup preview on demand (same job as the Thursday cron) |
| `/clear` | Manage Messages | Bulk-deletes the last 100 messages in the channel |
| `/ping` | anyone | Liveness check |
| `/demo` | anyone | Sample buttons/select/modal, for reference when building new components |

Outside slash commands: any message in a guild's configured fantasy channel,
or any message that @mentions the bot, is forwarded as a chat question to
the fantasy-bot API and the reply (plus any chart images) is posted back.

## Architecture

```
index.js                    Entry point: logs in, loads commands/events/handlers, starts cron jobs
events/
  ready.js                    On login: ensures each guild has a leaderboard panel
  interactionCreate.js        Routes slash commands / buttons / modals / selects to their handler
  messageCreate.js            Chat bridge: fantasy-channel or @mention messages -> fantasy-bot API -> reply
commands/                   One file per slash command (table above), loaded automatically
jobs/
  scheduler.js                node-cron schedules: weekly recap (Tue 00:00), matchup preview (Thu 17:00 CT)
  weeklyRecap.js, matchupPreview.js, leaderboard.js   Job logic + "for all guilds" variants used by both cron and manual commands
utils/
  fantasyAgentClient.js       HTTP client for the fantasy-bot API (chat, chart, recap, preview)
  chartRenderer.js            Extracts ```chart``` JSON blocks from agent replies, renders to PNG
  loaders.js                   Auto-loads commands/events/button/modal/select handlers from disk
  splitMessage.js, logger.js, imageUtils.js, guildJobs.js
config/servers.js           Per-guild config: channel IDs + fantasy-bot league id (see TODO: move to DB)
```

Flow for a chat message: `messageCreate` -> `fantasyAgentClient.askFantasyAgent`
(calls the fantasy-bot API) -> `chartRenderer` pulls out any chart blocks ->
`splitMessage` chunks long replies -> reply sent to Discord.

## Setup

```bash
npm install
cp .env.example .env   # fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, FANTASY_AGENT_URL
npm run deploy-commands # registers slash commands with Discord
npm run dev             # or `npm start` for production
```

Requires a running [fantasy-bot](https://github.com/Dylanrock333/fantasy-bot)
instance reachable at `FANTASY_AGENT_URL`. Add each guild you run in to
`src/config/servers.js` (channel IDs + `leagueId`) before it'll respond.

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
   processes with separate tokens/env/`src/config/servers.js` lists, each
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
