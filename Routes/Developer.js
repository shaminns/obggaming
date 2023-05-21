const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Middlewares
const jwtAuth = require("../Middleware/JWTAuth");
// Controllers
const AdminController = require("../Controllers/AdminController");
const TournamentController = require("../Controllers/TournamentController");
//
router.post("/deleteFranchise", AdminController.permanentDeleteFranchise);
router.post(
	"/deleteLeagueResultDetail",
	AdminController.deleteLeagueResultDetail
);
router.post(
	"/setWinnerToNullForLeagueSchedule",
	AdminController.setWinnerToNullForLeagueSchedule
);
router.post(
	"/deleteLeagueResultByResultId",
	AdminController.deleteLeagueResultByResultId
);

router.post("/changeTournamentType", AdminController.changeTournamentType);
///delete all league related data
router.post("/deleteAllLeagues", AdminController.deleteAllLeagues);
router.post(
	"/deleteAllLeagueSchedule",
	AdminController.deleteAllLeagueSchedule
);
router.post("/deleteAllLeagueResult", AdminController.deleteAllLeagueResult);
router.post(
	"/deleteAllFantasyLeagues",
	AdminController.deleteAllFantasyLeagues
);
router.post(
	"/deleteAllFantasyLeaguesSchedule",
	AdminController.deleteAllFantasyLeaguesSchedule
);
router.post("/deleteAllFlTeamInvite", AdminController.deleteAllFlTeamInvite);
router.post("/deleteAllTradeMove", AdminController.deleteAllTradeMove)
///end delete all league related data
//////////////////////////////////////
router.post("/deleteLeagueById", AdminController.deleteLeagueById);
router.post("/deleteFlTeam", AdminController.deleteFantasyTeam);
router.post("/deleteFlTeamFromFl", AdminController.deleteFlTeamFromFl);
//tournament
router.post(
	"/softDeleteTounaments",
	TournamentController.softDeleteTournaments
);
router.post(
	"/softDeleteTournamentResults",
	TournamentController.softDeleteTournamentResults
);
router.post(
	"/changeDeleteStatusByTournamentId",
	TournamentController.changeTounamentDeleteStatusByTournamentId
);
router.post(
	"/changeTournamentResultDeleteStatusByTournamentId",
	TournamentController.changeTounamentResultDeleteStatusByTournamentId
);
router.post(
	"/softDeleteTournamentScheduleByTornamentId",
	TournamentController.softDeleteTournamentScheduleByTornamentId
);
router.post(
	"/showAllTournamentSchedule",
	TournamentController.showAllTournamentSchedule
);
router.post(
	"/deleteTournamentScheduleByTornamentId",
	TournamentController.deleteTournamentScheduleByTornamentId
);
router.post(
	"/showAllTournamentsWithDeleted",
	TournamentController.showAllTournamentsWithDeleted
);
///
// router.post("/deleteUser", AdminController.deleteUser);
// router.post("/deleteUserById", AdminController.deleteUserById);

// router.patch("/game", AdminController.updateGameType);
// router.post("/game", AdminController.permanentDeleteGame);
// router.get("/leagueResultDetail", AdminController.leagueResultDetail);
//
// router.post(
// 	"/deleteAllDataWithoutGames",
// 	AdminController.deleteAllDataWithoutGames
// );
module.exports = router;
