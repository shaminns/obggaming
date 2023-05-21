const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();
//Controller
const TournamentController = require("../Controllers/TournamentController");
//Authorization
const jwtAuth = require("../Middleware/JWTAuth");
const UserController = require("../Controllers/UserController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
//
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/TournamentImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
//will be using this for uplading
const upload = multer({ storage: storage });
//waheeb
router.post("/currentTournament", TournamentController.teamCurrentTournament);
router.post("/pastTournament", TournamentController.teamPastTournament);
router.get("/schedule", TournamentController.tournamentSchedule);
//CRUD in admin routes
module.exports = router;
