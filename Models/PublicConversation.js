const mongoose = require("mongoose");
const PublicConversationSchema = new mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        conversationType: { type: String, default: "Multiple" },
        conversationMode: { type: String, default: "Public" },
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("PublicConversation", PublicConversationSchema);
