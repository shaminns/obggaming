// Express Router
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
// Middlewares
const jwtAuth = require("../Middleware/JWTAuth");
// Controllers
const UserController = require("../Controllers/UserController");
const TournamentController = require("../Controllers/TournamentController");
const GameController = require("../Controllers/GameController");
const LadderController = require("../Controllers/LadderController");
const MatchController = require("../Controllers/MatchController");
const FranchiseController = require("../Controllers/FranchiseController");
const LeagueController = require("../Controllers/LeagueController");
const TryoutController = require("../Controllers/TryoutController");
const FantasyLeagueController = require("../Controllers/FantasyLeagueController");
const WithdrawController = require("../Controllers/WithdrawController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
const { showAllLeagues } = require("../Controllers/LeagueController");
//-------------------------------Assets Upload (for developer)
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/UserImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const upload = multer({ storage: storage });
//--------------------------------------------------------Match
var storageMatch = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/MatchImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
//will be using this for uplading
const uploadMatch = multer({ storage: storageMatch });
//----------------------------------------------------------User
var storage1 = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/UserBackgroundImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const uploadBg = multer({ storage: storage1 });
//--------------------------------------------------------Ladder
//upload videos
const videoStorage = multer.diskStorage({
	destination: "Uploads/LadderImages/Videos/", // Destination to store video
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "_" + Date.now() + path.extname(file.originalname)
		);
	},
});
const videoUpload = multer({
	storage: videoStorage,
	// limits: {
	//     fileSize: 10000000, // 10000000 Bytes = 10 MB
	// },
	fileFilter(req, file, cb) {
		// upload only mp4 and mkv format
		if (!file.originalname.match(/\.(mp4|MPEG-4|mkv|jpg|jpeg|png)$/)) {
			return cb(new Error("Please upload a video or image file"));
		}
		cb(undefined, true);
	},
});
//-------------------------------------------------------Tournament
//upload videos
const videoStorageForTournament = multer.diskStorage({
	destination: "Uploads/TournamentImages/Videos/", // Destination to store video
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "_" + Date.now() + path.extname(file.originalname)
		);
	},
});
const videoUploadForTournament = multer({
	storage: videoStorageForTournament,
	// limits: {
	//     fileSize: 10000000, // 10000000 Bytes = 10 MB
	// },
	fileFilter(req, file, cb) {
		// upload only mp4 and mkv format
		if (!file.originalname.match(/\.(mp4|MPEG-4|mkv|jpg|jpeg|png)$/)) {
			return cb(new Error("Please upload a video or image file"));
		}
		cb(undefined, true);
	},
});
//-------------------------------------------------------Total War Ladder
//upload videos
const videoStorageForTWL = multer.diskStorage({
	destination: "Uploads/TotalWarLadder/", // Destination to store video
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "_" + Date.now() + path.extname(file.originalname)
		);
	},
});
const videoUploadForTWL = multer({
	storage: videoStorageForTWL,
	// limits: {
	//     fileSize: 10000000, // 10000000 Bytes = 10 MB
	// },
	fileFilter(req, file, cb) {
		// upload only mp4 and mkv format
		if (!file.originalname.match(/\.(mp4|MPEG-4|mkv|jpg|jpeg|png)$/)) {
			return cb(new Error("Please upload a video or image file"));
		}
		cb(undefined, true);
	},
});
//--------------------------------------------------------Franchise
var storagFranchise = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/FranchiseImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
//will be using this for uploading
const uploadFranchise = multer({ storage: storagFranchise });
//----------------------------------------------------Franchise Tournament
var storageTournament = multer.diskStorage({
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
const uploadTournament = multer({ storage: storageTournament });
//----------------------------------------------------League Result
var storageLeagueResult = multer.diskStorage({
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
const uploadLeagueResult = multer({ storage: storageLeagueResult });
//
//// router.get("/teamMember", (req, res)=>exceptionFunc(req,res)(TeamController,'getTeamRoosterByTeamId','Backend Issue: Masla in team member controller'))
router.post("/update", jwtAuth, UserController.updateUser);
router.post("/delete", UserController.delete);
router.post("/showUser", UserController.showSpecificUser);
router.get("/showDetails", UserController.showMyDetails);
router.patch("/showDetails", UserController.editMyDetails);
router.post("/addUser", jwtAuth, UserController.addUser);
router.post("/editProfile", UserController.updateMyProfile);
router.post("/addGamerTag", UserController.addGamerTags);
router.post("/showTags", UserController.showTags);
router.post("/requestWithdrawal", UserController.requestWithdrawal);
router.post("/friendRequest", UserController.sendFriendRequest);
router.patch("/friendRequest", UserController.acceptFriendRequest);
router.delete("/friendRequest", UserController.deleteFriendRequest);
router.get("/myFiendsList", UserController.myFriendsList);
router.get("/myRequest", UserController.showMyRequest);
router.get("/searchUserProfile", UserController.userProfileById);
//Search
router.get("/search", UserController.saerchByFullNameUserName);
//Team
//Tournaments
router.post("/tournament", TournamentController.joinTournament);
router.get("/myTournaments", TournamentController.myTournaments);
router.get("/tournament", TournamentController.myTournaments);
router.get("/tournamentById", TournamentController.tournamentById);
router.get("/tournaments", TournamentController.joinTournament);
router.get("/tournamentByGame", TournamentController.findTournamentByGame);
router.post(
	"/tournamentResult",
	videoUploadForTournament.single("videoResult"),
	TournamentController.addTournamentResult
);
//Ladder
router.post("/ladders", LadderController.joinLadder);
router.get("/myLadders", LadderController.myLadders);
router.get("/ladders", LadderController.ladders);
router.get("/ladderDetail", LadderController.ladderDetail);
router.get("/ladderByGame", LadderController.ladderByGame);
router.post(
	"/ladderResult",
	videoUpload.single("videoResult"),
	LadderController.addLadderResult
);
//Total War Ladder
router.get("/totalWarLadder", LadderController.createAndGetTotalWarLadder);
router.post(
	"/totalWarLadderResult",
	videoUploadForTWL.single("videoResult"),
	LadderController.submitTotalWarLadderResult
);
//Games
router.get("/gameById", GameController.gameById);
router.get("/games", GameController.games);
//Match
router.post(
	"/match",
	uploadMatch.single("matchTitleImage"),
	MatchController.createMatchInvitation
);
router.patch("/match", MatchController.responseMatchInvitation);
router.get("/match", MatchController.myAllMatches);
router.get("/matchById", MatchController.showMatchById);
router.post(
	"/matchResult",
	uploadMatch.single("videoResult"),
	MatchController.addMatchResult
);
router.get("/publicMatch", MatchController.publicMatches);
///////////////////////Franchise
router.post(
	"/franchise",
	uploadFranchise.single("franchiseTitleImage"),
	FranchiseController.createFranchise
);
router.patch("/franchise", FranchiseController.updateAboutAndStatus);
router.get("/allFranchise", FranchiseController.allFranchise);
router.get(
	"/franchise",
	FranchiseController.getFranchiseByUserTokenOrFranchiseId
);
///////////team
router.get("/userFranchiseTeams", FranchiseController.userFranchiseTeamsList);
///////////tournament
//////admin
// router.post("/franchiseTournament", uploadTournament.single("tournamentTitleImage"), TournamentController.createFranchiseTournament)
// router.get("/franchiseTournamentResult", TournamentController.showFranchiseTournamentsForResult)
// router.patch("/franchiseTournamentResult", TournamentController.updateResultForFranchiseTournament)
// router.post("/deleteFranchiseTournamentResult", TournamentController.deleteFranchiseTournamentResult)
// router.patch("/franchiseTournaments", TournamentController.deleteFranchiseTournament)
//////user
router.get("/franchiseTournaments", TournamentController.franchiseTournaments);
router.post(
	"/franchiseTournamentResult",
	videoUploadForTournament.single("videoResult"),
	TournamentController.addFranchiseTournamentResult
);
///////////game
router.get("/franchiseGameList", GameController.allFranchiseGames);
///////////tryout
///////user
router.post("/tryout", TryoutController.addTryoutRequest);
////// franchise owner(admin)
router.get("/tryout", TryoutController.showFranchiseTryoutRequest);
router.patch("/tryout", TryoutController.updateTryoutRequestStatus);
router.post("/addToFranchiseTeam", TryoutController.addUserToFranchiseTeam);
///////////League
router.post("/league", LeagueController.joinLeague);
router.get("/league", LeagueController.showAllLeagues);
router.post(
	"/leagueResult",
	uploadLeagueResult.single("videoResult"),
	LeagueController.submitLeagueMatchResult
);
///////////Fantasy League
////////user
router.get("/fantasyLeague", FantasyLeagueController.getFantasyLeagueById);
router.post("/flInvitation", FantasyLeagueController.sendFlJoinInvitation);
router.patch("/flInvitation", FantasyLeagueController.responseFlJoinInvitaion);
router.get("/flTeam", FantasyLeagueController.getFantasyTeamById);
router.get("/leaguePlayersList", FantasyLeagueController.showAllLeaguePlayer);
router.post("/flTeam", FantasyLeagueController.addMemberToFantasyLeague);
router.patch("/flTeam", FantasyLeagueController.updateMemberToFantasyLeague);
router.put("/flTeam", FantasyLeagueController.changeFlTeamName);
router.get("/flschedule", FantasyLeagueController.getFlSchedule);
router.get("/flLeaderBoard", FantasyLeagueController.getFlLeaderBoard);
router.get("/flStats", FantasyLeagueController.getFlStat);
router.get("/flTeamsDetail", FantasyLeagueController.flTeamsDetail);
//Trademove
router.get("/tradeMoveTeamById", FantasyLeagueController.tradeMoveTeamById);
router.put("/tradeMoveTeamById", FantasyLeagueController.dropMemberFromFlTeam);
router.patch("/tradeMoveTeamById", FantasyLeagueController.updateWaiverClaim);
router.get("/tradeMove", FantasyLeagueController.getTradeMovePlayerData);
router.post("/tradeMove", FantasyLeagueController.sendTradeProposal);
router.get("/tradeMoveRequest", FantasyLeagueController.userTradeMoveRequest);
router.get(
	"/tradeMoveRequestDetail",
	FantasyLeagueController.tradeMoveRequestDetail
);
router.patch(
	"/tradeMoveRequest",
	FantasyLeagueController.updateTradeMoveRequestStatus
);
//transaction
router.get("/transaction-history", WithdrawController.showUserTransaction);
//image
router.post(
	"/updateProfileImage",
	upload.single("profileImage"),
	UserController.updateProfileImage
);
router.post(
	"/updateBackgroundImage",
	uploadBg.single("backgroundImage"),
	UserController.updateBackgroundImage
);
module.exports = router;
