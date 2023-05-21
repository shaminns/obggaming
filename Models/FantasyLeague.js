const mongoose = require("mongoose");
const fantasyLeagueSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        flName: { type: String, required: true },
        totalTeams: { type: Number },
        teamSize: { type: Number },
        draftDateAndTime: { type: String },
        flTitleImage: { type: String, default: "" },
        leagueRandomId: { type: String },
        flType: { type: String, default: null },
        gameName: { type: String },
        leagueName: { type: String, default: "" },
        emailSendStatus: { type: Boolean, default: false },
        //
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        league: { type: mongoose.Schema.Types.ObjectId, ref: "League" },
        winner: { type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam", default: null },
        gameToPlay: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
        flTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "FantasyTeam" }],
        //
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("FantasyLeague", fantasyLeagueSchema);
