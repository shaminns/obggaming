const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Middlewares
const jwtAuth = require("../Middleware/JWTAuth");
// Controllers
const FantasyLeagueController = require("../Controllers/FantasyLeagueController");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Routes
router.post("/fantasyLeague", FantasyLeagueController.createFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'createFantasyLeague', 'Backend issue: fantasyLeague-post-fantasyLeague'))
router.patch("/fantasyLeague", FantasyLeagueController.joinFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'joinFantasyLeague', 'Backend issue: fantasyLeague-patch-fantasyLeague'))
router.get("/fantasyLeague", FantasyLeagueController.showAllFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'showAllFantasyLeague', 'Backend issue: fantasyLeague-get-fantasyLeague'))
module.exports = router;
