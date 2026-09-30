// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    //Brotherhood of the gridiron (TEST)
    "1554504461236310036": {
      chatChannelId: "1554504461672644652",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1554504461236310040",
      matchupChannelId: "1554504461236310041",
      leaderboardChannelId: "1554504461672644651",
      tradeCompareChannelId: "1554504461672644653",
    },
    //weenie huts jrs (TEST)
    "1554504954113171488": {
      chatChannelId: "1554504954830655498",
      leagueId: 565242447,
      weeklyReportsChannelId: "1554504954570481837",
      matchupChannelId: "1554504954570481838",
      leaderboardChannelId: "1554504954570481843",
      tradeCompareChannelId: "1554504954830655499",
    },
  },
};
