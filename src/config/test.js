// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    //Brotherhood of the gridiron (TEST)
    "1554504461236310036": {
      mainChatChannelId: "1554504461236310038",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1554504461236310040",
      matchupChannelId: "1554504461236310041",
      leaderboardChannelId: "1554504461672644651",
      tradeCompareChannelId: "1554504461672644653",
      welcomeTeamPickerChannelId: "1556894516378607616"
    },
    //weenie huts jrs (TEST)
    "1558300894599057560": {
      mainChatChannelId: "1558300896348344393",
      leagueId: 565242447,
      weeklyReportsChannelId: "1558300896348344395",
      matchupChannelId: "1558300896834625647",
      leaderboardChannelId: "1558300897422082138",
      tradeCompareChannelId: "1558300897422082139",
      welcomeTeamPickerChannelId: "1558300896348344391"
    },
  },
};
