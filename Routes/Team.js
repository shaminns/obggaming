const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const TeamController = require("../Controllers/TeamController");
const UserController = require("../Controllers/UserController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
//title image
var storageTeamTitleImage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/TeamImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const uploadTeamTitleImage = multer({ storage: storageTeamTitleImage });
// background image
var storageTeamBackgroundImage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/TeamImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const uploadTeamBackgroundImage = multer({
	storage: storageTeamBackgroundImage,
});
// Routes
//Team
router.post(
	"/team",
	uploadTeamTitleImage.single("teamTitleImage"),
	(req, res) =>
		exceptionFunc(req, res)(
			TeamController,
			"createTeam",
			"Backend issue: team-post-team"
		)
);
router.get("/team", TeamController.showMyTeams);
router.patch("/team", TeamController.updateTeamViewName);
router.delete("/team", TeamController.deleteTeam);
router.get("/teamDetail", TeamController.teamDetailById);
//Team Invite
router.post("/teamInvite", TeamController.createTeamInvite);
router.get("/teamInvite", TeamController.showMyTeamInvitations);
router.post("/teamInvitationResponse", TeamController.teamInvitationResponse);
router.post("/kickoutMember", TeamController.kickOutFromTeam);
router.post("/leaveTeam", TeamController.leaveTeam);
/////Franchise
router.post(
	"/franchiseTeam",
	uploadTeamTitleImage.single("teamTitleImage"),
	(req, res) =>
		exceptionFunc(req, res)(
			TeamController,
			"createFranchiseTeam",
			"Backend issue: team-post-franchiseTeam"
		)
);
router.get("/franchiseTeam", TeamController.franchiseTeamDetailById);
router.delete("/franchiseTeam", TeamController.deleteFranchiseTeam);
router.post("/franchiseTeamInvite", TeamController.createFranchiseTeamInvite);
router.post(
	"/franchiseTeamInvitationResponse",
	TeamController.franchiseTeamInvitationResponse
);
router.post("/kickOutFranchiseMember", TeamController.kickOutFromFranchiseTeam);
router.post("/updateTeamLeader", TeamController.changeTeamLeader);
router.get("/teamMember", TeamController.getTeamRoosterByTeamId);
router.patch("/teamMember", TeamController.updateTeamMemberPointValue);
router.get("/franchiseTeamList", TeamController.getFranchiseTeamList);
//
router.post(
	"/updateTeamTitleImage",
	uploadTeamTitleImage.single("teamTitleImage"),
	TeamController.updateTeamTileImage
);
router.post(
	"/updateTeamCoverImage",
	uploadTeamTitleImage.single("teamCoverImage"),
	TeamController.updateTeamCoverImage
);
module.exports = router;
