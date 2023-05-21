const mongoose = require("mongoose");
const tryoutRequestSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        dateAndTime: {type: String, required: true},
        status: {type: String, default: "pending"},
        isAddedToTeam: {type: Boolean, default: false},
        //
        franchiseTeamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
        userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        franchiseOwnerId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        franchiseId: {type: mongoose.Schema.Types.ObjectId, ref: "Franchise"},
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("TryoutRequest", tryoutRequestSchema);
