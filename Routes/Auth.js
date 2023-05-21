// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const AuthController = require("../Controllers/AuthController");
const TournamentController = require("../Controllers/TournamentController");
const GameController = require("../Controllers/GameController");
const LadderController = require("../Controllers/LadderController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
// Routes
router.post("/login", AuthController.login);
router.post("/createAdmin", AuthController.createAdmin);
router.post("/createUser", AuthController.createUser);
router.post("/forgot", AuthController.forgot);
router.post("/reset", AuthController.reset);
router.post("/change", AuthController.change);
router.post("/logout", AuthController.logoutAndRemoveToken);
//for home
router.post("/contactUs", AuthController.contactUsSend);
router.post("/reportIssue", AuthController.reportIssue)
router.get("/allTournaments", TournamentController.getAllTournamentForHome);
router.get("/allGames", GameController.getAllGameForHome);
router.get("/allLadders", LadderController.getAllLadderForHome);
//
module.exports = router;
