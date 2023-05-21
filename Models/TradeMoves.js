const mongoose = require("mongoose");
const tradeMovesSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        approvedStatus: {type: String, default: "pending"},
        type: {type: String, default: "trade_proposal"},
        //
        fantasyLeagueId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyLeague"},
        takeFlTeamId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam"},
        giveFlTeamId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam"},
        toId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        fromId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        takePlayerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        givePlayerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("TradeMoves", tradeMovesSchema);
