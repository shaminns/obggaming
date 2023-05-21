const mongoose = require("mongoose");
const leagueSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        leagueName: {type: String},
        leagueTitleImage: {type: String, required: true},
        entryFee: {type: Number, default: 0},
        prize: {type: Number, required: true},
        teamSize: {type: Number, required: true},//size of each team for check criteria
        totalTeams: {type: Number, default: 1},//No of Maximum teams that can play
        startingDate: {type: String, required: true},
        endingDate: {type: String, required: true},
        //
        gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
        participatingTeams: [{type: mongoose.Schema.Types.ObjectId, ref: "Team"}],
        // leagueFranchise: {type: mongoose.Schema.Types.ObjectId, ref: "Franchise"},
        //   createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        winningTeam: {type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    }, {timestamps: true});
module.exports = mongoose.model("League", leagueSchema);