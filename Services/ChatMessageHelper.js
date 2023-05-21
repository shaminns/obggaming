const ChatMessage = require("../Models/ChatMessage");
//////
exports.createMessage = async (conversationId, userId, text, mode) => {
	let newChatMessage = new ChatMessage({
		conversationId: conversationId,
		sender: userId,
		text: text,
		mode: mode
	});
	await newChatMessage.save();
};
exports.findMessagesByConversationId = async (conversationId) => {
	return await ChatMessage.find({
		isDeleted: false,
		conversationId: conversationId,
	}).populate("sender");
};
///public
exports.getPublicChatMessage = async () => {
	return await ChatMessage.find({
		isDeleted: false,
		mode: "Public"
	}).populate("sender")
}
// for developers
exports.hardDeleteAllChatMessages = async () => {
	await ChatMessage.deleteMany();
	return true;
};
