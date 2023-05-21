const mongoose = require("mongoose");
const fantasyTeamInviteSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        status: {type: String, default: "pending"},
        //
        fantasyLeagueId: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyLeague"},
        to: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        from: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("FantasyTeamInvite", fantasyTeamInviteSchema);
