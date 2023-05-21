const fs = require("fs");
// Helpers
const TeamHelper = require("../Services/TeamHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const LadderHelper = require("../Services/LadderHelper");
const LeagueHelper = require("../Services/LeagueHelper");
//Controller
const UserController = require("../Controllers/UserController");
const FranchiseController = require("../Controllers/FranchiseController");
const MatchController = require("../Controllers/MatchController");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
const tokenExtractor = require("../Middleware/TokenExtracter");
const moment = require("moment");
exports.createTeam = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let imagePath;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		if (req.file.mimetype != "image/jpeg") {
			jpgImage = false;
		} else {
			jpgImage = true;
		}
		if (req.file.mimetype != "image/png") {
			pngImage = false;
		} else {
			pngImage = true;
		}
		imagePath = req.file.path;
		if (jpgImage == false && pngImage == false) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (!request.teamViewName || !request.teamNickName) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let teamViewName = request.teamViewName.toLowerCase().trim();
	let teamNickName = request.teamNickName.toLowerCase().trim();
	if (userId != null) {
		let teamResult = await TeamHelper.findTeamWithoutDeleted(teamViewName);
		if (teamResult != null) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_EXIST
			);
			return res.status(response.code).json(response);
		}
		let newTeamId = await TeamHelper.createTeam(
			teamViewName,
			teamNickName,
			imagePath,
			userId
		);
		let teamData = await TeamHelper.findTeamByTeamId(newTeamId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamData;
		return res.status(response.code).json(response);
	}
};
exports.createTeamInvite = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
	}
	if (userId != null) {
		if (!request.friendId || !request.teamId) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let teamInviteCheck = await TeamHelper.findInvite(
			request.teamId,
			userId,
			request.friendId
		);
		if (teamInviteCheck != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (teamInviteCheck == null) {
			let teamInviteId = await TeamHelper.createTeamInvite(
				request.teamId,
				userId,
				request.friendId
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			return res.status(response.code).json(response);
		}
	}
};
exports.showMyTeamInvitations = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
	}
	if (userId != null) {
		if (!request.pageNo) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let result = await TeamHelper.showAllInvitations(request.pageNo, userId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL,
			result
		);
		return res.status(response.code).json(response);
	}
};
exports.teamInvitationResponse = async (req, res) => {
	let request = req.body;
	let teamMemberArr = [];
	let ladderEndResultArr = [];
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
	}
	if (userId != null) {
		if (!request.fromId || !request.teamId || !request.status) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let checkTeamParticipatingInLadder =
			await LadderHelper.findTeamParicipatingInLadder(request.teamId);
		let teamInviteCheck = await TeamHelper.findRequestedInvite(
			request.teamId,
			userId,
			request.fromId
		);
		if (teamInviteCheck == null) {
			response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		} else {
			let teamDetail = await TeamHelper.findTeamById(request);
			if (teamDetail != null) {
				for (let i = 0; i < teamDetail.teamMembers.length; i++) {
					teamMemberArr.push(teamDetail.teamMembers[i].userId.toString());
				}
				if (teamMemberArr.includes(userId.toString())) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_MEMBER
					);
					return res.status(response.code).json(response);
				}
				let teamMemberLength = teamDetail.teamMembers.length;
				let checkTeamParticipatingInTournament =
					await TournamentHelper.findTeamParticipating(request.teamId);
				if (checkTeamParticipatingInTournament.length > 0) {
					await TeamHelper.acceptInvitation(
						request.teamId,
						userId,
						request.fromId,
						"cancelled"
					);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.NOT_JOIN_TEAM_PARTICIPATING_TOURNAMENT
					);
					return res.status(response.code).json(response);
				} else {
					if (checkTeamParticipatingInLadder.length > 0) {
						for (let i = 0; i < checkTeamParticipatingInLadder.length; i++) {
							let nowDate = moment().utc().format("MMM DD YYYY");
							let ladderEndingDateAndTime =
								checkTeamParticipatingInLadder[i].endingDateAndTime;
							let endDate = moment(ladderEndingDateAndTime).format(
								"MMM DD YYYY"
							);
							let dateCheckResult = moment(endDate).isBefore(nowDate, "day");
							if (!dateCheckResult) {
								ladderEndResultArr.push("f");
							}
						}
					}
					if (ladderEndResultArr.length > 0) {
						await TeamHelper.acceptInvitation(
							request.teamId,
							userId,
							request.fromId,
							"cancelled"
						);
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.NOT_JOIN_TEAM_PARTICIPATING_LADDER
						);
						return res.status(response.code).json(response);
					} else {
						await TeamHelper.acceptInvitation(
							request.teamId,
							userId,
							request.fromId,
							request.status
						);
						if (request.status.toLowerCase() == "accepted") {
							await TeamHelper.addMemberToTeam(request.teamId, userId);
						}
						let myRequests = await UserController.myRequestData(userId);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.receivedRequests = myRequests.receivedRequests;
						response.sentRequests = myRequests.sentRequests;
						return res.status(response.code).json(response);
					}
				}
			}
		}
	}
};
exports.kickOutMember = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let leader = userId;
		this.checkUserNameTeamName(request, res);
		if (this.checkAdmin(leader, request.teamName) == null) {
			response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.PERMISSION_DENIED
			);
			return res.status(response.code).json(response);
		}
		let result = await TeamHelper.kickMember(
			request.userName,
			request.teamName
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL,
			result
		);
		return res.status(response.code).json(response);
	}
};
exports.showMyTeams = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let result = await TeamHelper.showTeams(userId);
		let myTeamsData = await this.myTeamsData(result);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teams = myTeamsData;
		return res.status(response.code).json(response);
	}
};
exports.teamDetailById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let teamId = req.query.id;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.teamData = await this.teamDetailData(teamId);
	return res.status(response.code).json(response);
};
exports.kickOutFromTeam = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let pendingResultArr = [];
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamCreator = await TeamHelper.isTeamLeader(request, userId);
		let checkLeaderKickOut = await TeamHelper.isTeamLeader(
			request,
			request.teamMemberId
		);
		if (checkLeaderKickOut != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_LEADER_NOT_KICK_OUT
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamCreator == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_LEADER_CAN_KICK_OUT
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamCreator != null) {
			let teamMemberLength = teamDetail.teamMembers.length;
			let checkTeamParticipatingInTournament =
				await TournamentHelper.findTeamParticipating(request.teamId);
			if (checkTeamParticipatingInTournament.length > 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_KICK_TEAM_PARTICIPATING_TOURNAMENT
				);
				return res.status(response.code).json(response);
			} else {
				let checkTeamParticipatingInLadder =
					await LadderHelper.findTeamParicipatingInLadder(request.teamId);
				if (checkTeamParticipatingInLadder.length == 0) {
					await TeamHelper.leaveTeamMember(
						request.teamId,
						request.teamMemberId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.teamData = await this.teamDetailData(request.teamId);
					return res.status(response.code).json(response);
				} else {
					for (let i = 0; i < checkTeamParticipatingInLadder.length; i++) {
						let nowDate = moment().utc().format("MMM DD YYYY");
						let ladderEndingDateAndTime =
							checkTeamParticipatingInLadder[i].endingDateAndTime;
						let endDate = moment(ladderEndingDateAndTime).format("MMM DD YYYY");
						let dateCheckResult = moment(endDate).isBefore(nowDate, "day");
						if (!dateCheckResult) {
							pendingResultArr.push("f");
						}
					}
					if (pendingResultArr.length > 0) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.NOT_KICK_TEAM_PARTICIPATING_LADDER
						);
						return res.status(response.code).json(response);
					} else {
						await TeamHelper.leaveTeamMember(
							request.teamId,
							request.teamMemberId
						);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.teamData = await this.teamDetailData(request.teamId);
						return res.status(response.code).json(response);
					}
				}
			}
		}
	}
};
exports.leaveTeam = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamLeader = await TeamHelper.isTeamLeader(request, userId);
		if (checkTeamLeader != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEADER_CAN_NOT_LEAVE_TEAM
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamLeader == null) {
			await TeamHelper.leaveTeamMember(request.teamId, userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = await this.teamDetailData(request.teamId);
			return res.status(response.code).json(response);
		}
	}
};
exports.updateTeamTileImage = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		teamTitleImagePath = "";
	}
	if (req.file) {
		if (req.file.mimetype != "image/jpeg") {
			jpgImage = false;
		} else {
			jpgImage = true;
		}
		if (req.file.mimetype != "image/png") {
			pngImage = false;
		} else {
			pngImage = true;
		}
		teamTitleImagePath = req.file.path;
		if (jpgImage == false && pngImage == false) {
			fs.unlinkSync(teamTitleImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(teamTitleImagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(teamTitleImagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamCreator = await TeamHelper.isTeamLeader(request, userId);
		if (checkTeamCreator == null) {
			fs.unlinkSync(teamTitleImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEADER_CHANGE
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamCreator != null) {
			await TeamHelper.updateTitleImage(request.teamId, teamTitleImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = await this.teamDetailData(request.teamId);
			return res.status(response.code).json(response);
		}
	}
};
exports.updateTeamCoverImage = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		teamCoverImagePath = "";
	}
	if (req.file) {
		if (req.file.mimetype != "image/jpeg") {
			jpgImage = false;
		} else {
			jpgImage = true;
		}
		if (req.file.mimetype != "image/png") {
			pngImage = false;
		} else {
			pngImage = true;
		}
		teamCoverImagePath = req.file.path;
		if (jpgImage == false && pngImage == false) {
			fs.unlinkSync(teamCoverImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(teamCoverImagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(teamCoverImagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamCreator = await TeamHelper.isTeamLeader(request, userId);
		if (checkTeamCreator == null) {
			fs.unlinkSync(teamCoverImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEADER_CHANGE
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamCreator != null) {
			await TeamHelper.updateCoverImage(request.teamId, teamCoverImagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = await this.teamDetailData(request.teamId);
			return res.status(response.code).json(response);
		}
	}
};
exports.updateTeamViewName = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamCreator = await TeamHelper.isTeamLeader(request, userId);
		if (checkTeamCreator == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEADER_CHANGE
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamCreator != null) {
			await TeamHelper.updateTeamViewName(
				request.teamId,
				request.teamViewName.toLowerCase().trim()
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = await this.teamDetailData(request.teamId);
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteTeam = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkTeamLeader = await TeamHelper.isTeamLeader(request, userId);
		if (checkTeamLeader == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEADER_DELETE
			);
			return res.status(response.code).json(response);
		}
		if (checkTeamLeader != null) {
			await TeamHelper.deleteTeam(request.teamId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = await this.teamDetailData(request.teamId);
			return res.status(response.code).json(response);
		}
	}
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////// Franchise Work ////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createFranchiseTeam = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let imagePath;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		if (req.file.mimetype != "image/jpeg") {
			jpgImage = false;
		} else {
			jpgImage = true;
		}
		if (req.file.mimetype != "image/png") {
			pngImage = false;
		} else {
			pngImage = true;
		}
		imagePath = req.file.path;
		if (jpgImage == false && pngImage == false) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (!request.teamViewName || !request.teamNickName) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let teamViewName = request.teamViewName.toLowerCase().trim();
	let teamNickName = request.teamNickName.toLowerCase().trim();
	if (userId != null) {
		console.log("franchise team");
		let franchiseTeamResult =
			await TeamHelper.findFranchiseTeamViewNameWithoutDeleted(
				teamViewName,
				request.franchiseId
			);
		if (franchiseTeamResult != null) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (franchiseTeamResult == null) {
			console.log("not exist");
			let franchiseTeamId = await TeamHelper.createFranchiseTeam(
				teamViewName,
				teamNickName,
				imagePath,
				request.franchiseId
			);
			await FranchiseHelper.addTeamToFranchise(
				request.franchiseId,
				franchiseTeamId
			);
			let franchiseData = await FranchiseController.franchiseDetailData(userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		}
	}
};
exports.franchiseTeamDetailById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let teamId = req.query.id;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.teamData = await this.franchiseTeamDetailData(teamId);
	return res.status(response.code).json(response);
};
exports.createFranchiseTeamInvite = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
	}
	if (userId != null) {
		let franchiseName;
		if (!request.friendId || !request.teamId) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let teamInviteCheck = await TeamHelper.findInvite(
			request.teamId,
			userId,
			request.friendId
		);
		if (teamInviteCheck != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (teamInviteCheck == null) {
			let checkFriendIsFranchiseOwner =
				await FranchiseHelper.getUserFranchiseDeatil(request.friendId);
			if (checkFriendIsFranchiseOwner != null) {
				franchiseName = checkFriendIsFranchiseOwner.franchiseName;
			} else {
				franchiseName = "";
			}
			if (checkFriendIsFranchiseOwner != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.FRANCHISE_OWNER_NOT_REQUESTED +
						" of Franchise '" +
						franchiseName +
						"'"
				);
				return res.status(response.code).json(response);
			}
			if (checkFriendIsFranchiseOwner == null) {
				let checkTeamMemberExistArr = await this.checkFranchiseTeamMemberDetail(
					request.friendId
				); //e,n
				if (checkTeamMemberExistArr.includes("e")) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_IN_FRANCHISE_TEAM
					);
					return res.status(response.code).json(response);
				}
				// if (checkTeamMemberExistArr.includes("n")) {
				else {
					let teamInviteId = await TeamHelper.createTeamInvite(
						request.teamId,
						userId,
						request.friendId
					);
					let teamInviteData = await TeamHelper.findInviteById(teamInviteId);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.teamInvitationData = teamInviteData;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.franchiseTeamInvitationResponse = async (req, res) => {
	let request = req.body;
	let teamMemberArr = [];
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
	}
	if (userId != null) {
		if (!request.fromId || !request.teamId || !request.status) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let teamInviteCheck = await TeamHelper.findRequestedInvite(
			request.teamId,
			userId,
			request.fromId
		);
		if (teamInviteCheck == null) {
			response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (teamInviteCheck != null) {
			let teamDetail = await TeamHelper.findTeamById(request);
			for (let i = 0; i < teamDetail.teamMembers.length; i++) {
				teamMemberArr.push(teamDetail.teamMembers[i].userId.toString());
			}
			if (teamMemberArr.includes(userId.toString())) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_MEMBER
				);
				return res.status(response.code).json(response);
			} else {
				let teamMemberStringArr = await this.checkFranchiseTeamMemberDetail(
					userId
				); //e,n
				if (teamMemberStringArr.includes("e")) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_IN_FRANCHISE_TEAM
					);
					return res.status(response.code).json(response);
				}
				if (!teamMemberStringArr.includes("e")) {
					await TeamHelper.acceptInvitation(
						request.teamId,
						userId,
						request.fromId,
						request.status
					);
					if (request.status.toLowerCase() == "accepted") {
						await TeamHelper.addMemberToTeam(request.teamId, userId);
					}
					if (teamDetail.teamMembers.length == 0) {
						await TeamHelper.makeTeamLeader(request.teamId, userId);
					}
				}
			}
		}
		let myRequests = await UserController.myRequestData(userId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.receivedRequests = myRequests.receivedRequests;
		response.sentRequests = myRequests.sentRequests;
		return res.status(response.code).json(response);
	}
};
exports.kickOutFromFranchiseTeam = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let checkLeaderKickOut = await TeamHelper.isTeamLeader(
			request,
			request.teamMemberId
		);
		if (checkLeaderKickOut != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_LEADER_NOT_KICK_OUT + ". Update leader first!"
			);
			return res.status(response.code).json(response);
		}
		let teamDetail = await TeamHelper.findTeamById(request);
		let franchiseTeamId = teamDetail.teamType;
		if (franchiseTeamId == null) {
			console.log("not franchise team");
		} else {
			let franchiseDetail =
				await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseTeamId);
			if (userId.toString() != franchiseDetail.createdBy.toString()) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ONLY_FRANCHISE_OWNER_CAN_KICK_OUT
				);
				return res.status(response.code).json(response);
			}
			let checkTeamParticipatingInTournament =
				await TournamentHelper.findTeamParticipating(request.teamId);
			if (checkTeamParticipatingInTournament.length > 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_KICK_TEAM_PARTICIPATING_TOURNAMENT
				);
				return res.status(response.code).json(response);
			} else {
				let checkTeamParticipatingInLeague =
					await LeagueHelper.findTeamParticipating(request.teamId);
				if (checkTeamParticipatingInLeague.length > 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.NOT_KICK_TEAM_PARTICIPATING_LEAGUE
					);
					return res.status(response.code).json(response);
				} else {
					if (userId.toString() == franchiseDetail.createdBy.toString()) {
						await TeamHelper.leaveTeamMember(
							request.teamId,
							request.teamMemberId
						);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.teamData = await this.teamDetailData(request.teamId);
						return res.status(response.code).json(response);
					}
				}
			}
		}
	}
};
exports.deleteFranchiseTeam = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let teamDetail = await TeamHelper.findTeamByIdWithoutDelete(request.teamId);
		let franchiseId = teamDetail.teamType;
		if (franchiseId == null) {
			console.log("not franchise team");
		} else {
			let franchiseDetail =
				await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseId);
			if (userId.toString() != franchiseDetail.createdBy.toString()) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ONLY_FRANCHISE_OWNER_CAN_DELETE
				);
				return res.status(response.code).json(response);
			} else {
				if (userId.toString() == franchiseDetail.createdBy.toString()) {
					let checkFranchiseExist = await TeamHelper.findTeamIsPlayLeague(
						request.teamId
					);
					if (checkFranchiseExist.length > 0) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.TEAM_PARTICIPATE_IN_MATCH
						);
						return res.status(response.code).json(response);
					} else {
						let checkPendingTeamInviteExist =
							await TeamHelper.findPendingTeamInvite(request.teamId);
						if (checkPendingTeamInviteExist.length > 0) {
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.TEAM_HAS_PENDING_INVITES
							);
							return res.status(response.code).json(response);
						} else {
							await TeamHelper.deleteTeam(request.teamId);
							response = ResponseHelper.setResponse(
								ResponseCode.SUCCESS,
								Message.REQUEST_SUCCESSFUL
							);
							response.teamData = await this.teamDetailData(request.teamId);
							return res.status(response.code).json(response);
						}
					}
				}
			}
		}
	}
};
exports.changeTeamLeader = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		await TeamHelper.updateTeamLeader(request.teamId, request.teamLeader);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = await this.franchiseTeamDetailData(request.teamId);
		return res.status(response.code).json(response);
	}
};
exports.getTeamRoosterByTeamId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let userArr = [];
		let teamDetail = await TeamHelper.findTeamDeatilByTeamId(request.teamId);
		if (teamDetail != null) {
			if (teamDetail.teamMembers.length > 0) {
				for (let i = 0; i < teamDetail.teamMembers.length; i++) {
					let userData = await UserHelper.foundUserById(
						teamDetail.teamMembers[i].userId
					);
					let userObj = {
						_id: userData._id,
						profileImage: userData.profileImage,
						userName: userData.userDetail.userName,
					};
					userArr.push(userObj);
				}
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamMembers = userArr;
		return res.status(response.code).json(response);
	}
};
exports.updateTeamMemberPointValue = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let numberValue = request.numberValue;
		let type = request.type.toLowerCase();
		let teamId = request.teamId;
		let memberId = request.memberId;
		let userObj = {};
		if (type == "prz") {
			await TeamHelper.updateTeamPrzPointValue(teamId, memberId, numberValue);
		} else if (type == "mcd") {
			await TeamHelper.updateTeamMcdPointValue(teamId, memberId, numberValue);
		} else {
			await TeamHelper.updateTeamMprzPointValue(teamId, memberId, numberValue);
		}
		let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
		if (teamDetail != null) {
			let teamMembers = teamDetail.teamMembers;
			let matchData;
			if (teamMembers.length > 0) {
				for (let i = 0; i < teamMembers.length; i++) {
					if (teamMembers[i].userId.toString() == memberId.toString()) {
						let fullName;
						let profileImage;
						let userData = await UserHelper.foundUserById(
							teamMembers[i].userId
						);
						if (userData != null) {
							fullName = userData.userDetail.userName;
							profileImage = userData.profileImage;
							matchData = await MatchController.matchDataByUserId(
								teamMembers[i].userId
							);
						} else {
							fullName = "";
							profileImage = "";
						}
						/// inside userObj
						//  role: teamMembers[i].role,
						userObj = {
							_id: teamMembers[i].userId,
							fullName: fullName,
							profileImage: profileImage,
							wins: matchData.win,
							loss: matchData.loss,
							prz: teamMembers[i].prz,
							mcd: teamMembers[i].mcd,
							mprz: teamMembers[i].mprz,
						};
					}
				}
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.memberData = userObj;
		return res.status(response.code).json(response);
	}
};
exports.getFranchiseTeamList = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let franchiseId = request.franchiseId;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let teamArr = [];
		let franchiseTeamList = await TeamHelper.findFranchiseTeamWithoutDeleted(
			franchiseId
		);
		for (let i = 0; i < franchiseTeamList.length; i++) {
			let teamObj = {
				_id: franchiseTeamList[i]._id,
				teamViewName: franchiseTeamList[i].teamViewName,
				teamTitleImage: franchiseTeamList[i].teamTitleImage,
			};
			teamArr.push(teamObj);
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamArr;
		return res.status(response.code).json(response);
	}
};
/////////// Use in Team Controller//////////////
/////////////////// waheeb  ///////////////////
//////////////////teams data /////////////////
// input array (result)
exports.myTeamsData = async (result) => {
	let allTeamsArr = [];
	let teamId;
	let win = 0;
	let loss = 0;
	if (result.length > 0) {
		for (let i = 0; i < result.length; i++) {
			teamId = result[i]._id;
			let userParticipatingTournaments =
				await TournamentHelper.findMyTournament(teamId);
			if (userParticipatingTournaments.length > 0) {
				for (let j = 0; j < userParticipatingTournaments.length; j++) {
					if (userParticipatingTournaments[j].winningTeam != null) {
						if (
							userParticipatingTournaments[j].winningTeam.toString() !=
							teamId.toString()
						) {
							loss++;
						}
						if (
							userParticipatingTournaments[j].winningTeam.toString() ==
							teamId.toString()
						) {
							win++;
						}
					}
				}
				let teamData = {
					teamTitleImage: result[i].teamTitleImage,
					winsCount: win,
					lossCount: loss,
					_id: result[i]._id,
					teamViewName: result[i].teamViewName,
					teamNickName: result[i].teamNickName,
				};
				allTeamsArr.push(teamData);
				win = 0;
				loss = 0;
			}
			if (userParticipatingTournaments.length == 0) {
				let teamData = {
					teamTitleImage: result[i].teamTitleImage,
					winsCount: win,
					lossCount: loss,
					_id: result[i]._id,
					teamViewName: result[i].teamViewName,
					teamNickName: result[i].teamNickName,
				};
				allTeamsArr.push(teamData);
			}
		}
	}
	return allTeamsArr;
};
//////////////////team detail data
exports.teamDetailData = async (teamId) => {
	let winPercentage;
	let teamMembersFinalArr = [];
	let leader;
	let teamWinLossDetail = await this.teamWinLossDetail(teamId);
	let winsCount = teamWinLossDetail.wins;
	let lossCount = teamWinLossDetail.loss;
	let teamParticipatingTournaments = await TournamentHelper.findMyTournament(
		teamId
	);
	let teamData = await TeamHelper.findTeamDeatilByTeamId(teamId);
	if (teamData.teamMembers.length > 0) {
		for (let i = 0; i < teamData.teamMembers.length; i++) {
			let teamMemberId = teamData.teamMembers[i].userId;
			let matchData = await MatchController.matchDataByUserId(teamMemberId);
			let teamMemberDetail = await UserHelper.foundUserById(teamMemberId);
			let teamMemberData = {
				_id: teamMemberDetail._id,
				fullName: teamMemberDetail.userDetail.fullName,
				profileImage: teamMemberDetail.profileImage,
				wins: matchData.win,
				loss: matchData.loss,
			};
			teamMembersFinalArr.push(teamMemberData);
		}
	}
	if (winsCount + lossCount > 0) {
		winPercentage = (winsCount / (winsCount + lossCount)) * 100;
	} else {
		winPercentage = 0;
	}
	if (teamData.teamLeader == null) {
		leader = {
			_id: null,
			profileImage: "",
			fullName: "",
			wins: 0,
			loss: 0,
		};
	} else {
		let matchData = await MatchController.matchDataByUserId(
			teamData.teamLeader._id
		);
		leader = {
			_id: teamData.teamLeader._id,
			profileImage: teamData.teamLeader.profileImage,
			fullName: teamData.teamLeader.userDetail.fullName,
			wins: matchData.win,
			loss: matchData.loss,
		};
	}
	let teamDetailObj = {
		_id: teamData._id,
		teamViewName: teamData.teamViewName,
		createdAt: teamData.createdAt,
		members: teamData.teamMembers.length,
		leader: leader,
		wins: winsCount,
		loss: lossCount,
		matches: teamParticipatingTournaments.length,
		winPercentage: winPercentage + "%",
		teamTitleImage: teamData.teamTitleImage,
		teamCoverImage: teamData.teamCoverImage,
		isDeleted: teamData.isDeleted,
		deletedAt: teamData.deletedAt,
		rooster: teamMembersFinalArr,
	};
	return teamDetailObj;
};
////// franchise team detail data
//////////////////team detail data
exports.franchiseTeamDetailData = async (teamId) => {
	let winPercentage;
	let teamMembersFinalArr = [];
	let leader;
	let teamWinLossDetail = await this.teamWinLossDetail(teamId);
	let winsCount = teamWinLossDetail.wins;
	let lossCount = teamWinLossDetail.loss;
	let teamParticipatingTournaments = await TournamentHelper.findMyTournament(
		teamId
	);
	let teamData = await TeamHelper.findTeamDeatilByTeamId(teamId);
	if (teamData.teamMembers.length > 0) {
		for (let i = 0; i < teamData.teamMembers.length; i++) {
			let teamMemberId = teamData.teamMembers[i].userId;
			let teamMemberPrz = teamData.teamMembers[i].prz;
			let teamMemberMcd = teamData.teamMembers[i].mcd;
			let teamMemberMprz = teamData.teamMembers[i].mprz;
			let matchData = await MatchController.matchDataByUserId(teamMemberId);
			let teamMemberDetail = await UserHelper.foundUserById(teamMemberId);
			let teamMemberData = {
				_id: teamMemberDetail._id,
				fullName: teamMemberDetail.userDetail.fullName,
				profileImage: teamMemberDetail.profileImage,
				wins: matchData.win,
				loss: matchData.loss,
				prz: teamMemberPrz,
				mcd: teamMemberMcd,
				mprz: teamMemberMprz,
			};
			teamMembersFinalArr.push(teamMemberData);
		}
	}
	if (winsCount + lossCount > 0) {
		winPercentage = (winsCount / (winsCount + lossCount)) * 100;
	} else {
		winPercentage = 0;
	}
	if (teamData.teamLeader == null) {
		leader = {
			_id: null,
			profileImage: "",
			fullName: "",
			wins: 0,
			loss: 0,
			prz: 0,
			mcd: 0,
			mprz: 0,
		};
	} else {
		let matchData = await MatchController.matchDataByUserId(
			teamData.teamLeader._id
		);
		leader = {
			_id: teamData.teamLeader._id,
			profileImage: teamData.teamLeader.profileImage,
			fullName: teamData.teamLeader.userDetail.fullName,
			wins: matchData.win,
			loss: matchData.loss,
			prz: 0,
			mcd: 0,
			mprz: 0,
		};
	}
	let teamDetailObj = {
		_id: teamData._id,
		teamViewName: teamData.teamViewName,
		createdAt: teamData.createdAt,
		members: teamData.teamMembers.length,
		leader: leader,
		wins: winsCount,
		loss: lossCount,
		matches: teamParticipatingTournaments.length,
		winPercentage: winPercentage + "%",
		teamTitleImage: teamData.teamTitleImage,
		teamCoverImage: teamData.teamCoverImage,
		isDeleted: teamData.isDeleted,
		deletedAt: teamData.deletedAt,
		rooster: teamMembersFinalArr,
	};
	return teamDetailObj;
};
/////////get team win,loss///// use in team and tournament controller
exports.teamWinLossDetail = async (teamId) => {
	let winsCount = 0;
	let lossCount = 0;
	let teamParticipatingTournaments = await TournamentHelper.findMyTournament(
		teamId
	);
	if (teamParticipatingTournaments.length == 0) {
		winsCount = 0;
		lossCount = 0;
	}
	if (teamParticipatingTournaments.length > 0) {
		for (let i = 0; i < teamParticipatingTournaments.length; i++) {
			let tournamentId = teamParticipatingTournaments[i]._id;
			let teamDetail = await TournamentHelper.findTournamentById(tournamentId);
			if (teamDetail != null) {
				if (teamDetail.winningTeam != null) {
					if (teamDetail.winningTeam.toString() == teamId.toString()) {
						winsCount++;
					}
					if (teamDetail.winningTeam.toString() != teamId.toString()) {
						lossCount++;
					}
				}
			}
		}
	}
	return { wins: winsCount, loss: lossCount };
};
//////////check already any of franchise team member
exports.checkFranchiseTeamMemberDetail = async (userId) => {
	let teamMemberStringArr = [];
	let finalTeamMemberArr = [];
	let franchiseDetail = await FranchiseHelper.showAllFranchiseWithoutDelete();
	for (let i = 0; i < franchiseDetail.length; i++) {
		let franchiseTeamsArr = franchiseDetail[i].franchiseTeams;
		for (let j = 0; j < franchiseTeamsArr.length; j++) {
			let teamId = franchiseTeamsArr[j];
			let teamData = await TeamHelper.findTeamDetailByTeamIdWithoutDelete(
				teamId
			);
			if (teamData != null) {
				if (teamData.teamMembers.length > 0) {
					let teamMembersArr = teamData.teamMembers;
					for (let k = 0; k < teamMembersArr.length; k++) {
						teamMemberStringArr.push(teamMembersArr[k].userId.toString());
					}
					if (teamMemberStringArr.includes(userId.toString())) {
						finalTeamMemberArr.push("e");
					}
					if (!teamMemberStringArr.includes(userId.toString())) {
						finalTeamMemberArr.push("n");
					}
					teamMemberStringArr = [];
				}
			}
		}
	}
	return finalTeamMemberArr;
};
//////////get franchise id(array) if user exist in any franchise team
exports.getFranchiseIdForUser = async (userId) => {
	let teamMemberStringArr = [];
	let franchiseIdArr = [];
	let finalFranchiseId;
	let franchiseDetail = await FranchiseHelper.showAllFranchiseWithoutDelete();
	///if
	for (let i = 0; i < franchiseDetail.length; i++) {
		let franchiseTeamsArr = franchiseDetail[i].franchiseTeams;
		//if
		for (let j = 0; j < franchiseTeamsArr.length; j++) {
			let teamId = franchiseTeamsArr[j];
			let teamData = await TeamHelper.findTeamDetailByTeamIdWithoutDelete(
				teamId
			);
			if (teamData != null) {
				let teamMembersArr = teamData.teamMembers;
				for (let k = 0; k < teamMembersArr.length; k++) {
					teamMemberStringArr.push(teamMembersArr[k].userId.toString());
				}
				if (teamMemberStringArr.includes(userId.toString())) {
					finalFranchiseId = franchiseDetail[i]._id;
					franchiseIdArr.push(finalFranchiseId);
				}
				teamMemberStringArr = [];
			}
		}
	}
	return franchiseIdArr;
};
/// get league team data (for tile view)
exports.getLeagueTeamData = async (teamId) => {
	let teamDetail = await TeamHelper.findTeamByTeamId(teamId);
	let teamViewName = teamDetail.teamViewName;
	let teamTitleImage = teamDetail.teamTitleImage;
	let teamRoosterCount = teamDetail.teamMembers.length;
	let teamLeaderDetail = await UserHelper.foundUserById(teamDetail.teamLeader);
	let teamLeaderName = teamLeaderDetail.userDetail.userName;
	let teamDetailObj = {
		_id: teamId,
		teamTitleImage: teamTitleImage,
		teamViewName: teamViewName,
		rooster: teamRoosterCount,
		leader: teamLeaderName,
		teamType: teamLeaderName.teamType,
	};
	return teamDetailObj;
};
exports.getTeamNameAndImage = async (teamId) => {
	let teamViewName = "";
	let teamImage = "";
	let teamDeatil = await TeamHelper.findTeamDeatilByTeamId(teamId);
	if (teamDeatil != null) {
		teamViewName = teamDeatil.teamViewName;
		teamImage = teamDeatil.teamTitleImage;
	} else {
		console.log("team not found");
	}
	return { teamViewName: teamViewName, teamTitleImage: teamImage };
};
///////////////////////////////
exports.checkUserNameTeamName = async (request, res) => {
	if (!request.userName || !request.teamName) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
};
exports.checkTeamName = async (request, res) => {
	if (!request.teamName) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
};
exports.checkIfInvitationAvailable = async (request, userName) => {
	return TeamHelper.findInvite(request.teamName, userName);
};
exports.checkUserName = async (request, res) => {
	if (!request.userName) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
};
exports.checkAdmin = async (leader, teamName) => {
	let result = await TeamHelper.findAdmin(leader, teamName);
	return result;
};
exports.checkIfMemberAlreadyExist = function (userName, teamName) {
	return TeamHelper.findMember(userName, teamName);
};
