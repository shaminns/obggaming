const mongoose = require("mongoose");
const fantasyLeagueScheduleSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        roundNumber: {type: Number},
        rowNumber: {type: Number},
        scheduleType: {type: String},//round, playoff or final
        randomMatchId: {type: String},
        //
        leagueId: {type: mongoose.Schema.Types.ObjectId, ref: "League"},
        fantasyLeagueId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyLeague"},
        teamOne: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
        teamTwo: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
        winner: {type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    }, {timestamps: true});
module.exports = mongoose.model("FantasyLeagueSchedule", fantasyLeagueScheduleSchema);