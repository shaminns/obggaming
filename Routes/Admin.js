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
const CreditController = require("../Controllers/CreditController")
const MatchController = require("../Controllers/MatchController")
const FranchiseController = require("../Controllers/FranchiseController")
const LeagueController = require("../Controllers/LeagueController")
const FantasyLeagueController = require("../Controllers/FantasyLeagueController")
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
var assetStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.originalname,
		)
	},
});
/////////////////////////////////////
const assetUpload = multer({storage: assetStorage});
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
const upload = multer({storage: storage});
//for ladder
const ledderUpload = multer({storage: ladderStorage});
// for league
const UploadLeagueImage = multer({storage: leagueImageStorage});
// Routes
router.get("/dashboard", AdminController.dashboardDetail)
// router.get("/dashboard", (req, res) => exceptionFunc(req, res)(AdminController, 'dashboardDetail', 'Backend issue: admin-get-dashboard'))
router.get("/usersList", AdminController.listAllUser)
// (req, res) => exceptionFunc(req, res)(AdminController, 'listAllUser', 'Backend issue: admin-get-userList'));
router.post("/createUserByAdmin", AuthController.createUser)
// (req, res) => exceptionFunc(req, res)(AuthController, 'createUser', 'Backend issue: admin-post-createUserByAdmin'));
router.post("/editUserByAdmin", AdminController.editUser)
// (req, res) => exceptionFunc(req, res)(AdminController, 'editUser', 'Backend issue: admin-post-editUserByAdmin'));
router.post("/deleteUsersByAdmin", AdminController.deleteUsers)
// (req, res) => exceptionFunc(req, res)(AdminController, 'deleteUsers', 'Backend issue: admin-post-deleteUsersByAdmin'));
// Tournament
router.post("/tournament", upload.single("tournamentTitleImage"), TournamentController.createTournament)
// router.post("/tournament", upload.single("tournamentTitleImage"), (req, res) => exceptionFunc(req, res)(TournamentController, 'createTournament', 'Backend issue: admin-post-tournament'));
router.get("/tournament", TournamentController.listTournaments)
// (req, res) => exceptionFunc(req, res)(TournamentController, 'listTournaments', 'Backend issue: admin-get-tournament'));
router.put("/tournament", upload.single("tournamentTitleImage"), TournamentController.updateTournament)
// router.put("/tournament", upload.single("tournamentTitleImage"), (req, res) => exceptionFunc(req, res)(TournamentController, 'updateTournament', 'Backend issue: admin-put-tournament'));
router.patch("/tournament", TournamentController.deleteTournament)
// (req, res) => exceptionFunc(req, res)(TournamentController, 'deleteTournament', 'Backend issue: admin-patch-tournament'));
router.get("/tournamentResult", TournamentController.showTournamentsForResult)
// (req, res) => exceptionFunc(req, res)(TournamentController, 'showTournamentsForResult', 'Backend issue: admin-get-tournamentResult'))
router.post("/tournamentResult", TournamentController.updateResultForTournament)
// (req, res) => exceptionFunc(req, res)(TournamentController, 'updateResultForTournament', 'Backend issue: admin-post-tournamentResult'))
router.patch("/tournamentResult", TournamentController.deleteTournamentResult)
// (req, res) => exceptionFunc(req, res)(TournamentController, 'deleteTournamentResult', 'Backend issue: admin-patch-tournamentResult'))
// Ladder
router.post("/ladder", ledderUpload.single("ladderTitleImage"), LadderController.createLadder)
// router.post("/ladder", ledderUpload.single("ladderTitleImage"), (req, res) => exceptionFunc(req, res)(LadderController, 'createLadder', 'Backend issue: admin-post-ladder'));
router.get("/ladder", LadderController.listLadder)
// (req, res) => exceptionFunc(req, res)(LadderController, 'listLadder', 'Backend issue: admin-get-ladder'));
router.put("/ladder", ledderUpload.single("ladderTitleImage"), LadderController.updateLadder)
// router.put("/ladder", ledderUpload.single("ladderTitleImage"), (req, res) => exceptionFunc(req, res)(LadderController, 'updateLadder', 'Backend issue: admin-put-ladder'))
router.patch("/ladder", LadderController.deleteLadder)
// (req, res) => exceptionFunc(req, res)(LadderController, 'deleteLadder', 'Backend issue: admin-patch-ladder'))
router.get("/ladderResult", LadderController.showLaddersForResult)
// (req, res) => exceptionFunc(req, res)(LadderController, 'showLaddersForResult', 'Backend issue: admin-get-ladderResult'))
router.post("/ladderResult", LadderController.updateResultForLadder)
// (req, res) => exceptionFunc(req, res)(LadderController, 'updateResultForLadder', 'Backend issue: admin-post-ladderResult'))
router.post("/deleteLadderResult", LadderController.deleteLadderResultRecord)
// (req, res) => exceptionFunc(req, res)(LadderController, 'deleteLadderResultRecord', 'Backend issue: admin-post-deleteLadderResult'))
// Credit
router.post("/credit", CreditController.addCredit)
// (req, res) => exceptionFunc(req, res)(CreditController, 'credit', 'Backend issue: admin-post-credit'))
// Games
router.get("/game", AdminController.showAllGames)
// (req, res) => exceptionFunc(req, res)(AdminController, 'showAllGames', 'Backend issue: admin-get-game'))
// Match
router.get("/matchResult", MatchController.showAndSearchMatchForResult)
// (req, res) => exceptionFunc(req, res)(MatchController, 'showAndSearchMatchForResult', 'Backend issue: admin-get-matchResult'))
router.post("/matchResult", MatchController.updateResultForMatch)
// (req, res) => exceptionFunc(req, res)(MatchController, 'updateResultForMatch', 'Backend issue: admin-post-matchResult'))
router.patch("/matchResult", MatchController.deleteMatchResult)
// (req, res) => exceptionFunc(req, res)(MatchController, 'deleteMatchResult', 'Backend issue: admin-patch-matchResult'))
//Franchise
router.get("/franchise", FranchiseController.showAllFranchiseData)
// router.get("/franchise", (req, res) => exceptionFunc(req, res)(FranchiseController, 'showAllFranchiseData', 'Backend issue: admin-get-franchise'))
router.patch("/franchise", FranchiseController.approveBlockFranchiseStatus)
// (req, res) => exceptionFunc(req, res)(FranchiseController, 'approveBlockFranchiseStatus', 'Backend issue: admin-patch-franchise'))
//Leagues
router.post("/league", UploadLeagueImage.single("leagueTitleImage"), LeagueController.createLeague)
// router.post("/league", UploadLeagueImage.single("leagueTitleImage"), (req, res) => exceptionFunc(req, res)(LeagueController, 'createLeague', 'Backend issue: admin-post-league'))
router.get("/league", LeagueController.getAllLeagues)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'getAllLeagues', 'Backend issue: admin-get-league'))
router.patch("/league", UploadLeagueImage.single("leagueTitleImage"), LeagueController.editLeague)
// router.patch("/league", UploadLeagueImage.single("leagueTitleImage"), (req, res) => exceptionFunc(req, res)(LeagueController, 'editLeague', 'Backend issue: admin-patch-league'))
router.put("/league", LeagueController.deleteLeague)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'deleteLeague', 'Backend issue: admin-put-league'))
router.get("/leagueResult", LeagueController.showLeagueResult)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'showLeagueResult', 'Backend issue: admin-get-leagueResult'))
router.patch("/leagueResult", LeagueController.updateLeagueMatchResult)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'updateLeagueMatchResult', 'Backend issue: admin-patch-leagueResult'))
router.post("/deleteLeagueResult", LeagueController.deleteLeagueResult)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'deleteLeagueResult', 'Backend issue: admin-post-deleteLeagueResult'))
//Fantasy Leagues
router.get("/fantasyLeague", FantasyLeagueController.showAllPublicFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'showAllPublicFantasyLeague', 'Backend issue: admin-get-fantasyLeague'))
router.patch("/fantasyLeague", FantasyLeagueController.editFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'editFantasyLeague', 'Backend issue: admin-patch-fantasyLeague'))
router.put("/fantasyLeague", FantasyLeagueController.deleteFantasyLeague)
// (req, res) => exceptionFunc(req, res)(FantasyLeagueController, 'deleteFantasyLeague', 'Backend issue: admin-put-fantasyLeague'))
//Total War Ladder
router.get("/totalWarLadderResult", LadderController.showAndSearchTotalWarLadderResults)
// (req, res) => exceptionFunc(req, res)(LadderController, 'showAndSearchTotalWarLadderResults', 'Backend issue: admin-get-totalWarLadderResult'))
router.patch("/totalWarLadderResult", LadderController.deleteTotalWarLadderResults)
// (req, res) => exceptionFunc(req, res)(LadderController, 'deleteTotalWarLadderResults', 'Backend issue: admin-patch-totalWarLadderResult'))
router.put("/totalWarLadderResult", LadderController.updateTotalWarLadderResults)
// (req, res) => exceptionFunc(req, res)(LadderController, 'updateTotalWarLadderResults', 'Backend issue: admin-put-totalWarLadderResult'))
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// for exports
router.get("/exportUserData", AdminController.exportUserData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportUserData', 'Backend issue: admin-get-exportUserData'))
router.get("/exportTournamentData", AdminController.exportTournamentData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportTournamentData', 'Backend issue: admin-get-exportTournamentData'))
router.get("/exportLadderData", AdminController.exportLadderData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportLadderData', 'Backend issue: admin-get-exportLadderData'))
router.get("/exportTournamentResultData", AdminController.exportTournamentResultData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportTournamentResultData', 'Backend issue: admin-get-exportTournamentResultData'))
router.get("/exportLadderResultData", AdminController.exportLadderResultData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportLadderResultData', 'Backend issue: admin-get-exportLadderResultData'))
router.get("/exportGrandPrixData", AdminController.exportGrandPrixData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportGrandPrixData', 'Backend issue: admin-get-exportGrandPrixData'))
router.get("/exportGpLeagueData", AdminController.exportGpLeagueData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportGpLeagueData', 'Backend issue: admin-get-exportGpLeagueData'))
router.get("/exportFantasyLeagueData", AdminController.exportFantasyLeagueData)
// (req, res) => exceptionFunc(req, res)(AdminController, 'exportFantasyLeagueData', 'Backend issue: admin-get-exportFantasyLeagueData'))
//////////////////////////////////
//for dev only
router.post("/deleteUser", AdminController.deleteUser)
router.post("/deleteUserById", AdminController.deleteUserById)
router.post("/uploadAsset", assetUpload.single("assetImage"), AdminController.uploadAsset)
router.patch("/game", AdminController.updateGameType)
router.post("/game", AdminController.permanentDeleteGame)
router.post("/deleteFranchise", AdminController.permanentDeleteFranchise)
router.get("/leagueResultDetail", AdminController.leagueResultDetail)
router.post("/deleteLeagueResultDetail", AdminController.deleteLeagueResultDetail)
router.post("/setWinnerToNullForLeagueSchedule", AdminController.setWinnerToNullForLeagueSchedule)
router.post("/deleteLeagueResultByResultId", AdminController.deleteLeagueResultByResultId)
router.post("/deleteAllLeagues", AdminController.deleteAllLeagues)
router.post("/deleteAllLeagueSchedule", AdminController.deleteAllLeagueSchedule)
router.post("/deleteAllLeagueResult", AdminController.deleteAllLeagueResult)
router.post("/deleteAllFantasyLeagues", AdminController.deleteAllFantasyLeagues)
router.post("/deleteAllFantasyLeaguesSchedule", AdminController.deleteAllFantasyLeaguesSchedule)
router.post("/deleteAllFlTeamInvite", AdminController.deleteAllFlTeamInvite)
router.post("/deleteLeagueById", AdminController.deleteLeagueById)
module.exports = router;
