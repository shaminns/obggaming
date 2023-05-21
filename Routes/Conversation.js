const express = require("express");
const router = express.Router();
const ConversationController = require("../Controllers/ConversationController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
//
// router.post("/", ConversationController.addConversation);
router.get("/", ConversationController.getUserAllConversation);
//public
router.get("/public", ConversationController.getPublicConversation)

//
module.exports = router;
