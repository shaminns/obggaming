const mongoose = require("mongoose");
const totalWarLadderResultSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    gameName: {type: String},
    ladderName: {type: String},
    teamName: {type: String},
    matchId: {type: String},
    score: {type: String},
    submissionDate: {type: String},
    resultVideo: {type: String},
    result: {type: String, default: "pending"},
    //
    ladder: {type: mongoose.Schema.Types.ObjectId, ref: "Ladder"},
    twlId: {type: mongoose.Schema.Types.ObjectId, ref: "TotalWarLadder"},
    teamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
    gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
    submittedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    //
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
}, {timestamps: true});
module.exports = mongoose.model("TotalWarLadderResult", totalWarLadderResultSchema);
