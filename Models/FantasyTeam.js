const mongoose = require("mongoose");
const FantasyTeamSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        teamViewName: {type: String, required: true},
        // teamTitleImage: {type: String, default: ""},
        teamSize: {type: String},
        totalTeams: {type: String},
        //
        teamOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        teamMembers: [
            {
                userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                role: {type: String, default: "Player"},
                blockTradeOff: {type: Boolean, default: false}
            }
        ],
        teamType: {type: mongoose.Schema.Types.ObjectId, ref: "FantasyLeague", default: null},//user(null) or franchise(_id)
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("FantasyTeam", FantasyTeamSchema);
