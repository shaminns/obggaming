const mongoose = require("mongoose");
const teamSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        teamViewName: {type: String, required: true},
        teamTitleImage: {type: String, default: ""},
        teamCoverImage: {type: String, default: ""},
        teamNickName: {type: String, required: true},
        //
        teamLeader: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        teamMembers: [
            {
                userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                role: {type: String},
                prz: {type: Number, default: 0},
                mcd: {type: Number, default: 0},
                mprz: {type: Number, default: 0}
            }
        ],
        participatingInGames: [{type: mongoose.Schema.Types.ObjectId, ref: "Games"}
        ],
        participatingInTournaments: [{type: mongoose.Schema.Types.ObjectId, ref: "Tournament"}
        ],
        participatingInLeagues: [{type: mongoose.Schema.Types.ObjectId, ref: "League"}
        ],
        teamType: {type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null},//user(null) or franchise(_id)
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("Team", teamSchema);
