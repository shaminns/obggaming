// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
//Controller
const franchiseController = require("../Controllers/FranchiseController");

// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const TryoutHelper = require("../Services/TryoutHelper");
const TeamHelper = require("../Services/TeamHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const TournamentAndLeagueHelper = require("../Services/TournamentAndLeagueHelper");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
const moment = require("moment");
const mongoose = require("mongoose");
//
exports.addTryoutRequest = async (req, res) => {
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
		if ((!request.teamId, !request.dateAndTime)) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let checkAlreadySentRequest = await TryoutHelper.findSentRequest(
			request.franchiseId,
			userId
		);
		if (checkAlreadySentRequest != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (checkAlreadySentRequest == null) {
			let franchiseDetail =
				await FranchiseHelper.findFranchiseByIdWithoutDelete(
					request.franchiseId
				);
			let franchiseOwnerId = franchiseDetail.createdBy;
			let requestDateAndTime = await GeneralHelper.dateTimeToUtc(
				request.dateAndTime
			);
			await TryoutHelper.createTryoutRequest(
				request.teamId,
				requestDateAndTime,
				userId,
				request.franchiseId,
				franchiseOwnerId
			);
			let franchiseData =
				await franchiseController.franchiseDetailDataByFranchiseId(
					request.franchiseId,
					userId
				);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		}
	}
};
exports.showFranchiseTryoutRequest = async (req, res) => {
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
		let pageNo;
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!request.pageNo) {
			pageNo = 1;
		}
		let tryoutDetail = await this.tryoutData(userId, pageNo);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tryoutData = tryoutDetail;
		return res.status(response.code).json(response);
	}
};
exports.updateTryoutRequestStatus = async (req, res) => {
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
		await TryoutHelper.updateRequestStatus(request._id, request.status);
		// let pageNo
		// if (request.pageNo) {
		//     pageNo = request.pageNo
		// }
		// if (!request.pageNo) {
		//     pageNo = 1
		// }
		// let tryoutDetail = await this.tryoutData(userId, pageNo)
		let tryoutRecord = await TryoutHelper.findTryoutRequestById(request._id);
		let teamName = await TournamentAndLeagueHelper.getTeamName(
			tryoutRecord.franchiseTeamId
		);
		let userData = await UserHelper.foundUserById(tryoutRecord.userId);
		let userName = userData.userDetail.userName;
		let tryoutDate = moment(tryoutRecord.dateAndTime).format("DD MMM, yyyy");
		let tryoutTime = moment(tryoutRecord.dateAndTime).format("hh:mm A");
		let tryoutObj = {
			_id: tryoutRecord._id,
			status: tryoutRecord.status,
			isAddedToTeam: tryoutRecord.isAddedToTeam,
			team: {
				teamId: tryoutRecord.franchiseTeamId,
				teamViewName: teamName,
			},
			user: {
				userId: tryoutRecord.userId,
				userName: userName,
			},
			franchiseId: tryoutRecord.franchiseId,
			date: tryoutDate,
			time: tryoutTime,
			createdAt: tryoutRecord.createdAt,
		};
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tryoutData = tryoutObj;
		return res.status(response.code).json(response);
	}
};
exports.addUserToFranchiseTeam = async (req, res) => {
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
		let userFranchiseTeamId;
		let teamMemberId = request.userId; //tryout request userId
		let teamId = request.teamId;
		let userFranchiseTeamDetail =
			await franchiseController.getUserFranchiseTeam(teamMemberId);
		if (userFranchiseTeamDetail != null) {
			userFranchiseTeamId = userFranchiseTeamDetail._id;
			let userFranchiseDetail = await franchiseController.getUserUserFrachise(
				userFranchiseTeamId
			);
			if (userFranchiseDetail != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_IN_FRANCHISE_TEAM +
						". Please leave that franchise(team) first!"
				);
				return res.status(response.code).json(response);
			}
		} else {
			let checkAlreadyTeamMember = await TeamHelper.findParticipateInTeam(
				teamId,
				teamMemberId
			);
			if (checkAlreadyTeamMember != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_MEMBER
				);
				return res.status(response.code).json(response);
			}
			if (checkAlreadyTeamMember == null) {
				let userObj = {
					_id: new mongoose.Types.ObjectId(),
					userId: mongoose.Types.ObjectId(teamMemberId),
					role: "Player",
				};
				await TeamHelper.addUserToTeam(teamId, userObj);
				let newTeamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				if (newTeamDetail.teamLeader == null) {
					await TeamHelper.updateTeamLeader(teamId, userId);
				}
				await TryoutHelper.updateIsAddedToTeam(teamId, teamMemberId);
				// let pageNo
				// if (request.pageNo) {
				//     pageNo = request.pageNo
				// }
				// if (!request.pageNo) {
				//     pageNo = 1
				// }
				// let tryoutDetail = await this.tryoutData(userId, pageNo)
				// response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
				// response.tryoutData = tryoutDetail
				// return res.status(response.code).json(response);
				let tryoutRecord = await TryoutHelper.findTryoutRequestById(
					request._id
				);
				let teamName = await TournamentAndLeagueHelper.getTeamName(
					userFranchiseTeamId
				);
				let userData = await UserHelper.foundUserById(userId);
				let userName = userData.userDetail.userName;
				let tryoutDate = moment(tryoutRecord.dateAndTime).format(
					"DD MMM, yyyy"
				);
				let tryoutTime = moment(tryoutRecord.dateAndTime).format("hh:mm A");
				let tryoutObj = {
					_id: tryoutRecord._id,
					status: tryoutRecord.status,
					isAddedToTeam: tryoutRecord.isAddedToTeam,
					team: {
						teamId: tryoutRecord.franchiseTeamId,
						teamViewName: teamName,
					},
					user: {
						userId: tryoutRecord.userId,
						userName: userName,
					},
					franchiseId: tryoutRecord.franchiseId,
					date: tryoutDate,
					time: tryoutTime,
					createdAt: tryoutRecord.createdAt,
				};
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.tryoutData = tryoutObj;
				return res.status(response.code).json(response);
			}
		}
	}
};
////////// user with in tryout controller
exports.tryoutData = async (userId, pageNo) => {
	let tryoutArr = [];
	let tryoutRecord;
	let pagination;
	let franchiseId;
	let franchiseData = await FranchiseHelper.getUserFranchiseDeatil(userId);
	if (franchiseData == null) {
		let teamDetail = await franchiseController.getUserFranchiseTeam(userId);
		if (teamDetail != null) {
			let teamId = teamDetail._id;
			let franchiseDetail = await franchiseController.getUserUserFrachise(
				teamId
			);
			franchiseId = franchiseDetail._id;
		}
		if (teamDetail == null) {
			console.log("no team detail");
		}
	}
	if (franchiseData != null) {
		franchiseId = franchiseData._id;
	}
	tryoutRecord =
		await TryoutHelper.findTryoutByFranchiseIdWithoutDeleteWithPagination(
			franchiseId,
			pageNo
		);
	if (tryoutRecord != null) {
		if (tryoutRecord.data.length > 0) {
			for (let i = 0; i < tryoutRecord.data.length; i++) {
				let teamName = await TournamentAndLeagueHelper.getTeamName(
					tryoutRecord.data[i].franchiseTeamId
				);
				let userData = await UserHelper.foundUserById(
					tryoutRecord.data[i].userId
				);
				let userName = userData.userDetail.userName;
				let tryoutDate = moment(tryoutRecord.data[i].dateAndTime).format(
					"DD MMM, yyyy"
				);
				let tryoutTime = moment(tryoutRecord.data[i].dateAndTime).format(
					"hh:mm A"
				);
				let tryoutObj = {
					_id: tryoutRecord.data[i]._id,
					status: tryoutRecord.data[i].status,
					isAddedToTeam: tryoutRecord.data[i].isAddedToTeam,
					team: {
						teamId: tryoutRecord.data[i].franchiseTeamId,
						teamViewName: teamName,
					},
					user: {
						userId: tryoutRecord.data[i].userId,
						userName: userName,
					},
					franchiseId: tryoutRecord.data[i].franchiseId,
					date: tryoutDate,
					time: tryoutTime,
					createdAt: tryoutRecord.data[i].createdAt,
				};
				tryoutArr.push(tryoutObj);
			}
		}
	} else {
		tryoutArr = [];
	}
	pagination = tryoutRecord.pagination;
	return { ...pagination, data: tryoutArr };
};
