const mongoose = require("mongoose");
const tournamentResultSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    tournamentName: {type: String},
    score: {type: String},
    submissionDate: {type: String},
    resultVideo: {type: String},
    resultType: {type: String, default: ""},
    result: {type: String, default: "pending"},
    // killPoints: {type: Number, default: 0},
    //
    tournamentId: {type: mongoose.Schema.Types.ObjectId, ref: "Tournament"},
    teamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
    gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
    submittedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    // resultType: {type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null},
    //
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
}, {timestamps: true});
module.exports = mongoose.model("TournamentResult", tournamentResultSchema);
