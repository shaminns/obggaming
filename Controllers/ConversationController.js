//Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const ConversationHelper = require("../Services/ConversationHelper")
const PublicConversationHelper = require("../Services/PublicConversationHelper")
// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
//
// exports.addConversation = async (req, res) => {
//     let response = ResponseHelper.getDefaultResponse()
//     let request = req.body
//     if (!req.headers.authorization) {
//         response = ResponseHelper.setResponse(
//             ResponseCode.NOT_FOUND,
//             Message.TOKEN_NOT_FOUND
//         );
//         return res.status(response.code).json(response);
//     }
//     let token = req.headers.authorization;
//     let userId = await tokenExtractor.getInfoFromToken(token);
//     if (userId == null) {
//         response = ResponseHelper.setResponse(
//             ResponseCode.NOT_AUTHORIZE,
//             Message.INVALID_TOKEN
//         );
//         return res.status(response.code).json(response);
//     }
//     if (userId != null) {
//         let conversationObj = await this.conversationDetail(userId, request.receiverId)
//         response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
//         response.conversationsData = conversationObj
//         return res.status(response.code).json(response);
//     }
// }
exports.getUserAllConversation = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let conversationMemberArr = []
    let conversationArr = []
    if (!req.headers.authorization) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_FOUND,
            Message.TOKEN_NOT_FOUND
        );
        return res.status(response.code).json(response);
    }
    let token = req.headers.authorization;
    let userId = await tokenExtractor.getInfoFromToken(token);
    if (userId == null) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_AUTHORIZE,
            Message.INVALID_TOKEN
        );
        return res.status(response.code).json(response);
    }
    if (userId != null) {
        let allConversations = await ConversationHelper.findUserAllConversation(userId)
        if (allConversations.length != 0) {
            for (let i = 0; i < allConversations.length; i++) {
                let conversationObj = {
                    _id: allConversations[i]._id,
                    userA: allConversations[i].userA,
                    userB: allConversations[i].userB,
                    isDeleted: allConversations[i].isDeleted,
                    deletedAt: allConversations[i].deletedAt,
                    createdAt: allConversations[i].createdAt,
                    updatedAt: allConversations[i].updatedAt,
                }
                conversationArr.push(conversationObj)
                conversationMemberArr = []
            }
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.conversationsData = conversationArr
        return res.status(response.code).json(response);
    }
}
exports.getPublicConversation = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let conversationData = await PublicConversationHelper.findAllConversations()
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.conversationsData = conversationData
    return res.status(response.code).json(response);

}
/////// Use with in Conversation and ChatMessage Controllers and Index.js socket (sendMessage)  ////////////////////////
exports.conversationDetail = async (userId, receiverId) => {
    let conversationResult
    let conversationArr = []
    let alreadyConversation = await ConversationHelper.findAlreadyConversation(userId, receiverId)
    if (alreadyConversation == null || alreadyConversation.length == 0) {
        console.log("new conversation")
        await ConversationHelper.addConversation(userId, receiverId)
    } else {
        console.log("conversation already exist!")
    }
    conversationResult = await ConversationHelper.findAlreadyConversation(userId, receiverId)

    let conversationObj = {
        isDeleted: conversationResult.isDeleted,
        deletedAt: conversationResult.deletedAt,
        _id: conversationResult._id,
        userA: conversationResult.userA,
        userB: conversationResult.userB,
        createdAt: conversationResult.createdAt,
        updatedAt: conversationResult.updatedAt,
    }
    return conversationObj
}