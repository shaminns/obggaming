const Conversation = require("../Models/Conversation");
//////////////////////////////////////////////////////////////
exports.addConversation = async (userId, receiverId) => {
    let newConversation = new Conversation({members: [{userId: userId}, {userId: receiverId}]})
    await newConversation.save()
}
exports.findAlreadyConversation = async (userId, receiverId) => {
    let stringUserId = userId.toString()
    let stringReceiverId = receiverId.toString()
    return await Conversation.findOne({
        isDeleted: false,
        $and: [
            {
                members: {
                    $elemMatch: {userId: stringUserId}
                }
            },
            {
                members: {
                    $elemMatch: {userId: stringReceiverId}
                }
            }
        ]
    })
}
exports.findUserAllConversation = async (userId) => {
    return await Conversation.find({
        isDeleted: false,
        'members.userId': {$in: [userId]}
    })
}

