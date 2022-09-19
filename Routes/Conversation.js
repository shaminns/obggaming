const express = require("express");
const router = express.Router();
const ConversationController = require("../Controllers/ConversationController");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
//
router.post("/", ConversationController.addConversation)
// (req, res) => exceptionFunc(req, res)(ConversationController, 'addConversation', 'Backend issue: conversation-post'))
router.get("/", ConversationController.getUserAllConversation)
// (req, res) => exceptionFunc(req, res)(ConversationController, 'getUserAllConversation', 'Backend issue: conversation-get'))
module.exports = router;
