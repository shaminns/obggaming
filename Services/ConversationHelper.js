const mongoose = require("mongoose");
const Conversation = require("../Models/Conversation");
//////////////////////////////////////////////////////////////
exports.addConversation = async (userId, receiverId) => {
	let newConversation = new Conversation({
		_id: new mongoose.Types.ObjectId(),
		userA: userId,
		userB: receiverId
	});
	await newConversation.save();
	return newConversation._id
};
exports.findAlreadyConversation = async (userId, receiverId) => {
	let stringUserId = userId.toString();
	let stringReceiverId = receiverId.toString();
	return await Conversation.findOne({
		isDeleted: false,
		$or: [
			{
				userA: mongoose.Types.ObjectId(userId),
				userB: mongoose.Types.ObjectId(receiverId),
			},
			{
				userB: mongoose.Types.ObjectId(userId),
				userA: mongoose.Types.ObjectId(receiverId),
			},
		],
	}).populate("userA userB");
};
exports.findUserAllConversation = async (userId) => {
	return await Conversation.find({
		isDeleted: false,
		$or: [
			{ userA: mongoose.Types.ObjectId(userId) },
			{ userB: mongoose.Types.ObjectId(userId) },
		],
	})
};
exports.findConversationByMode = async (conversationMode) => {
	return await Conversation.findOne({ conversationMode: conversationMode })
}
// for developers
exports.hardDeleteAllConversations = async () => {
	await Conversation.deleteMany();
	return true;
};
