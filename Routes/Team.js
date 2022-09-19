const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const TeamController = require("../Controllers/TeamController");
const UserController = require("../Controllers/UserController");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
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
const uploadTeamTitleImage = multer({storage: storageTeamTitleImage});
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
const uploadTeamBackgroundImage = multer({storage: storageTeamBackgroundImage});
// Routes
//Team
router.post("/team", uploadTeamTitleImage.single("teamTitleImage"), (req, res) => exceptionFunc(req, res)(TeamController, 'createTeam', 'Backend issue: team-post-team'));
router.get("/team", TeamController.showMyTeams)
// (req, res) => exceptionFunc(req, res)(TeamController, 'showMyTeams', 'Backend issue: team-get-team'));
router.patch("/team", TeamController.updateTeamViewName)
// (req, res) => exceptionFunc(req, res)(TeamController, 'updateTeamViewName', 'Backend issue: team-patch-team'))
router.delete("/team", TeamController.deleteTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'deleteTeam', 'Backend issue: team-delete-team'))
router.get("/teamDetail", TeamController.teamDetailById)
// (req, res) => exceptionFunc(req, res)(TeamController, 'teamDetailById', 'Backend issue: team-get-teamDetail'))
//Team Invite
router.post("/teamInvite", TeamController.createTeamInvite)
// (req, res) => exceptionFunc(req, res)(TeamController, 'createTeamInvite', 'Backend issue: team-post-teamInvite'))
router.get("/teamInvite", TeamController.showMyTeamInvitations)
// (req, res) => exceptionFunc(req, res)(TeamController, 'showMyTeamInvitations', 'Backend issue: team-get-teamInvite'));
router.post("/teamInvitationResponse", TeamController.teamInvitationResponse)
// (req, res) => exceptionFunc(req, res)(TeamController, 'teamInvitationResponse', 'Backend issue: team-post-teamInvitationResponse'));
router.post("/kickoutMember", TeamController.kickOutFromTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'kickOutFromTeam', 'Backend issue: team-post-kickoutMember'))
router.post("/leaveTeam", TeamController.leaveTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'leaveTeam', 'Backend issue: team-post-leaveTeam'))
/////Franchise
router.post("/franchiseTeam", uploadTeamTitleImage.single("teamTitleImage"), (req, res) => exceptionFunc(req, res)(TeamController, 'createFranchiseTeam', 'Backend issue: team-post-franchiseTeam'));
router.get("/franchiseTeam", TeamController.franchiseTeamDetailById)
// (req, res) => exceptionFunc(req, res)(TeamController, 'franchiseTeamDetailById', 'Backend issue: team-get-franchiseTeam'))
router.delete("/franchiseTeam", TeamController.deleteFranchiseTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'deleteFranchiseTeam', 'Backend issue: team-delete-franchiseTeam'))
router.post("/franchiseTeamInvite", TeamController.createFranchiseTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'createFranchiseTeamInvite', 'Backend issue: team-post-franchiseTeamInvite'));
router.post("/franchiseTeamInvitationResponse", TeamController.franchiseTeamInvitationResponse)
// (req, res) => exceptionFunc(req, res)(TeamController, 'franchiseTeamInvitationResponse', 'Backend issue: team-post-franchiseTeamInvitationResponse'));
router.post("/kickOutFranchiseMember", TeamController.kickOutFromFranchiseTeam)
// (req, res) => exceptionFunc(req, res)(TeamController, 'kickOutFromFranchiseTeam', 'Backend issue: team-post-kickOutFromFranchiseTeam'))
router.post("/updateTeamLeader", TeamController.changeTeamLeader)
// (req, res) => exceptionFunc(req, res)(TeamController, 'changeTeamLeader', 'Backend issue: team-post-updateTeamLeader'))
router.get("/teamMember", TeamController.getTeamRoosterByTeamId)
// (req, res) => exceptionFunc(req, res)(TeamController, 'getTeamRoosterByTeamId', 'Backend issue: team-get-teamMember'))
router.patch("/teamMember", TeamController.updateTeamMemberPointValue)
// (req, res) => exceptionFunc(req, res)(TeamController, 'updateTeamMemberPointValue', 'Backend issue: team-patch-teamMember'))
router.get("/franchiseTeamList", TeamController.getFranchiseTeamList)
// (req, res) => exceptionFunc(req, res)(TeamController, 'getFranchiseTeamList', 'Backend issue: team-get-franchiseTeamList'))
//
router.post("/updateTeamTitleImage",
	uploadTeamTitleImage.single("teamTitleImage"), TeamController.updateTeamTileImage)
router.post("/updateTeamCoverImage",
	uploadTeamTitleImage.single("teamCoverImage"), TeamController.updateTeamCoverImage)
module.exports = router;
