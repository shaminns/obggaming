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
const { exceptionFunc } = require("../Services/ExceptionHelper");
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Routes
router.post("/fantasyLeague", FantasyLeagueController.createFantasyLeague);
router.patch("/fantasyLeague", FantasyLeagueController.joinFantasyLeague);
router.get("/fantasyLeague", FantasyLeagueController.showAllFantasyLeague);
//
module.exports = router;
