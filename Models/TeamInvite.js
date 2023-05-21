const mongoose = require("mongoose");
const teamInviteSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        status: {type: String, default: "pending"},
        //
        teamId: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
        to: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        from: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("TeamInvite", teamInviteSchema);
