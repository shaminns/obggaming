const mongoose = require("mongoose");
const playerLeaguePointsSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        points: {type: Number, default: 0},
        roundNumber: {type: Number},
        scheduleType: {type: String},
        //
        leagueId: {type: mongoose.Schema.Types.ObjectId, ref: "League"},
        playerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    }, {timestamps: true});
module.exports = mongoose.model("PlayerLeaguePoints", playerLeaguePointsSchema);