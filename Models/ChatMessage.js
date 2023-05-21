const mongoose = require("mongoose");
const ChatMessageSchema = new mongoose.Schema(
    {
        conversationId: { type: String },
        text: { type: String },
        mode: { type: String, default: "Private" },
        //
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        //
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
