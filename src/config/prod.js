// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    // TODO DELETE (PHI PSI)
    "1544547612659679294": {
      mainChatChannelId: "1544547613724909621",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549139619004686366",
      matchupChannelId: "1549303658452222003",
      leaderboardChannelId: "1551612311863558356",
      tradeCompareChannelId: "1552423423240708166",
    },
    //TODO DELETE (weenie huts jrs)
    "1552814146477629463": {
      mainChatChannelId: "1552814147421474817",
      leagueId: 565242447,
      weeklyReportsChannelId: "1552814147421474819",
      matchupChannelId: "1552814147421474820",
      leaderboardChannelId: "1552814147421474825",
      tradeCompareChannelId: "1552814147572465815",
    },
    //Brotherhood of the gridiron (MAIN)
    "1559794967927332934": {
      mainChatChannelId: "1559794968409940031",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1559794968409940037",
      matchupChannelId: "1559794968736964628",
      leaderboardChannelId: "1559794968736964633",
      tradeCompareChannelId: "1559794968736964634",
      welcomeTeamPickerChannelId: "1559794968409940029",
    },
    //weenie huts jrs (MAIN)
    "1559795332852875274": {
      mainChatChannelId: "1559795333549269085",
      leagueId: 565242447,
      weeklyReportsChannelId: "1559795333549269091",
      matchupChannelId: "1559795333784014968",
      leaderboardChannelId: "1559795333784014973",
      tradeCompareChannelId: "1559795333784014974",
      welcomeTeamPickerChannelId: "1559795333549269083",
    },
    //let shedeur cook (MAIN)
    "1559795721069264896": {
      mainChatChannelId: "1559795721509798002",
      leagueId: 558956329,
      weeklyReportsChannelId: "1559795721509798008",
      matchupChannelId: "1559795721731969034",
      leaderboardChannelId: "1559795721731969039",
      tradeCompareChannelId: "1559795721731969040",
      welcomeTeamPickerChannelId: "1559795721509798000",
    },
  },
};
