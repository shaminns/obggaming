const mongoose = require('mongoose');
const totalWarLadderMatchSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    matchId: {type: String},
    result: {type: String, default: "pending"},
    //
    ladder: {type: mongoose.Schema.Types.ObjectId, ref: "Ladder"},
    twlId: {type: mongoose.Schema.Types.ObjectId, ref: "TotalWarLadder"},
    teamOne: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
    teamTwo: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
    winningTeam: {type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null},
    //
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
}, {timestamps: true});
module.exports = mongoose.model('TotalWarLadderMatch', totalWarLadderMatchSchema);
