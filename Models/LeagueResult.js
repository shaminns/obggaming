const mongoose = require("mongoose");
const leagueResultSchema = mongoose.Schema(
    {
            _id: mongoose.Schema.Types.ObjectId,
            leagueName: {type: String},
            roundNumber: {type: Number},
            score: {type: String},
            submissionDate: {type: String},
            resultVideo: {type: String},
            result: {type: String, default: "pending"},
            scheduleType: {type: String, default: ""},
            matchId: {type: String},
            killPoints: {type: Number, default: 0},
            placePoints: {type: Number, default: 0},
            teamViewName: {type: String, default: ""},
            gameName: {type: String, default: ""},
            leagueId: {type: mongoose.Schema.Types.ObjectId, ref: "League"},
            teamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
            submittedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            playerResults: [
                    {
                            userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                            killPoints: {type: Number, default: 0}
                    }
            ],
            //
            //
            isDeleted: {type: Boolean, default: false},
            deletedAt: {type: Date, default: null},
    }, {timestamps: true});
module.exports = mongoose.model("LeagueResult", leagueResultSchema);