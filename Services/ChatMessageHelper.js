const ChatMessage = require("../Models/ChatMessage");
//////
exports.createMessage = async (conversationId, userId, text) => {
    let newChatMessage = new ChatMessage({
        conversationId: conversationId,
        sender: userId,
        text: text
    })
    await newChatMessage.save();
}
exports.findMessagesByConversationId = async (conversationId) => {
    return await ChatMessage.find({isDeleted: false, conversationId: conversationId})
}

