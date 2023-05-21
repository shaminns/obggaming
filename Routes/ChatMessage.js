const express = require("express");
const router = express.Router();
const ChatMessageController = require("../Controllers/ChatMessageController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
//
// router.post("/", ChatMessageController.addMessage);
router.get("/", ChatMessageController.allConversationMessage);
// router.post("/meaasgeToFriend", ChatMessageController.messageToFriend);
//public
router.get("/public", ChatMessageController.getPublicGroupMessages)
//
module.exports = router;
