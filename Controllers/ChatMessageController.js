//Controllers
const conversationController = require("../Controllers/ConversationController")
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const ChatMessageHelper = require("../Services/ChatMessageHelper");
// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
///
// exports.addMessage = async (req, res) => {
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
//         await ChatMessageHelper.createMessage(request.conversationId, userId, request.text)
//         let conversationsResult = await ChatMessageHelper.findMessagesByConversationId(request.conversationId);
//         response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
//         response.messagesData = conversationsResult
//         return res.status(response.code).json(response);
//     }
// }
exports.allConversationMessage = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.query
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
        let conversationsResult = await ChatMessageHelper.findMessagesByConversationId(request.conversationId);
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.messagesData = conversationsResult
        return res.status(response.code).json(response);
    }
}
// exports.messageToFriend = async (req, res) => {
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
//         let conversationDetail = await conversationController.conversationDetail(userId, request.receiverId)
//         response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
//         response.conversationsData = conversationDetail
//         return res.status(response.code).json(response);
//     }
// }
///public

exports.getPublicGroupMessages = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body

    let chatMessages = await ChatMessageHelper.getPublicChatMessage()

    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.messagesData = chatMessages
    return res.status(response.code).json(response);
}