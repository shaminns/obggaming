const mongoose = require("mongoose");
const friendRequestSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        status: {type: String, default: "pending"},
        //
        to: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        from: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("FriendRequest", friendRequestSchema);
