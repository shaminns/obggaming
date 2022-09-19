// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const AuthController = require("../Controllers/AuthController");
const TournamentController = require("../Controllers/TournamentController")
const GameController = require("../Controllers/GameController")
const LadderController = require("../Controllers/LadderController")
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
// Routes
router.post("/login", AuthController.login)
// (req, res) => exceptionFunc(req, res)(AuthController, 'login', 'Backend issue: auth-post-login'));
router.post("/createAdmin", AuthController.createAdmin)
// (req, res) => exceptionFunc(req, res)(AuthController, 'createAdmin', 'Backend issue: auth-post-createAdmin'));
router.post("/createUser", AuthController.createUser)
// (req, res) => exceptionFunc(req, res)(AuthController, 'createUser', 'Backend issue: auth-post-createUser'));
router.post("/forgot", AuthController.forgot)
// (req, res) => exceptionFunc(req, res)(AuthController, 'forgot', 'Backend issue: auth-post-forgot'));
router.post("/reset", AuthController.reset)
// (req, res) => exceptionFunc(req, res)(AuthController, 'reset', 'Backend issue: auth-post-reset'));
router.post("/change", AuthController.change)
// (req, res) => exceptionFunc(req, res)(AuthController, 'change', 'Backend issue: auth-post-change'));
router.post("/logout", AuthController.logoutAndRemoveToken)
// (req, res) => exceptionFunc(req, res)(AuthController, 'logoutAndRemoveToken', 'Backend issue: auth-post-logout'))
//for home
router.post("/contactUs", AuthController.contactUsSend)
// (req, res) => exceptionFunc(req, res)(AuthController, 'contactUsSend', 'Backend issue: auth-post-contactUs'))
router.get("/allTournaments", TournamentController.getAllTournamentForHome)
// (req, res) => exceptionFunc(req, res)(AuthController, 'getTournamentForHome', 'Backend issue: auth-get-allTournaments'))
router.get("/allGames", GameController.getAllGameForHome)
// (req, res) => exceptionFunc(req, res)(AuthController, 'getAllGameForHome', 'Backend issue: auth-get-allGames'))
router.get("/allLadders", LadderController.getAllLadderForHome)
// (req, res) => exceptionFunc(req, res)(AuthController, 'getAllLadderForHome', 'Backend issue: auth-get-allLadders'))
module.exports = router;
