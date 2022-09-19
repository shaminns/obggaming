const mongoose = require("mongoose");
const ConversationSchema = new mongoose.Schema(
    {
        members: [{userId: {type: String}}],
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("Conversation", ConversationSchema);
