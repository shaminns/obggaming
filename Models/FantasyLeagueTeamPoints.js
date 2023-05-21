const mongoose = require("mongoose");
const fantasyLeagueTeamPointsSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        points: {type: Number, default: 0},
        roundNumber: {type: Number},
        result: {type: String},
        //
        leagueId: {type: mongoose.Schema.Types.ObjectId, ref: "League"},
        fantasyLeagueId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyLeague"},
        flTeamId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam"},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    }, {timestamps: true});
module.exports = mongoose.model("FantasyLeagueTeamPoints", fantasyLeagueTeamPointsSchema);