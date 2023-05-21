const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Middlewares
const jwtAuth = require("../Middleware/JWTAuth");
// Controllers
const AdminController = require("../Controllers/AdminController");
const AuthController = require("../Controllers/AuthController");
const TournamentController = require("../Controllers/TournamentController");
const LadderController = require("../Controllers/LadderController");
const CreditController = require("../Controllers/CreditController");
const MatchController = require("../Controllers/MatchController");
const FranchiseController = require("../Controllers/FranchiseController");
const LeagueController = require("../Controllers/LeagueController");
const FantasyLeagueController = require("../Controllers/FantasyLeagueController");
//
// const { exceptionFunc } = require("../Services/ExceptionHelper");
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
var assetStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/");
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
/////////////////////////////////////
const assetUpload = multer({ storage: assetStorage });
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
var ladderStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/LadderImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
var leagueImageStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/LeagueImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
//will be using this for uplading
//for tournament
const upload = multer({ storage: storage });
//for ladder
const ledderUpload = multer({ storage: ladderStorage });
// for league
const UploadLeagueImage = multer({ storage: leagueImageStorage });
// Routes
router.get("/dashboard", AdminController.dashboardDetail);
router.get("/usersList", AdminController.listAllUser);
router.post("/createUserByAdmin", AuthController.createUser);
router.post("/editUserByAdmin", AdminController.editUser);
router.post("/deleteUsersByAdmin", AdminController.deleteUsers);
// Tournament
router.post(
	"/tournament",
	upload.single("tournamentTitleImage"),
	TournamentController.createTournament
);
router.get("/tournament", TournamentController.listTournaments);
router.put(
	"/tournament",
	upload.single("tournamentTitleImage"),
	TournamentController.updateTournament
);
router.patch("/tournament", TournamentController.deleteTournament);
router.get("/tournamentResult", TournamentController.showTournamentsForResult);
router.post(
	"/tournamentResult",
	TournamentController.updateResultForTournament
);
router.patch("/tournamentResult", TournamentController.deleteTournamentResult);
// Ladder
router.post(
	"/ladder",
	ledderUpload.single("ladderTitleImage"),
	LadderController.createLadder
);
router.get("/ladder", LadderController.listLadder);
router.put(
	"/ladder",
	ledderUpload.single("ladderTitleImage"),
	LadderController.updateLadder
);
router.patch("/ladder", LadderController.deleteLadder);
router.get("/ladderResult", LadderController.showLaddersForResult);
router.post("/ladderResult", LadderController.updateResultForLadder);
router.post("/deleteLadderResult", LadderController.deleteLadderResultRecord);
// Credit
router.post("/credit", CreditController.addCredit);
// Games
router.get("/game", AdminController.showAllGames);
// Match
router.get("/matchResult", MatchController.showAndSearchMatchForResult);
router.post("/matchResult", MatchController.updateResultForMatch);
router.patch("/matchResult", MatchController.deleteMatchResult);
//Franchise
router.get("/franchise", FranchiseController.showAllFranchiseData);
router.patch("/franchise", FranchiseController.approveBlockFranchiseStatus);
//Leagues
router.post(
	"/league",
	UploadLeagueImage.single("leagueTitleImage"),
	LeagueController.createLeague
);
router.get("/league", LeagueController.getAllLeagues);
router.patch(
	"/league",
	UploadLeagueImage.single("leagueTitleImage"),
	LeagueController.editLeague
);
router.put("/league", LeagueController.deleteLeague);
router.get("/leagueResult", LeagueController.showLeagueResult);
router.patch("/leagueResult", LeagueController.updateLeagueMatchResult);
router.post("/deleteLeagueResult", LeagueController.deleteLeagueResult);
//Fantasy Leagues
router.get(
	"/fantasyLeague",
	FantasyLeagueController.showAllPublicFantasyLeague
);
router.patch("/fantasyLeague", FantasyLeagueController.editFantasyLeague);
router.put("/fantasyLeague", FantasyLeagueController.deleteFantasyLeague);
//Total War Ladder
router.get(
	"/totalWarLadderResult",
	LadderController.showAndSearchTotalWarLadderResults
);
router.patch(
	"/totalWarLadderResult",
	LadderController.deleteTotalWarLadderResults
);
router.put(
	"/totalWarLadderResult",
	LadderController.updateTotalWarLadderResults
);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// for exports
router.get("/exportUserData", AdminController.exportUserData);
router.get("/exportTournamentData", AdminController.exportTournamentData);
router.get("/exportLadderData", AdminController.exportLadderData);
router.get(
	"/exportTournamentResultData",
	AdminController.exportTournamentResultData
);
router.get("/exportLadderResultData", AdminController.exportLadderResultData);
router.get("/exportGrandPrixData", AdminController.exportGrandPrixData);
router.get("/exportGpLeagueData", AdminController.exportGpLeagueData);
router.get("/exportFantasyLeagueData", AdminController.exportFantasyLeagueData);
// User Profile info (new work)
router.get("/userInfoForAdmin", AdminController.userInfoForAdmin);
router.get("/matchInfoForAdmin", AdminController.matchInfoForAdmin);
router.get("/tournamentInfoForAdmin", AdminController.tournamentInfoForAdmin);
router.get("/ladderInfoForAdmin", AdminController.ladderInfoForAdmin);
router.get("/gpLeagueInfoForAdmin", AdminController.gpLeagueInfoForAdmin);
router.get(
	"/fantasyLeagueInfoForAdmin",
	AdminController.fantasyLeagueInfoForAdmin
);
router.get("/transactionInfoForAdmin", AdminController.transactionInfoForAdmin);
//////////////////////////////////
//for dev only
router.post(
	"/uploadAsset",
	assetUpload.single("assetImage"),
	AdminController.uploadAsset
);
module.exports = router;
