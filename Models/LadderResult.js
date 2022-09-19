const mongoose = require("mongoose");
const ladderResultSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    ladderName: {type: String},
    score: {type: String},
    submissionDate: {type: String},
    resultVideo: {type: String},
    result: {type: String, default: "pending"},
    //
    ladderId: {type: mongoose.Schema.Types.ObjectId, ref: "Ladder"},
    teamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
    gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
    submittedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    //
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
}, {timestamps: true});
module.exports = mongoose.model("LadderResult", ladderResultSchema);
