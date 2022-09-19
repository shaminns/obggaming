const mongoose = require('mongoose');
const totalWarLadderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    gameName: {type: String},
    //
    ladder: {type: mongoose.Schema.Types.ObjectId, ref: "Ladder"},
    gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
    participatingTeams: [{type: mongoose.Schema.Types.ObjectId, ref: "Team"}],
    winningTeam: {type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null},
    //
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
}, {timestamps: true});
module.exports = mongoose.model('TotalWarLadder', totalWarLadderSchema);
