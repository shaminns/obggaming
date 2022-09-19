const mongoose = require("mongoose");
const matchResultSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        matchName: {type: String},
        results: [{type: Object}],
        // userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        // score: {type: String, default: ""},
        // submissionDate: {type: String},
        // resultVideo: {type: String},
        // result: {type: String, default: "pending"},
        //
        matchId: {type: mongoose.Schema.Types.ObjectId, ref: "Match"},
        gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
        winner: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("MatchResult", matchResultSchema);