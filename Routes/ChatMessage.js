const express = require("express");
const router = express.Router();
const ChatMessageController = require("../Controllers/ChatMessageController");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
//
router.post("/", ChatMessageController.addMessage)
// (req, res) => exceptionFunc(req, res)(ChatMessageController, 'addMessage', 'Backend issue: chatMessage-post'))
router.get("/", ChatMessageController.allConversationMessage)
// (req, res) => exceptionFunc(req, res)(ChatMessageController, 'allConversationMessage', 'Backend issue: chatMessage-get'))
router.post("/meaasgeToFriend", ChatMessageController.messageToFriend)
// (req, res) => exceptionFunc(req, res)(ChatMessageController, 'messageToFriend', 'Backend issue: chatMessage-post-meaasgeToFriend'))
module.exports = router;
