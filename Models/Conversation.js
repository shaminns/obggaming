const mongoose = require("mongoose");
const ConversationSchema = new mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        conversationType: { type: String, default: "Single" },
        conversationMode: { type: String, default: "Private" },
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Conversation", ConversationSchema);
