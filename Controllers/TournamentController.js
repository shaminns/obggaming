const moment = require("moment");
const mongoose = require("mongoose");
const fs = require("fs");
// Controllers
const TeamController = require("../Controllers/TeamController");
const FranchiseController = require("../Controllers/FranchiseController");

// Helpers
const UserHelper = require("../Services/UserHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const GameHelper = require("../Services/GameHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const TeamHelper = require("../Services/TeamHelper");
const TournamentResultHelper = require("../Services/TournamentResultHelper");
const TournamentScheduleHelper = require("../Services/TournamentScheduleHelper");
const TournamentAndLeagueHelper = require("../Services/TournamentAndLeagueHelper");
// Models
const Tournament = require("../Models/Tournament");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
const tokenExtractor = require("../Middleware/TokenExtracter");

exports.createTournament = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
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
	if (
		!request.tournamentName ||
		!request.gameToPlay ||
		!request.teamSize ||
		!request.totalTeams ||
		!request.entryFee ||
		!request.prize ||
		!request.startingDateAndTime
	) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let startDateAndTime = await GeneralHelper.dateTimeToUtc(
		request.startingDateAndTime
	);
	let tournamentNameCheck = await TournamentHelper.findActiveTournament(
		request
	);
	if (tournamentNameCheck != null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.ALREADY_EXIST
		);
		return res.status(response.code).json(response);
	}
	let totalTeamsArr = ["4", "8", "16", "32"];
	let teamCountResult = totalTeamsArr.includes(request.totalTeams.toString());
	if (teamCountResult == false) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.TOTAL_TEAMS_ERROR
		);
		return res.status(response.code).json(response);
	}
	if (request.totalTeams < 4) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MINIMUM_TEAM_REQUIRED
		);
		return res.status(response.code).json(response);
	}
	let newTournamentId = await TournamentHelper.createTournament(
		request,
		imagePath,
		startDateAndTime
	);
	let tournament = await TournamentHelper.findTournamentByIdWithGamePopulate(
		newTournamentId
	);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournament = tournament;
	return res.status(response.code).json(response);
};
exports.listTournaments = async (req, res, next) => {
	let paramTournamentName = req.query.query;
	let request = req.query;
	let result;
	let pageNo;
	let tournamentType = [];
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}
	if (request.type) {
		tournamentType.push(request.type);
	}
	if (!request.type) {
		tournamentType = ["franchise", "general"];
	}

	let response = ResponseHelper.getDefaultResponse();
	result = await TournamentHelper.tournamentsWithPagination(
		pageNo,
		req.query.query,
		req.query.type
	);
	// if (req.query.type) {
	// 	if (req.query.query) {
	// 		result = await TournamentHelper.tournamentsByNameWithPagination(
	// 			req.query.query.toLowerCase(),
	// 			pageNo,
	// 			tournamentType
	// 		);
	// 	}
	// 	if (!req.query.query) {
	// 		result = await TournamentHelper.tournamentsWithPagination(
	// 			pageNo,
	// 			tournamentType
	// 		);
	// 	}
	// } else {
	// 	if (req.query.query) {
	// 		result = await TournamentHelper.tournamentsByNameWithPagination(
	// 			req.query.query.toLowerCase(),
	// 			pageNo,
	// 			tournamentType
	// 		);
	// 	}
	// 	if (!req.query.query) {
	// 		result = await TournamentHelper.tournamentsWithPagination(
	// 			pageNo,
	// 			tournamentType
	// 		);
	// 	}
	// }
	let finalArr = [];
	for (let i = 0; i < result.data.length; i++) {
		let tournamentObj = {
			tournamentTitleImage: result.data[i].tournamentTitleImage,
			totalTeams: result.data[i].totalTeams,
			participatingTeams: result.data[i].participatingTeams,
			winningTeam: result.data[i].winningTeam,
			tournamentType: result.data[i].tournamentType,
			isDeleted: result.data[i].isDeleted,
			deletedAt: result.data[i].deletedAt,
			_id: result.data[i]._id,
			tournamentName: result.data[i].tournamentName,
			gameToPlay: result.data[i].gameToPlay,
			teamSize: result.data[i].teamSize,
			entryFee: result.data[i].entryFee,
			prize: result.data[i].prize,
			startingDateAndTime: result.data[i].startingDateAndTime,
			tournamentImage: result.data[i].tournamentImage,
			createdAt: result.data[i].createdAt,
			updatedAt: result.data[i].updatedAt,
		};
		finalArr.push(tournamentObj);
	}
	let pagination = result.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = { ...pagination, data: finalArr };
	return res.status(response.code).json(response);
};
exports.getTournamentInfo = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request.tournamentId) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let result = await TournamentHelper.findTournamentById(request.tournamentId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		result
	);
	return res.status(response.code).json(response);
};
exports.updateTournament = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let id = request._id;
	let imagePath;
	let jpgImage;
	let pngImage;
	let tournament = await TournamentHelper.findTournamentById(id);
	if (tournament == null) {
		if (req.file) {
			imagePath = req.file.path;
			fs.unlinkSync(imagePath);
		}
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.TOURNAMENT_DOES_NOT_EXISTS
		);
		return res.status(response.code).json(response);
	}
	if (tournament != null) {
		if (!req.file) {
			imagePath = tournament.tournamentTitleImage;
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
	}
	let tournamentId = request._id;
	let tournamentDetail = await TournamentHelper.findTournamentById(
		tournamentId
	);
	if (tournamentDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.TOURNAMENT_DOES_NOT_EXISTS
		);
		return res.status(response.code).json(response);
	} else {
		let participatingTeams = tournamentDetail.participatingTeams;
		if (participatingTeams.length > 0) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.CAN_NOT_UPDATE
			);
			return res.status(response.code).json(response);
		} else {
			await TournamentHelper.updateTournament(
				tournament,
				request,
				id,
				imagePath
			);
			let result = await TournamentHelper.findTournamentByIdWithGamePopulate(
				id
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = result;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteTournament = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let deletedId = [];
	let notDeletedIds = [];
	for (let i = 0; i < request.tournamentId.length; i++) {
		let tournamentId = request.tournamentId[i];
		let tournamentDetail = await TournamentHelper.findTournamentById(
			tournamentId
		);
		if (tournamentDetail == null) {
			notDeletedIds.push(tournamentId);
		} else {
			let participatingTeams = tournamentDetail.participatingTeams;
			if (participatingTeams.length > 0) {
				let checkResultExist =
					await TournamentResultHelper.findTournamentResultExist(tournamentId);
				if (checkResultExist.length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.CAN_NOT_DELETE_RESULT_WAITING
					);
					return res.status(response.code).json(response);
				} else {
					let checkPendingTournamentResults =
						await TournamentResultHelper.findPendingResult(tournamentId);
					if (checkPendingTournamentResults.length > 0) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.CAN_NOT_DELETE_PENDING_RESULT
						);
						return res.status(response.code).json(response);
					} else {
						// let checkTotalTournamentResultExist = await TournamentResultHelper.findTotalTournamentResultsExist(tournamentId)
						if (checkResultExist.length != participatingTeams.length) {
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.CAN_NOT_DELETE_SOME_PENDING_RESULT
							);
							return res.status(response.code).json(response);
						} else {
							await TournamentHelper.deleteTournament(tournamentId);
							deletedId.push(tournamentId);
						}
					}
				}
			} else {
				let tournamentImg = tournamentDetail.tournamentTitleImage;
				fs.unlinkSync(tournamentImg);
				await TournamentHelper.deleteTournamentPermanent(tournamentId);
				deletedId.push(tournamentId);
			}
		}
	}
	if (notDeletedIds.length != 0) {
		console.log("Records of these ID/s not found : " + notDeletedIds);
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentId = deletedId;
	return res.status(response.code).json(response);
};
exports.joinTournament = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let teamId = request.teamId;
	let tournamentTeamSizeRequired;
	let teamSizeOfUser;
	let totalTeamLimit;
	let tournamentTotalTeamRequired;
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
		if (!request.teamId && !request.tournamentId) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let teamDetail = await TeamHelper.findTeamById(request);
		if (teamDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_DOESNOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (teamDetail.teamLeader == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NO_TEAM_LEADER_FOUND
			);
			return res.status(response.code).json(response);
		}
		let findTournament = await TournamentHelper.findTournamentById(
			request.tournamentId
		);
		if (findTournament == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TOURNAMENT_DOES_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		}
		if (findTournament != null) {
			tournamentTeamSizeRequired = findTournament.teamSize;
		}
		teamSizeOfUser = teamDetail.teamMembers.length;
		if (tournamentTeamSizeRequired != teamSizeOfUser) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_SIZE_NOT_MATCH
			);
			return res.status(response.code).json(response);
		}
		totalTeamLimit = findTournament.participatingTeams.length;
		tournamentTotalTeamRequired = findTournament.totalTeams;
		if (totalTeamLimit == tournamentTotalTeamRequired) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_SIZE_EXCEED
			);
			return res.status(response.code).json(response);
		}
		let userData = await UserHelper.foundUserById(userId);
		let userCredit = userData.userDetail.credits;
		let tournamentEntryFee = findTournament.entryFee;
		let finalCredit = 0;
		if (userCredit < tournamentEntryFee) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_ENOUGH_CREDIT
			);
			return res.status(response.code).json(response);
		} else {
			finalCredit = userCredit - tournamentEntryFee;
		}
		let tournamentArr = [];
		let teamMemberArr = [];
		let participatingMemberArr = findTournament.participatingTeams;
		for (let i = 0; i < participatingMemberArr.length; i++) {
			let teamId = participatingMemberArr[i];
			let participatingTeamDetail = await TeamHelper.findTeamDeatilByTeamId(
				teamId
			);
			for (let j = 0; j < participatingTeamDetail.teamMembers.length; j++) {
				let teamMemberId = participatingTeamDetail.teamMembers[j].userId;
				teamMemberArr.push(teamMemberId.toString());
			}
			for (let k = 0; k < teamDetail.teamMembers.length; k++) {
				let teamMemberCheck = teamMemberArr.includes(
					teamDetail.teamMembers[k].userId.toString()
				);
				if (teamMemberCheck == true) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.MEMBER_ALREADY_PARTICIPATED
					);
					return res.status(response.code).json(response);
				}
				tournamentArr.push(teamId.toString());
			}
		}
		let teamIdForCheck = teamDetail._id.toString();
		if (tournamentArr.includes(teamIdForCheck)) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_ALREADY_PARTICIPATING
			);
			return res.status(response.code).json(response);
		} else {
			let tournamentId = findTournament._id;
			let gameToPlay = findTournament.gameToPlay;
			await TournamentHelper.addTeam(tournamentId, teamDetail._id);
			await TeamHelper.updateTournamentDetail(request.teamId, tournamentId);
			await TeamHelper.updateTournamentGameDetail(request.teamId, gameToPlay);
			await UserHelper.updateCredit(userId, finalCredit);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = await this.tournamentDetailData(
				request.tournamentId,
				userId
			);
			return res.status(response.code).json(response);
		}
	}
};
exports.tournamentById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let tournamentId = req.query.id;
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
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournamentData = await this.tournamentDetailData(
			tournamentId,
			userId
		);
		return res.status(response.code).json(response);
	}
};
exports.teamCurrentTournament = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let teamId = request.teamId;
	let tournamentArr = [];
	let status;
	let currentTournamentData = await TournamentHelper.teamTournamentsDetail(
		teamId
	);
	for (let i = 0; i < currentTournamentData.length; i++) {
		let startingDateAndTime = currentTournamentData[i].startingDateAndTime;
		let tournamentDate = moment(startingDateAndTime).format("MMM DD yyyy");
		let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
		if (currentTournamentData[i].winningTeam == teamId) {
			status = "win";
		} else {
			status = "loss";
		}
		let tournamentDetail = {
			_id: currentTournamentData[i]._id,
			tournamentName: currentTournamentData[i].tournamentName,
			tournamentTitleImage: currentTournamentData[i].tournamentTitleImage,
			prize: currentTournamentData[i].prize,
			teamSize: currentTournamentData[i].teamSize,
			entryFee: currentTournamentData[i].entryFee,
			tournamentDate: tournamentDate,
			tournamentTime: tournamentTime,
			status: status,
		};
		let string = moment(startingDateAndTime).fromNow().toString();
		let match = "ago";
		let regex = new RegExp("\\b(" + match + ")\\b");
		let matchResult = string.match(regex) == null;
		if (matchResult == true) {
			tournamentArr.push(tournamentDetail);
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = tournamentArr;
	return res.status(response.code).json(response);
};
exports.teamPastTournament = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let teamId = request.teamId;
	let tournamentArr = [];
	let currentTournamentData = await TournamentHelper.teamTournamentsDetail(
		teamId
	);
	for (let i = 0; i < currentTournamentData.length; i++) {
		let status;
		let startingDateAndTime = currentTournamentData[i].startingDateAndTime;
		let tournamentDate = moment(startingDateAndTime).format("MMM DD yyyy");
		let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
		if (currentTournamentData[i].winningTeam == teamId) {
			status = "win";
		} else {
			status = "loss";
		}
		let tournamentDetail = {
			_id: currentTournamentData[i]._id,
			tournamentName: currentTournamentData[i].tournamentName,
			tournamentTitleImage: currentTournamentData[i].tournamentTitleImage,
			prize: currentTournamentData[i].prize,
			teamSize: currentTournamentData[i].teamSize,
			entryFee: currentTournamentData[i].entryFee,
			tournamentDate: tournamentDate,
			tournamentTime: tournamentTime,
			status: status,
		};
		let string = moment(startingDateAndTime).fromNow().toString();
		let match = "ago";
		let regex = new RegExp("\\b(" + match + ")\\b");
		let matchResult = string.match(regex) == null;
		if (matchResult == false) {
			tournamentArr.push(tournamentDetail);
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = tournamentArr;
	return res.status(response.code).json(response);
};
exports.tournaments = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let tournamentFinalArr = [];
	let tournamentList = await TournamentHelper.allTournamentListWithoutDeleted();
	if (req.query.platform) {
		let platform = req.query.platform.toLowerCase();
		if (platform != "all") {
			if (platform == "mobile") {
				for (let i = 0; i < tournamentList.length; i++) {
					let gameId = tournamentList[i].gameToPlay;
					let gameDetail = await GameHelper.findGameById(gameId);
					if (gameDetail != null) {
						let gamePlateformArr = gameDetail.platforms;
						let androidPlatformResult = gamePlateformArr.includes("android");
						let iosPlatformResult = gamePlateformArr.includes("ios");
						if (androidPlatformResult == true || iosPlatformResult == true) {
							let startingDateAndTime = tournamentList[i].startingDateAndTime;
							let tournamentDate =
								moment(startingDateAndTime).format("MMM DD yyyy");
							let tournamentTime =
								moment(startingDateAndTime).format("hh:mm A");
							let tournamentDetail = {
								_id: tournamentList[i]._id,
								tournamentName: tournamentList[i].tournamentName,
								tournamentTitleImage: tournamentList[i].tournamentTitleImage,
								prize: tournamentList[i].prize,
								teamSize: tournamentList[i].teamSize,
								entryFee: tournamentList[i].entryFee,
								totalTeams: tournamentList[i].totalTeams,
								registered: tournamentList[i].participatingTeams.length,
								tournamentDate: tournamentDate,
								tournamentTime: tournamentTime,
							};
							tournamentFinalArr.push(tournamentDetail);
						}
					}
				}
			}
			if (platform != "mobile") {
				for (let i = 0; i < tournamentList.length; i++) {
					let gameId = tournamentList[i].gameToPlay;
					let gameDetail = await GameHelper.findGameById(gameId);
					let gamePlateformArr = gameDetail.platforms;
					let platformResult = gamePlateformArr.includes(platform.toString());
					if (platformResult == true) {
						let startingDateAndTime = tournamentList[i].startingDateAndTime;
						let tournamentDate =
							moment(startingDateAndTime).format("MMM DD yyyy");
						let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
						let tournamentDetail = {
							_id: tournamentList[i]._id,
							tournamentName: tournamentList[i].tournamentName,
							tournamentTitleImage: tournamentList[i].tournamentTitleImage,
							prize: tournamentList[i].prize,
							teamSize: tournamentList[i].teamSize,
							entryFee: tournamentList[i].entryFee,
							totalTeams: tournamentList[i].totalTeams,
							registered: tournamentList[i].participatingTeams.length,
							tournamentDate: tournamentDate,
							tournamentTime: tournamentTime,
						};
						tournamentFinalArr.push(tournamentDetail);
					}
				}
			}
		}
		if (platform == "all") {
			for (let i = 0; i < tournamentList.length; i++) {
				let startingDateAndTime = tournamentList[i].startingDateAndTime;
				let tournamentDate = moment(startingDateAndTime).format("MMM DD yyyy");
				let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
				let tournamentDetail = {
					_id: tournamentList[i]._id,
					tournamentName: tournamentList[i].tournamentName,
					tournamentTitleImage: tournamentList[i].tournamentTitleImage,
					prize: tournamentList[i].prize,
					teamSize: tournamentList[i].teamSize,
					entryFee: tournamentList[i].entryFee,
					totalTeams: tournamentList[i].totalTeams,
					registered: tournamentList[i].participatingTeams.length,
					tournamentDate: tournamentDate,
					tournamentTime: tournamentTime,
				};
				tournamentFinalArr.push(tournamentDetail);
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournamentData = tournamentFinalArr;
		return res.status(response.code).json(response);
	}
};
exports.addTournamentResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	// console.log("request : ", request)

	let teamId;
	let gameName;
	let tournamentType;
	let tournamentName;
	let finalUserTeamsArr = [];
	let matchTeamsArr = [];
	let filePath;
	let mp4Video;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.VIDEO_IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		filePath = req.file.path;
		if (req.file.mimetype != "video/mp4") {
			mp4Video = false;
		} else {
			mp4Video = true;
		}
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
		if (mp4Video == false && jpgImage == false && pngImage == false) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.VIDEO_IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}

	if (!req.headers.authorization) {
		fs.unlinkSync(filePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(filePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if (!request.tournamentId || !request.score || !request.matchId) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let tournamentId = request.tournamentId;
		let score = request.score;
		let matchId = request.matchId;
		let checkTypeAndRoundNumberIsCorrect =
			await TournamentScheduleHelper.findTypeAndRoundNumber(matchId);
		if (checkTypeAndRoundNumberIsCorrect == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NO_RECORD_WITH_MATCH_ID
			);
			return res.status(response.code).json(response);
		} else {
			let userTeams = await TeamHelper.findUserTeamForTournament(userId);
			for (let i = 0; i < userTeams.length; i++) {
				finalUserTeamsArr.push(userTeams[i]._id.toString());
			}
			console.log("user team arr : ", finalUserTeamsArr);
			console.log("match id : ", matchId);
			let tournamentDetailByMatchId =
				await TournamentScheduleHelper.findTournamentScheduleByMatchId(matchId);
			console.log(
				"tournament match detail by match id : ",
				tournamentDetailByMatchId
			);
			matchTeamsArr.push(tournamentDetailByMatchId.teamOne.toString());
			matchTeamsArr.push(tournamentDetailByMatchId.teamTwo.toString());
			console.log("match team arr : ", matchTeamsArr);
			var userTeamIntersection = finalUserTeamsArr.filter(function (e) {
				return matchTeamsArr.indexOf(e) > -1;
			});
			let userTeamId = userTeamIntersection[0];
			if (userTeamIntersection.length == 0) {
				console.log("participating team detail not found");
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_PARTICIPATING
				);
				return res.status(response.code).json(response);
			} else {
				let userTeamDetail = await TeamHelper.findTeamByIdWithoutDelete(
					userTeamId
				);
				teamId = userTeamDetail._id;
			}
			let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
			let teamViewName = teamDetail.teamViewName;
			let tournamentDetail =
				await TournamentHelper.findTournamentByIdWithGamePopulate(tournamentId);

			if (tournamentDetail != null) {
				gameName = tournamentDetail.gameToPlay.gameName;
			}
			let roundNumber;
			let scheduleType;
			let tournamentRecordByMatchIdAndTournamentId =
				await TournamentScheduleHelper.findTournamentByMatchIdAndTournamentId(
					tournamentId,
					matchId
				);

			if (tournamentRecordByMatchIdAndTournamentId != null) {
				roundNumber = tournamentRecordByMatchIdAndTournamentId.roundNumber;
				scheduleType = tournamentRecordByMatchIdAndTournamentId.scheduleType;
			} else {
				console.log("tournament schedule detail not found by match Id");
			}
			console.log("user team id : ", teamId);
			let validateMatchId =
				await TournamentScheduleHelper.checkTournamentTeamAndMatchId(
					teamId,
					matchId
				);
			if (validateMatchId.length == 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MATCH_ID_NOT_VALID
				);
				return res.status(response.code).json(response);
			}

			let recordRoundNumber = checkTypeAndRoundNumberIsCorrect.roundNumber;
			//console.log(recordRoundNumber, roundNumber);
			let recordScheduleType = checkTypeAndRoundNumberIsCorrect.scheduleType;
			// console.log(recordScheduleType, scheduleType);
			let roundResult = roundNumber
				.toString()
				.match(recordRoundNumber.toString());
			let scheduleTypeResult = scheduleType
				.toString()
				.match(recordScheduleType.toString());
			if (roundResult == null || scheduleTypeResult == null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.SCHEDULE_TYPE_ROUND_NO_INCORRECT
				);
				return res.status(response.code).json(response);
			} else {
				tournamentType = tournamentDetail.tournamentType;
				tournamentName = tournamentDetail.tournamentName;
				// let tournamentStartDateAndTime = tournamentDetail.startingDateAndTime;
				// let nowDate = moment().utc().format("MMM DD YYYY");
				// let startDate = moment(tournamentStartDateAndTime).format(
				// 	"MMM DD YYYY"
				// );
				// let startDateCHeckResult = moment(startDate).isSameOrBefore(
				// 	nowDate,
				// 	"days"
				// );
				// if (!startDateCHeckResult) {
				// 	fs.unlinkSync(filePath);
				// 	response = ResponseHelper.setResponse(
				// 		ResponseCode.NOT_SUCCESS,
				// 		Message.CAN_NOT_SUBMIT_RESULT_BEFORE_START
				// 	);
				// 	return res.status(response.code).json(response);
				// } else {
				let tournamentResultData =
					await TournamentResultHelper.findSubmittedTournamentResult(
						tournamentId,
						teamId,
						matchId
					);
				if (tournamentResultData != null) {
					fs.unlinkSync(filePath);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_SUBMITTED
					);
					return res.status(response.code).json(response);
				}
				if (tournamentResultData == null) {
					let gameId = tournamentDetail.gameToPlay._id;
					// for (let i = 0; i < tournamentDetail.participatingTeams.length; i++) {
					// 	let teamId = tournamentDetail.participatingTeams[i].toString();
					// 	participatingTeamArr.push(teamId);
					// }
					// let teamCheck = participatingTeamArr.includes(teamId.toString());
					// if (teamCheck == false) {
					// 	fs.unlinkSync(filePath);
					// 	response = ResponseHelper.setResponse(
					// 		ResponseCode.NOT_SUCCESS,
					// 		Message.TEAM_NOT_PARTICIPATING
					// 	);
					// 	return res.status(response.code).json(response);
					// }
					// if (teamCheck == true) {
					let resultTournamentId = await TournamentResultHelper.submitResult(
						tournamentId,
						tournamentName,
						gameId,
						teamId,
						userId,
						score,
						tournamentType,
						roundNumber,
						scheduleType,
						matchId,
						teamViewName,
						gameName,
						filePath
					);

					let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
						request.tournamentId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentScheduleData = tournamentMatchScheduleDetail;
					return res.status(response.code).json(response);
				}
				//}
			}
		}
	}
};
exports.showTournamentsForResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let tournamentForResult;
	let category;
	let tournamentFinalArr = [];
	let request = req.query;
	let result;
	let killPointsArr = [];
	let teamMembersFinalArr = [];
	let pageNo;
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}

	let tournamentName = req.query.query;
	tournamentForResult =
		await TournamentResultHelper.adminTournamentResults(
			pageNo, tournamentName
		);

	for (let i = 0; i < tournamentForResult.data.length; i++) {
		// if (tournamentForResult.data[i].resultType == null) {
		//     category = ""
		// } else {
		//     category = "franchise"
		// }

		let teamId = tournamentForResult.data[i].teamId._id;

		let teamData = await TeamHelper.findTeamDeatilByTeamId(teamId);

		let playerResultArr = tournamentForResult.data[i].playerResults;

		if (playerResultArr.length > 0) {
			for (let k = 0; k < playerResultArr.length; k++) {
				let pointsData = {
					userId: playerResultArr[k].userId,
					killPoints: playerResultArr[k].killPoints,
				};
				killPointsArr.push(pointsData);
			}
		}

		if (teamData.teamMembers.length > 0) {
			for (let j = 0; j < teamData.teamMembers.length; j++) {
				let teamMemberId = teamData.teamMembers[j].userId;
				let teamMemberDetail = await UserHelper.foundUserById(teamMemberId);
				let teamMemberData = {
					_id: teamMemberDetail._id,
					userName: teamMemberDetail.userDetail.userName,
					profileImage: teamMemberDetail.profileImage,
				};
				teamMembersFinalArr.push(teamMemberData);
			}
		}

		let tournamentResultObj = {
			result: tournamentForResult.data[i].result,
			killPoints: tournamentForResult.data[i].killPoints,
			category: tournamentForResult.data[i].resultType,
			isDeleted: tournamentForResult.data[i].isDeleted,
			deletedAt: tournamentForResult.data[i].deletedAt,
			_id: tournamentForResult.data[i]._id,
			tournamentId: {
				_id: tournamentForResult.data[i].tournamentId._id,
				tournamentName: tournamentForResult.data[i].tournamentId.tournamentName,
			},
			tournamentName: tournamentForResult.data[i].tournamentName,
			teamId: {
				_id: tournamentForResult.data[i].teamId._id,
				teamViewName: tournamentForResult.data[i].teamId.teamViewName,
			},
			gameToPlay: {
				_id: tournamentForResult.data[i].gameToPlay._id,
				gameName: tournamentForResult.data[i].gameToPlay.gameName,
			},
			score: tournamentForResult.data[i].score,
			resultVideo: tournamentForResult.data[i].resultVideo,
			submittedBy: {
				_id: tournamentForResult.data[i].submittedBy._id,
				userDetail: {
					userName: tournamentForResult.data[i].submittedBy.userDetail.userName,
				},
			},

			submissionDate: tournamentForResult.data[i].submissionDate,
			createdAt: tournamentForResult.data[i].createdAt,
			updatedAt: tournamentForResult.data[i].updatedAt,
			teamMembers: teamMembersFinalArr,
			killPointsArr: killPointsArr,
		};
		tournamentFinalArr.push(tournamentResultObj);
		killPointsArr = []; //empty array
		teamMembersFinalArr = []; //empty array
	}
	let pagination = tournamentForResult.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = { ...pagination, data: tournamentFinalArr };
	return res.status(response.code).json(response);
};
exports.updateResultForTournament = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let killPoints = 0;
	let placePoints = parseInt(process.env.PLACE_POINT);
	let roundNumber;
	let scheduleType;
	let tournamentIdForResult;
	let matchId;
	let teamId;

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
		if ((!request.resultId, !request.resultStatus, !request.playerKillPoints)) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let resultId = request.resultId;
		let resultStatus = request.resultStatus.toLowerCase();
		let playerKillPoints = request.playerKillPoints;
		let tournamentResultDetail =
			await TournamentResultHelper.findTournamentResultByIdForResult(resultId);
		if (tournamentResultDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (tournamentResultDetail != null) {
			///
			matchId = tournamentResultDetail.matchId;
			teamId = tournamentResultDetail.teamId._id.toString();
			scheduleType = tournamentResultDetail.scheduleType;
			roundNumber = tournamentResultDetail.roundNumber;
			tournamentIdForResult = tournamentResultDetail.tournamentId;

			///

			if (resultStatus == "loss") {
				let checkAlreadyHaveResultStatus =
					await TournamentResultHelper.findAlreadyWinLossOfMatchId(
						matchId,
						resultStatus
					);
				if (checkAlreadyHaveResultStatus != null) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_HAVE_THIS_STATUS
					);
					return res.status(response.code).json(response);
				}
				if (checkAlreadyHaveResultStatus == null) {
					let checkAlreadyPlayerResults =
						await TournamentResultHelper.checkAlreadyPlayerResults(resultId);
					if (checkAlreadyPlayerResults.playerResults.length == 0) {
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await TournamentResultHelper.updateTournamentMatchResultPlayerPoints(
								resultId,
								playerId,
								userKillPoints
							);
							killPoints = (
								parseInt(killPoints) + parseInt(userKillPoints)
							).toFixed(0);

							await TournamentAndLeagueHelper.addUserPoints(
								playerId,
								userKillPoints
							);
							await TournamentResultHelper.addPlayerTournamentPoints(
								playerId,
								userKillPoints,
								tournamentIdForResult,
								scheduleType,
								roundNumber
							);
						}
					} else {
						///subtract points if loss
						let playerResults = tournamentResultDetail.playerResults;
						if (playerResults.length > 0) {
							for (let m = 0; m < playerResults.length; m++) {
								let playerId = playerResults[m].userId;
								let killPoints = playerResults[m].killPoints;
								let userData = await UserHelper.foundUserById(playerId);
								// let userPoints = userData.userPoints;
								// let userPts;
								// let userFinalPts;
								// let userFinalPoints = (
								// 	parseInt(userPoints) - parseInt(killPoints)
								// ).toFixed(0);
								await TournamentAndLeagueHelper.subtractUserPoints(
									playerId,
									killPoints
								);
							}
						}
						//empty arr player results
						await TournamentResultHelper.setPlayerResultArrEmpty(resultId);
						//add new player results
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await TournamentResultHelper.updateTournamentMatchResultPlayerPoints(
								resultId,
								playerId,
								userKillPoints
							);
							killPoints = (
								parseInt(killPoints) + parseInt(userKillPoints)
							).toFixed(0);
							await TournamentAndLeagueHelper.addUserPoints(
								playerId,
								userKillPoints
							);
							///delete points record
							await TournamentResultHelper.deletePlayerTournamentPoints(
								playerId,
								tournamentIdForResult,
								scheduleType,
								roundNumber
							);
							await TournamentResultHelper.addPlayerTournamentPoints(
								playerId,
								userKillPoints,
								tournamentIdForResult,
								scheduleType,
								roundNumber
							);
						}
					}
					await TournamentResultHelper.updateTournamentMatchResult(
						resultId,
						resultStatus,
						killPoints,
						placePoints
					);
				}
			}
			if (resultStatus == "win") {
				let checkAlreadyHaveResultStatus =
					await TournamentResultHelper.findAlreadyWinLossOfMatchId(
						matchId,
						resultStatus
					);
				if (checkAlreadyHaveResultStatus != null) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_HAVE_THIS_STATUS
					);
					return res.status(response.code).json(response);
				}
				if (checkAlreadyHaveResultStatus == null) {
					let checkAlreadyPlayerResults =
						await TournamentResultHelper.checkAlreadyPlayerResults(resultId);
					if (checkAlreadyPlayerResults.playerResults.length == 0) {
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await TournamentResultHelper.updateTournamentMatchResultPlayerPoints(
								resultId,
								playerId,
								userKillPoints
							);
							killPoints = (
								parseInt(killPoints) + parseInt(userKillPoints)
							).toFixed(0);
							console.log("killlllllllllllll : ", killPoints);
							await TournamentAndLeagueHelper.addUserPoints(
								playerId,
								userKillPoints
							);
							await TournamentResultHelper.addPlayerTournamentPoints(
								playerId,
								userKillPoints,
								tournamentIdForResult,
								scheduleType,
								roundNumber
							);
						}
					} else {
						///subtract points if loss
						let playerResults = tournamentResultDetail.playerResults;
						if (playerResults.length > 0) {
							for (let m = 0; m < playerResults.length; m++) {
								let playerId = playerResults[m].userId;
								let killPoints = playerResults[m].killPoints;
								let userData = await UserHelper.foundUserById(playerId);
								// let userPoints = userData.userPoints;
								// let userPts;
								// let userFinalPts;
								// let userFinalPoints = (
								// 	parseInt(userPoints) - parseInt(killPoints)
								// ).toFixed(0);
								await TournamentAndLeagueHelper.subtractUserPoints(
									playerId,
									killPoints
								);
								///delete points record
								await TournamentResultHelper.deletePlayerTournamentPoints(
									playerId,
									tournamentIdForResult,
									scheduleType,
									roundNumber
								);
							}
						}
						//empty arr player results
						await TournamentResultHelper.setPlayerResultArrEmpty(resultId);
						//add new player results
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await TournamentResultHelper.updateTournamentMatchResultPlayerPoints(
								resultId,
								playerId,
								userKillPoints
							);

							await TournamentAndLeagueHelper.addUserPoints(
								playerId,
								killPoints
							);
							await TournamentResultHelper.addPlayerTournamentPoints(
								playerId,
								userKillPoints,
								tournamentIdForResult,
								scheduleType,
								roundNumber
							);
						}
					}
					console.log("killl points : ", killPoints);
					await TournamentResultHelper.updateTournamentMatchResult(
						resultId,
						resultStatus,
						killPoints,
						placePoints
					);
					await TournamentScheduleHelper.updateWinnerTeamByMatchId(
						matchId,
						teamId
					);
				}
			}
			let tournamentId = tournamentResultDetail.tournamentId;
			let tournamentDetail =
				await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
					tournamentId
				);

			let gameName = tournamentDetail?.gameToPlay?.gameName;
			///
			let tournamentResultByResultId =
				await TournamentResultHelper.findTournamentResultByResultId(resultId);
			// console.log("tournament result data : ", tournamentResultByResultId);
			let submittedByObj;
			let submittedByDetail = await UserHelper.foundUserById(
				tournamentResultByResultId.submittedBy
			);

			submittedByObj = {
				_id: submittedByDetail?._id,
				userDetail: {
					userName: submittedByDetail?.userDetail?.userName,
				},
			};

			let teamViewName = await TournamentAndLeagueHelper.getTeamName(
				tournamentResultByResultId.teamId
			);
			let teamMembersFinalArr = [];
			let teamData = await TeamHelper.findTeamDeatilByTeamId(
				tournamentResultByResultId.teamId
			);

			if (teamData.teamMembers.length > 0) {
				for (let i = 0; i < teamData.teamMembers.length; i++) {
					let teamMemberId = teamData.teamMembers[i].userId;
					let teamMemberDetail = await UserHelper.foundUserById(teamMemberId);
					let teamMemberData = {
						_id: teamMemberDetail._id,
						userName: teamMemberDetail.userDetail.userName,
						profileImage: teamMemberDetail.profileImage,
					};
					teamMembersFinalArr.push(teamMemberData);
				}
			}
			// console.log("tournament result by id : ",tournamentResultByResultId);
			let tournamentResultObj = {
				result: tournamentResultByResultId.result,
				killPoints: parseInt(
					tournamentResultByResultId.killPoints +
					parseInt(tournamentResultByResultId.placePoints)
				),
				category: tournamentResultByResultId.resultType,
				isDeleted: tournamentResultByResultId.isDeleted,
				deletedAt: tournamentResultByResultId.deletedAt,
				_id: tournamentResultByResultId._id,
				tournamentId: {
					_id: tournamentResultByResultId.tournamentId,
					tournamentName: tournamentResultByResultId.tournamentName,
				},
				tournamentName: tournamentResultByResultId.tournamentName,
				teamId: {
					_id: tournamentResultByResultId.teamId,
					teamViewName: teamViewName,
				},
				gameToPlay: {
					_id: tournamentDetail.gameToPlay._id,
					gameName: gameName,
				},
				score: tournamentResultByResultId.score,
				resultVideo: tournamentResultByResultId.resultVideo,
				submittedBy: submittedByObj,
				submissionDate: tournamentResultByResultId.submissionDate,
				createdAt: tournamentResultByResultId.createdAt,
				updatedAt: tournamentResultByResultId.updatedAt,
				teamMembers: teamMembersFinalArr,
				killPointsArr: tournamentResultByResultId.playerResults,
				///
				scheduleType: tournamentResultByResultId.scheduleType,
				roundNumber: tournamentResultByResultId.roundNumber,
				gameName: gameName,
				matchId: tournamentResultByResultId.matchId,
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = tournamentResultObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteTournamentResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId;
	let notResultId = [];
	let deletedResultId = [];
	let pendingResultId = [];
	let resultIdArr = request.resultId;
	for (let i = 0; i < resultIdArr.length; i++) {
		resultId = resultIdArr[i];
		let tournamentResultDetailById =
			await TournamentResultHelper.findTournamentResultByIdForResult(resultId);
		if (tournamentResultDetailById == null) {
			notResultId.push(resultId);
		}
		if (tournamentResultDetailById != null) {
			if (tournamentResultDetailById.result == "pending") {
				pendingResultId.push(resultId);
			} else {
				let resultVideoPath = tournamentResultDetailById.resultVideo;
				fs.unlinkSync(resultVideoPath);
				await TournamentResultHelper.deleteTournamentResultById(resultId);
				deletedResultId.push(resultId);
			}
		}
	}
	if (notResultId.length != 0) {
		console.log("Records of these ID/s not found : ", notResultId);
	}
	if (pendingResultId.length > 0) {
		console.log("Pending result records : ", pendingResultId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.SOME_RESULT_NOT_DELETE
		);
		response.resultId = deletedResultId;
		return res.status(response.code).json(response);
	} else {
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.resultId = deletedResultId;
		return res.status(response.code).json(response);
	}
};
exports.myTournaments = async (req, res) => {
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
		let teamData = await TeamHelper.findMyTeams(userId);
		let tournamentArr = [];
		let tournamentObj;
		for (let i = 0; i < teamData.length; i++) {
			let teamId = teamData[i]._id;
			let tournamentData =
				await TournamentHelper.findMyExternalTournamentWithOutDelete(teamId);
			if (tournamentData.length > 0) {
				for (let j = 0; j < tournamentData.length; j++) {
					let tournamentDate = moment(
						tournamentData[j].startingDateAndTime
					).format("MMM DD yyyy");
					let tournamentTime = moment(
						tournamentData[j].startingDateAndTime
					).format("hh:mm A");
					tournamentObj = {
						tournamentTitleImage: tournamentData[j].tournamentTitleImage,
						totalTeams: tournamentData[j].totalTeams,
						_id: tournamentData[j]._id,
						tournamentName: tournamentData[j].tournamentName,
						teamSize: tournamentData[j].teamSize,
						entryFee: tournamentData[j].entryFee,
						prize: tournamentData[j].prize,
						tournamentDate: tournamentDate,
						tournamentTime: tournamentTime,
					};
					tournamentArr.push(tournamentObj);
				}
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournamentData = tournamentArr;
		return res.status(response.code).json(response);
	}
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////// Franchise Work ////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createFranchiseTournament = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
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
	if (
		!request.tournamentName ||
		!request.gameToPlay ||
		!request.teamSize ||
		!request.totalTeams ||
		!request.entryFee ||
		!request.prize ||
		!request.startingDateAndTime
	) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let startDate = await GeneralHelper.dateTimeToUtc(
		request.startingDateAndTime
	);
	let tournamentNameCheck =
		await TournamentHelper.findActiveFranchiseTournament(request);
	if (tournamentNameCheck != null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.ALREADY_EXIST
		);
		return res.status(response.code).json(response);
	}
	let newTournamentId = await TournamentHelper.createFranchiseTournament(
		request,
		imagePath,
		startDate
	);
	let tournament = await TournamentHelper.findTournamentByIdWithPopulate(
		newTournamentId
	);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournament = tournament;
	return res.status(response.code).json(response);
};
exports.addFranchiseTournamentResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentType;
	let tournamentName;

	let participatingTeamArr = [];
	let filePath;
	let mp4Video;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.VIDEO_IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		filePath = req.file.path;
		if (req.file.mimetype != "video/mp4") {
			mp4Video = false;
		} else {
			mp4Video = true;
		}
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
		if (mp4Video == false && jpgImage == false && pngImage == false) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.VIDEO_IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(filePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(filePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if ((!request.tournamentId, !request.score, !request.matchId)) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let tournamentId = request.tournamentId;
		let score = request.score;
		let matchId = request.matchId;
		let userFranchsieTeamDetail = await TeamHelper.findUserFranchiseTeam(
			userId
		);
		console.log("user franchise team detail : ", userFranchsieTeamDetail);
		if (userFranchsieTeamDetail == null) {
			console.log("participating team detail not found");
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_PARTICIPATING
			);
			return res.status(response.code).json(response);
		} else {
			teamId = userFranchsieTeamDetail._id;
		}
		let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
		let teamViewName = teamDetail.teamViewName;
		let tournamentDetail =
			await TournamentHelper.findTournamentByIdWithGamePopulate(tournamentId);

		if (tournamentDetail != null) {
			gameName = tournamentDetail.gameToPlay.gameName;
		}
		let roundNumber;
		let scheduleType;
		let tournamentRecordByMatchIdAndTournamentId =
			await TournamentScheduleHelper.findTournamentByMatchIdAndTournamentId(
				tournamentId,
				matchId
			);
		if (tournamentRecordByMatchIdAndTournamentId != null) {
			roundNumber = tournamentRecordByMatchIdAndTournamentId.roundNumber;
			scheduleType = tournamentRecordByMatchIdAndTournamentId.scheduleType;
		} else {
			console.log("tournament schedule detail not found by match Id");
		}
		console.log("user team id : ", teamId);
		let validateMatchId =
			await TournamentScheduleHelper.checkTournamentTeamAndMatchId(
				teamId,
				matchId
			);
		if (validateMatchId.length == 0) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MATCH_ID_NOT_VALID
			);
			return res.status(response.code).json(response);
		}
		let checkTypeAndRoundNumberIsCorrect =
			await TournamentScheduleHelper.findTypeAndRoundNumber(matchId);
		if (checkTypeAndRoundNumberIsCorrect == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NO_RECORD_WITH_MATCH_ID
			);
			return res.status(response.code).json(response);
		} else {
			let recordRoundNumber = checkTypeAndRoundNumberIsCorrect.roundNumber;
			//console.log(recordRoundNumber, roundNumber);
			let recordScheduleType = checkTypeAndRoundNumberIsCorrect.scheduleType;
			// console.log(recordScheduleType, scheduleType);
			let roundResult = roundNumber
				.toString()
				.match(recordRoundNumber.toString());
			let scheduleTypeResult = scheduleType
				.toString()
				.match(recordScheduleType.toString());
			if (roundResult == null || scheduleTypeResult == null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.SCHEDULE_TYPE_ROUND_NO_INCORRECT
				);
				return res.status(response.code).json(response);
			} else {
				tournamentType = tournamentDetail.tournamentType;
				tournamentName = tournamentDetail.tournamentName;

				let tournamentResultData =
					await TournamentResultHelper.findSubmittedTournamentResult(
						tournamentId,
						teamId,
						matchId
					);
				if (tournamentResultData != null) {
					fs.unlinkSync(filePath);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_SUBMITTED
					);
					return res.status(response.code).json(response);
				}

				if (tournamentResultData == null) {
					let gameId = tournamentDetail.gameToPlay._id;

					let resultTournamentId = await TournamentResultHelper.submitResult(
						tournamentId,
						tournamentName,
						gameId,
						teamId,
						userId,
						score,
						tournamentType,
						roundNumber,
						scheduleType,
						matchId,
						teamViewName,
						gameName,
						filePath
					);

					let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
						request.tournamentId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentScheduleData = tournamentMatchScheduleDetail;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.showFranchiseTournamentsForResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let tournamentForResult;
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
		let userFranchiseDetail = await FranchiseController.franchiseDetailData(
			userId
		);
		let franchiseId = userFranchiseDetail._id;
		let pageNo;
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!request.pageNo) {
			pageNo = 1;
		}
		if (!req.query.query) {
			tournamentForResult =
				await TournamentResultHelper.findFranchiseTournamentForResultWithPagination(
					franchiseId,
					pageNo
				);
		}
		if (req.query.query) {
			let tournamentName = req.query.query;
			tournamentForResult =
				await TournamentResultHelper.findFranchiseTournamentResultByTournamentNameWithPagination(
					franchiseId,
					tournamentName.toLowerCase(),
					pageNo
				);
		}
		let tournamentsData = await this.tournamentForResultData(
			tournamentForResult
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournamentsData = tournamentsData;
		return res.status(response.code).json(response);
	}
};
// for franchise owner
exports.updateResultForFranchiseTournament = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let updatedTournamentId;
	let tournamentResultId = request.resultId;
	let resultStatus = request.resultStatus.toLowerCase();
	let tournamentResultArr = [];
	let tournamentResultDetail =
		await TournamentResultHelper.findTournamentResultByIdForResult(
			tournamentResultId
		);
	if (tournamentResultDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.NOT_REQUESTED
		);
		return res.status(response.code).json(response);
	}
	if (tournamentResultDetail != null) {
		let teamId = tournamentResultDetail.teamId._id.toString();
		let tournamentId = tournamentResultDetail.tournamentId;
		let userId = tournamentResultDetail.submittedBy._id;
		let franchiseId = tournamentResultDetail.resultType;
		if (resultStatus == "loss") {
			let checkAlreadyTournamentWinningTeam =
				await TournamentHelper.findAlreadyWinningTeam(tournamentId, teamId);
			if (checkAlreadyTournamentWinningTeam != null) {
				await TournamentHelper.updateTournamentWinningTeam(
					tournamentId,
					teamId
				);
			}
			updatedTournamentId = await TournamentResultHelper.updateTournamentResult(
				tournamentResultId,
				resultStatus
			);
		}
		if (resultStatus == "win") {
			let findWinningResult =
				await TournamentResultHelper.findAlreadyWinTournamentResult(
					tournamentId
				);
			if (findWinningResult != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_WIN_TOURNAMENT_RESULT
				);
				return res.status(response.code).json(response);
			}
			if (findWinningResult == null) {
				updatedTournamentId =
					await TournamentResultHelper.updateTournamentResult(
						tournamentResultId,
						resultStatus
					);
				await TournamentHelper.updateTournamentTeamResult(tournamentId, teamId);
			}
		}
		// let pageNo
		// if (request.pageNo) {
		//     pageNo = request.pageNo
		// }
		// if (!request.pageNo) {
		//     pageNo = 1
		// }
		// let tournamentForResult = await TournamentResultHelper.findFranchiseTournamentForResultWithPagination(franchiseId, pageNo)
		// let tournamentsData = await this.tournamentForResultData(tournamentForResult)
		// response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
		// response.tournamentsData = tournamentsData
		// return res.status(response.code).json(response);
		//}
		//
		let tournamentResultData =
			await TournamentResultHelper.findTournamentResultByIdForResult(
				tournamentResultId
			);
		// console.log("tournament reesult : ", tournamentResultData)
		// let tournamentForResult = await TournamentResultHelper.findFranchiseTournamentForResult(franchiseId)
		// if (tournamentForResult.length > 0) {
		//     for (let i = 0; i < tournamentForResult.length; i++) {
		let tournamentResultObj = {
			result: tournamentResultData.result,
			_id: tournamentResultData._id,
			tournamentId: tournamentResultData.tournamentId._id,
			tournamentName: tournamentResultData.tournamentName,
			teamId: tournamentResultData.teamId._id,
			teamViewName: tournamentResultData.teamId.teamViewName,
			gameToPlay: tournamentResultData.gameToPlay._id,
			gameName: tournamentResultData.gameToPlay.gameName,
			score: tournamentResultData.score,
			resultVideo: tournamentResultData.resultVideo,
			submittedBy: tournamentResultData.submittedBy._id,
			submittedByUserName: tournamentResultData.submittedBy.userDetail.userName,
			submissionDate: tournamentResultData.submissionDate,
			createdAt: tournamentResultData.createdAt,
			updatedAt: tournamentResultData.updatedAt,
		};
		// tournamentResultArr.push(tournamentResultObj)
		// }
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournamentData = tournamentResultObj;
		return res.status(response.code).json(response);
		//  }
		//
	}
};
exports.franchiseTournaments = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let tournamentFinalArr = [];
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
		let tournamentList =
			await TournamentHelper.allFranchiseTournamentListWithoutDeleted();
		if (tournamentList.length > 0) {
			for (let i = 0; i < tournamentList.length; i++) {
				let tournamentDetailData = await this.tournamentDetailData(
					tournamentList[i]._id,
					userId
				);
				let tournamentJoined = tournamentDetailData.tournamentJoined;
				let startingDateAndTime = tournamentList[i].startingDateAndTime;
				let tournamentDate = moment(startingDateAndTime).format("MMM DD yyyy");
				let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
				let tournamentDetail = {
					_id: tournamentList[i]._id,
					tournamentName: tournamentList[i].tournamentName,
					tournamentTitleImage: tournamentList[i].tournamentTitleImage,
					prize: tournamentList[i].prize,
					teamSize: tournamentList[i].teamSize,
					entryFee: tournamentList[i].entryFee,
					totalTeams: tournamentList[i].totalTeams,
					registered: tournamentList[i].participatingTeams.length,
					tournamentDate: tournamentDate,
					tournamentTime: tournamentTime,
					tournamentJoined: tournamentJoined,
				};
				tournamentFinalArr.push(tournamentDetail);
			}
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = tournamentFinalArr;
	return res.status(response.code).json(response);
};
exports.deleteFranchiseTournament = async (req, res) => {
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
		if (!request) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ID_NOT_FOUND
			);
			return res.status(response.code).json(response);
		}
		if (request) {
			await TournamentHelper.deleteTournament(request);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentId = request.tournamentId;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteFranchiseTournamentResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId;
	let notResultId = [];
	let deletedResultId = [];
	let resultIdArr = request.resultId;
	for (let i = 0; i < resultIdArr.length; i++) {
		resultId = resultIdArr[i];
		let tournamentResultDetailById =
			await TournamentResultHelper.findTournamentResultByIdForResult(resultId);
		if (tournamentResultDetailById == null) {
			notResultId.push(resultId);
		}
		if (tournamentResultDetailById != null) {
			let resultVideoPath = tournamentResultDetailById.resultVideo;
			fs.unlinkSync(resultVideoPath);
			await TournamentResultHelper.deleteTournamentResultById(resultId);
			deletedResultId.push(resultId);
		}
	}
	if (notResultId.length != 0) {
		console.log("Records of these ID/s not found : " + notResultId);
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.resultId = deletedResultId;
	return res.status(response.code).json(response);
};
exports.findTournamentByGame = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let tournamentList;
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
		let tournamentData;
		if ("game" in req.query && request.game.length > 0) {
			let gameName = request.game.toLowerCase();
			let gameDetail = await GameHelper.findGameByNameWithoutDelete(gameName);
			if (gameDetail != null) {
				let gameId = gameDetail._id;
				tournamentList =
					await TournamentHelper.allTournamentListByGameNameIdWithoutDeleted(
						gameId
					);
				tournamentData = await this.tournamentListToObj(tournamentList);
			} else {
				tournamentData = [];
			}
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = tournamentData;
			return res.status(response.code).json(response);
		}
		if ("game" in req.query && request.game.length == 0) {
			tournamentData = [];
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = tournamentData;
			return res.status(response.code).json(response);
		}
		if (!request.game) {
			tournamentList = await TournamentHelper.allTournamentListWithoutDeleted();
			tournamentData = await this.tournamentListToObj(tournamentList);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tournamentData = tournamentData;
			return res.status(response.code).json(response);
		}
	}
};
///////**************************** *///////////////////////////
/*
 * @params: tounament id
 * @header: --
 * @res: tournament schedule
 * @body: --
 * @dev: for tournament schedule
 */
///////**************************** *///////////////////////////
exports.tournamentSchedule = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;

	let tournamentId = request.tournamentId;
	let totalRequiredTeams;
	let roundNumber = 1;
	let totalTeams;
	let scheduleType;
	let teamArr = [];
	let participatingTeamArr = [];
	let finalTeamArrWithAddKillPoints = [];
	let sortedTeamArrWithKillPoints = [];
	let previousRoundWinnerTeamsArr;
	let allKillPoints;
	let tournamentRound = 1;
	let pageNo;
	let tournamentDetail =
		await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
			tournamentId
		);
	totalTeams = tournamentDetail.participatingTeams.length;
	totalRequiredTeams = tournamentDetail.totalTeams;
	participatingTeamArr = tournamentDetail.participatingTeams;
	if (totalTeams < totalRequiredTeams) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.SLOTS_EMPTY
		);
		response.tournamentScheduleData = [];
		return res.status(response.code).json(response);
	} else {
		let tournamentStartingDate = tournamentDetail.startingDateAndTime;
		let startDate = moment(tournamentStartingDate).format(
			"DD.MM.YYYY HH.mm.ss"
		);
		let nowDate = moment().format("DD.MM.YYYY HH.mm.ss");

		console.log("tournament start date : ", startDate);
		console.log("tournament now date : ", nowDate);
		let startDateForCheck = moment(startDate, "DD.MM.YYYY HH.mm.ss");
		let nowDateForCheck = moment(nowDate, "DD.MM.YYYY HH.mm.ss");
		let dateCheckResult = moment(startDateForCheck).isSameOrBefore(
			nowDateForCheck,
			"minute"
		);
		// console.log("dateCheckResult : ", dateCheckResult);
		if (dateCheckResult == false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TOURNAMENT_START_DATE_TIME_WAIT
			);
			response.tournamentScheduleData = [];
			return res.status(response.code).json(response);
		} else {
			let alreadyScheduleCheck =
				await TournamentScheduleHelper.findTournamentScheduleByTournamentId(
					tournamentId
				);
			if (alreadyScheduleCheck.length == 0) {
				scheduleType = "round";
				let shuffledParticipatingTeamArr =
					TournamentAndLeagueHelper.shuffle(participatingTeamArr);
				await this.generateTournamentSchedule(
					totalTeams,
					shuffledParticipatingTeamArr,
					roundNumber,
					tournamentId,
					scheduleType
				);

				let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
					tournamentId
				);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.tournamentScheduleData = tournamentMatchScheduleDetail;
				response.message = Message.CHECK_NEW_SCHEDULE;
				return res.status(response.code).json(response);
			}

			///////////////////////////////////////////////////////
			if (alreadyScheduleCheck.length > 0) {
				let tournamentDetailForMaxRoundNumber =
					await TournamentScheduleHelper.getTournamentDetailForMaxRoundNumber(
						tournamentId
					);
				let maxRoundNumber = tournamentDetailForMaxRoundNumber[0].roundNumber;
				let checkAlreadyTournamentScheduleResult =
					await TournamentScheduleHelper.checkAlreadyTournamentScheduleResult(
						tournamentId
					);
				if (checkAlreadyTournamentScheduleResult.length == 0) {
					console.log("pending 4");
					let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
						tournamentId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentScheduleData = tournamentMatchScheduleDetail;
					response.message = Message.PENDING_LEAGUE_RESULTS;
					return res.status(response.code).json(response);
				}
				if (checkAlreadyTournamentScheduleResult.length > 0) {
					let checkAlreadyTournamentSchedulePendingResult =
						await TournamentResultHelper.checkAlreadyTournamentSchedulePendingResult(
							tournamentId,
							maxRoundNumber
						);

					if (checkAlreadyTournamentSchedulePendingResult.length > 0) {
						console.log("pending 3");
						let tournamentMatchScheduleDetail =
							await this.tournamentScheduleData(tournamentId);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.tournamentScheduleData = tournamentMatchScheduleDetail;
						response.message = Message.PENDING_LEAGUE_RESULTS;
						return res.status(response.code).json(response);
					}
				}
				let checkTournamentCompleteAndWinnerByRound =
					await TournamentScheduleHelper.checkAlreadyTournamentSchedule(
						tournamentId,
						maxRoundNumber
					);
				if (checkTournamentCompleteAndWinnerByRound.length > 0) {
					console.log("pending 2");

					let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
						tournamentId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentScheduleData = tournamentMatchScheduleDetail;
					response.message = Message.PENDING_LEAGUE_RESULTS;
					return res.status(response.code).json(response);
				}
				if (checkTournamentCompleteAndWinnerByRound.length == 0) {
					console.log("all done");

					previousRoundWinnerTeamsArr =
						await TournamentResultHelper.getPreviousRoundWinnerList(
							tournamentId,
							maxRoundNumber
						);

					// console.log(
					// 	"***********************previous winner teams : ",
					// 	previousRoundWinnerTeamsArr
					// );
					if (
						previousRoundWinnerTeamsArr.length == 32 ||
						previousRoundWinnerTeamsArr.length == 16 ||
						previousRoundWinnerTeamsArr.length == 8 ||
						previousRoundWinnerTeamsArr.length == 4 ||
						previousRoundWinnerTeamsArr.length == 2
					) {
						for (let l = 0; l < previousRoundWinnerTeamsArr.length; l++) {
							let teamArrForAddAllKillPoints =
								await TournamentResultHelper.getWinnerTeamsWithKillPoint(
									previousRoundWinnerTeamsArr[l].teamId,
									tournamentId,
									maxRoundNumber
								);
							for (let m = 0; m < teamArrForAddAllKillPoints.length; m++) {
								allKillPoints =
									parseInt(teamArrForAddAllKillPoints[m].killPoints) +
									parseInt(allKillPoints);
							}
							finalTeamArrWithAddKillPoints.push({
								teamId: previousRoundWinnerTeamsArr[l].teamId,
								killPoints: allKillPoints,
							});
							allKillPoints = 0;
						}

						sortedTeamArrWithKillPoints = finalTeamArrWithAddKillPoints.sort(
							function (a, b) {
								return b.killPoints - a.killPoints;
							}
						);
						console.log(
							"sorted final TeamArr with add kill points : ",
							sortedTeamArrWithKillPoints
						);
						for (let i = 0; i < sortedTeamArrWithKillPoints.length; i++) {
							teamArr.push(sortedTeamArrWithKillPoints[i].teamId);
						}

						if (previousRoundWinnerTeamsArr.length > 2) {
							scheduleType = "round";
						} else {
							scheduleType = "final";
						}
						let totalTeams = teamArr.length;
						let roundNumber = parseInt(maxRoundNumber) + 1;
						await this.generateTournamentSchedule(
							totalTeams,
							teamArr,
							roundNumber,
							tournamentId,
							scheduleType
						);
						let tournamentMatchScheduleDetail =
							await this.tournamentScheduleData(tournamentId);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.tournamentScheduleData = tournamentMatchScheduleDetail;
						response.message = Message.CHECK_NEW_SCHEDULE;
						return res.status(response.code).json(response);
					}

					if (previousRoundWinnerTeamsArr.length == 1) {
						let checkTournamentFinalExist =
							await TournamentScheduleHelper.checkTournamentFinalExist(
								tournamentId
							);

						let winnigTeamId = checkTournamentFinalExist.winner;

						let tournamentDetail =
							await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
								tournamentId
							);
						if (tournamentDetail.winningTeam == null) {
							await TournamentHelper.updateWinnerTeam(
								tournamentId,
								winnigTeamId
							);
							let tournamentPrize = tournamentDetail.prize;
							let winningTeamDetail =
								await TeamHelper.findTeamByIdWithoutDelete(winnigTeamId);

							let winningTeamMemberArr = winningTeamDetail.teamMembers;
							let teamTotalMembers = winningTeamMemberArr.length;
							let teamMembers;
							if (teamTotalMembers < 1) {
								teamMembers = 1;
							} else {
								teamMembers = teamTotalMembers;
							}
							let prizePerPlayer = tournamentPrize / teamMembers;

							for (let i = 0; i < winningTeamMemberArr.length; i++) {
								let playerId = winningTeamMemberArr[i].userId;

								await TournamentAndLeagueHelper.addUserPoints(
									playerId,
									prizePerPlayer
								);
							}
						}
						let winningTeamName = await TournamentAndLeagueHelper.getTeamName(
							winnigTeamId
						);
						console.log("no schedule required");
						let tournamentMatchScheduleDetail =
							await this.tournamentScheduleData(tournamentId);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.tournamentScheduleData = tournamentMatchScheduleDetail;
						response.message =
							"WooHoo Congratulation! " +
							winningTeamName +
							" has won this tournament.";
						return res.status(response.code).json(response);
					}
				} else {
					console.log("else pending");
					let tournamentMatchScheduleDetail = await this.tournamentScheduleData(
						tournamentId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentScheduleData = tournamentMatchScheduleDetail;
					response.message = Message.PENDING_LEAGUE_RESULTS;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};

//for home
exports.getAllTournamentForHome = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let allTournaments = await TournamentHelper.getAllTournamentForHome();
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.tournamentData = allTournaments;
	return res.status(response.code).json(response);
};
///////////////////////// Use with in tournament controller ///////////////////////////////////////////////
exports.tournamentDetailData = async (tournamentId, userId) => {
	let myTeamsArr = [];
	let teamDataArr = [];
	let tournamentJoined;
	let tournamentData;
	let hostedBy;
	let leaderName;
	let teamId;
	let userTeams = await TeamHelper.getUserAllTeams(userId);
	for (let i = 0; i < userTeams.length; i++) {
		let myTeamsId = userTeams[i]._id;
		myTeamsArr.push(myTeamsId.toString());
	}
	let participatingTeamsInTournamentArr = [];
	let userFranchiseModeAndDetail =
		await FranchiseController.getUserFranchiseModeAndFranchiseId(userId);

	let tournamentDetail =
		await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
			tournamentId
		);
	if (tournamentDetail != null) {
		// if (tournamentDetail.tournamentType != null) {
		//     let franchiseDetail = await FranchiseHelper.findFranchiseByIdWithDelete(tournamentDetail.tournamentType)
		//     hostedBy = franchiseDetail.createdByName
		// }
		// if (tournamentDetail.tournamentType == null) {
		//     hostedBy = ""
		// }
		for (let i = 0; i < tournamentDetail.participatingTeams.length; i++) {
			let teamId = tournamentDetail.participatingTeams[i]._id;
			participatingTeamsInTournamentArr.push(teamId.toString());
		}
		const intersection = participatingTeamsInTournamentArr.filter((element) =>
			myTeamsArr.includes(element)
		);
		if (intersection.length == 0) {
			console.log("not your team");
			tournamentJoined = false;
			teamId = "";
		}
		if (intersection.length > 0) {
			console.log("your team");
			let teamId = intersection[0];
			let participatingResult = myTeamsArr.includes(teamId);
			if (participatingResult == true) {
				tournamentJoined = true;
				teamId = teamId;
			}
			if (participatingResult == false) {
				tournamentJoined = false;
				teamId = "";
			}
		}
		let result =
			await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
				tournamentId
			);
		if (result != null) {
			for (let i = 0; i < result.participatingTeams.length; i++) {
				let leaderId = result.participatingTeams[i].teamLeader;
				let teamId = result.participatingTeams[i]._id;
				let leaderDetail = await UserHelper.foundUserById(leaderId);
				if (leaderDetail != null) {
					leaderId = leaderDetail._id;
					leaderName = leaderDetail.userDetail.userName;
				}
				if (leaderDetail == null) {
					leaderId = "";
					leaderName = "";
				}
				let teamWinLossDetail = await TeamController.teamWinLossDetail(teamId);
				let winsCount = teamWinLossDetail.wins;
				let lossCount = teamWinLossDetail.loss;
				let totalCount = winsCount + lossCount;
				if (totalCount == 0) {
					totalCount = 1;
				}
				let winPercentage = (winsCount / totalCount) * 100;
				let totalTeamMembers;
				if (result.participatingTeams[i].teamMembers.length > 0) {
					totalTeamMembers = result.participatingTeams[i].teamMembers.length;
				} else {
					totalTeamMembers = 0;
				}
				let teamDetail = {
					teamId: result.participatingTeams[i]._id,
					teamTitleImage: result.participatingTeams[i].teamTitleImage,
					teamViewName: result.participatingTeams[i].teamViewName,
					roosters: totalTeamMembers,
					teamMembers: result.participatingTeams[i].teamMembers,
					teamLeader: leaderName,
					teamLeaderId: leaderId,
					winsCount: winsCount,
					lossCount: lossCount,
					winPercentage: winPercentage.toFixed(0) + "%",
					participatingInTournaments:
						result.participatingTeams[i].participatingInTournaments.length,
				};
				teamDataArr.push(teamDetail);
			}
			tournamentData = {
				tournamentName: result.tournamentName,
				startingDateAndTime: result.startingDateAndTime,
				prize: result.prize,
				teamSize: result.teamSize,
				entryFee: result.entryFee,
				totalTeams: result.totalTeams,
				registered: result.participatingTeams.length,
				tournamentTitleImage: result.tournamentTitleImage,
				gameToPlay: result?.gameToPlay?.gameName,
				platforms: result?.gameToPlay?.platforms,
				tournamentJoined: tournamentJoined,
				teamId: teamId,
				winningTeam: result.winningTeam,
				franichsieModeAndId: userFranchiseModeAndDetail,
			};
		}
	} else {
		tournamentData = {};
		teamDataArr = [];
	}
	return { ...tournamentData, tournamentTeamRecord: [...teamDataArr] };
};
exports.tournamentForResultData = async (tournamentForResult) => {
	let tournamentResultArr = [];
	if (tournamentForResult.data.length > 0) {
		for (let i = 0; i < tournamentForResult.data.length; i++) {
			let tournamentResultObj = {
				result: tournamentForResult.data[i].result,
				_id: tournamentForResult.data[i]._id,
				tournamentId: tournamentForResult.data[i].tournamentId._id,
				tournamentName: tournamentForResult.data[i].tournamentName,
				teamId: tournamentForResult.data[i].teamId._id,
				teamViewName: tournamentForResult.data[i].teamId.teamViewName,
				gameToPlay: tournamentForResult.data[i].gameToPlay._id,
				gameName: tournamentForResult.data[i].gameToPlay.gameName,
				score: tournamentForResult.data[i].score,
				resultVideo: tournamentForResult.data[i].resultVideo,
				submittedBy: tournamentForResult.data[i].submittedBy._id,
				submittedByUserName:
					tournamentForResult.data[i].submittedBy.userDetail.userName,
				submissionDate: tournamentForResult.data[i].submissionDate,
				createdAt: tournamentForResult.data[i].createdAt,
				updatedAt: tournamentForResult.data[i].updatedAt,
			};
			tournamentResultArr.push(tournamentResultObj);
		}
	}
	let pagination = tournamentForResult.pagination;
	return { ...pagination, data: tournamentResultArr };
};
exports.tournamentListToObj = async (tournamentList) => {
	let tournamentArr = [];
	if (tournamentList.length > 0) {
		for (let i = 0; i < tournamentList.length; i++) {
			let startingDateAndTime = tournamentList[i].startingDateAndTime;
			let tournamentDate = moment(startingDateAndTime).format("MMM DD yyyy");
			let tournamentTime = moment(startingDateAndTime).format("hh:mm A");
			let tournamentDetail = {
				_id: tournamentList[i]._id,
				tournamentName: tournamentList[i].tournamentName,
				tournamentTitleImage: tournamentList[i].tournamentTitleImage,
				prize: tournamentList[i].prize,
				teamSize: tournamentList[i].teamSize,
				entryFee: tournamentList[i].entryFee,
				totalTeams: tournamentList[i].totalTeams,
				registered: tournamentList[i].participatingTeams.length,
				tournamentDate: tournamentDate,
				tournamentTime: tournamentTime,
			};
			tournamentArr.push(tournamentDetail);
		}
	}
	return tournamentArr;
};
// generate tournament schedule
exports.generateTournamentSchedule = async (
	totalTeams,
	participatingTeamArr,
	roundNumber,
	tournamentId,
	scheduleType
) => {
	let srNo;
	let teamOneArr = [];
	let teamTwoArr = [];
	let playOffRoundNumber = 0;
	if (roundNumber == 1) {
		console.log("round is 1");
		let centerOfTeamArray = Math.ceil(totalTeams / 2); //Math.ceil for round up
		let firstHalfOfTeamArray = participatingTeamArr.splice(
			0,
			centerOfTeamArray
		);
		let secondHalfOfTeamArray = participatingTeamArr.splice(-centerOfTeamArray);
		teamOneArr = TournamentAndLeagueHelper.shuffle(firstHalfOfTeamArray);
		teamTwoArr = TournamentAndLeagueHelper.shuffle(secondHalfOfTeamArray);
	}
	if (roundNumber > 1) {
		console.log("round greater than 1...");
		for (let j = 0; j < participatingTeamArr.length; j++) {
			teamOneArr.push(participatingTeamArr[j]);
			j = j + 1;
		}
		for (let k = 1; k < participatingTeamArr.length; k++) {
			teamTwoArr.push(participatingTeamArr[k]);
			k = k + 1;
		}
	}

	for (let i = 0; i < teamOneArr.length; i++) {
		let randomNumber = await TournamentAndLeagueHelper.getRandomNmmber();
		let roundId = await TournamentAndLeagueHelper.getRandomRoundId();
		let nowDate = moment().format("MMDDhhmmss");
		let id = "" + nowDate + roundId;
		srNo = i + 1;
		///previous - update match next id
		let previousRoundNumber;
		if (roundNumber > 1) {
			previousRoundNumber = parseInt(roundNumber) - 1;

			await TournamentScheduleHelper.updateNextMatchId(
				tournamentId,
				teamOneArr[i],
				previousRoundNumber,
				id
			);
			await TournamentScheduleHelper.updateNextMatchId(
				tournamentId,
				teamTwoArr[i],
				previousRoundNumber,
				id
			);
		}

		await TournamentScheduleHelper.saveTournamentSchedule(
			roundNumber,
			srNo,
			id,
			scheduleType,
			randomNumber,
			tournamentId,
			teamOneArr[i],
			teamTwoArr[i],
			playOffRoundNumber
		);
	}
};
///get tournament schedule data
exports.tournamentScheduleData = async (tournamentId) => {
	let winnerTeamName;
	let tournamentMatchArr = [];
	let roundCountArr = [];
	let finalTournamentMatchArr = [];
	let totalTeams;
	let finalNextMatchId;
	let scheduleType;

	let m = 1; //for increament check (insert nextMatchId in two objects)
	let nextMatchValueForDummy = 1;

	let tournamentDetail =
		await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(
			tournamentId
		);

	if (tournamentDetail != null) {
		totalTeams = tournamentDetail.totalTeams;
	} else {
		totalTeams = 0;
	}

	let tournamentMatches =
		await TournamentScheduleHelper.checkTournamentSchedule(tournamentId);

	// console.log("tournament matches count : ", tournamentMatches.length);
	let matchCount = tournamentMatches.length;
	for (let a = 0; a < tournamentMatches.length; a++) {
		roundCountArr.push(tournamentMatches[a].roundNumber);
	}
	let maxRoundCount = Math.max(...roundCountArr);
	for (let k = 0; k < maxRoundCount; k++) {
		for (let l = 0; l < tournamentMatches.length; l++) {
			if (tournamentMatches[l].roundNumber == k + 1) {
				let teamOneName = await TournamentAndLeagueHelper.getTeamName(
					tournamentMatches[l].teamOne
				);
				let teamTwoName = await TournamentAndLeagueHelper.getTeamName(
					tournamentMatches[l].teamTwo
				);
				let teamOneProfileImage =
					await TournamentAndLeagueHelper.getTeamProfileImage(
						tournamentMatches[l].teamOne
					);
				let teamTwoProfileImage =
					await TournamentAndLeagueHelper.getTeamProfileImage(
						tournamentMatches[l].teamTwo
					);
				let winnerTeamId = tournamentMatches[l].winner;
				let matchId = tournamentMatches[l].randomMatchId;
				///
				let tournamentResutlDetailByMatchId =
					await TournamentResultHelper.findPendingResultByMatchId(matchId);
				let tournamentTotalResultByMatchId =
					await TournamentResultHelper.findTotalResultByMatchId(matchId);
				let totalSubmittedResult = tournamentTotalResultByMatchId.length;
				if (
					tournamentResutlDetailByMatchId.length == 0 &&
					totalSubmittedResult == 2
				) {
					winnerTeamName = await TournamentAndLeagueHelper.getTeamName(
						winnerTeamId
					);
				} else {
					winnerTeamName = "";
				}
				let roundNumber = k + 1;
				scheduleType = tournamentMatches[l].scheduleType;
				let name = "Match_Id : " + matchId;

				let resultTextOne;
				let resultTextTwo;
				let isWinnerOne;
				let isWinnerTwo;
				if (tournamentMatches[l].winner != null) {
					if (
						tournamentMatches[l].winner.toString() ==
						tournamentMatches[l].teamOne.toString()
					) {
						resultTextOne = "win";
						resultTextTwo = "loss";
						isWinnerOne = true;
						isWinnerTwo = false;
					} else if (
						tournamentMatches[l].winner.toString() ==
						tournamentMatches[l].teamTwo.toString()
					) {
						resultTextOne = "loss";
						resultTextTwo = "win";
						isWinnerOne = false;
						isWinnerTwo = true;
					} else {
						resultTextOne = null;
						resultTextTwo = null;
						isWinnerOne = false;
						isWinnerTwo = false;
					}
				} else {
					resultTextOne = null;
					resultTextTwo = null;
					isWinnerOne = false;
					isWinnerTwo = false;
				}

				if (tournamentMatches[l].nextMatchId == 0) {
					if (m == 2) {
						finalNextMatchId = nextMatchValueForDummy++;
					} else {
						finalNextMatchId = nextMatchValueForDummy;
					}
				} else {
					finalNextMatchId = tournamentMatches[l].nextMatchId;
				}
				if (m == 2) {
					m = 1;
				} else {
					m++;
				}
				if (tournamentMatches[l].scheduleType == "final") {
					finalNextMatchId = 0;
				} else {
					finalNextMatchId = finalNextMatchId;
				}
				let leagueMatchObj;

				leagueMatchObj = {
					_id: tournamentMatches[l]._id,
					id: tournamentMatches[l].id,
					match: tournamentMatches[l].rowNumber,
					name: name,
					matchId: tournamentMatches[l].randomMatchId,
					scheduleType: tournamentMatches[l].scheduleType,
					winner: winnerTeamName,
					nextMatchId: finalNextMatchId,
					nextLooserMatchId: tournamentMatches[l].nextLooserMatchId,
					tournamentRoundText: roundNumber,
					participants: [
						{
							id: tournamentMatches[l]?.teamOne,
							name: teamOneName,
							resultText: resultTextOne,
							isWinner: isWinnerOne,
							status: null,
							picture: teamOneProfileImage,
						},
						{
							id: tournamentMatches[l]?.teamTwo,
							name: teamTwoName,
							resultText: resultTextTwo,
							isWinner: isWinnerTwo,
							status: null,
							picture: teamTwoProfileImage,
						},
					],
				};
				tournamentMatchArr.push(leagueMatchObj);
			}
		}
	}
	// console.log("total teams : ", totalTeams);
	if (totalTeams == 32) {
		console.log("32 teams");
		if (matchCount == 16) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForSisteenTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 24) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForEightTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 28) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 30) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 31) {
			// if (scheduleType != "final") {
			// 	let dummyTeamArr =
			// 		await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			// 	finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
			// } else {
			finalTournamentMatchArr = tournamentMatchArr;
			// }
		} else {
			finalTournamentMatchArr = tournamentMatchArr;
		}
	} else if (totalTeams == 16) {
		console.log("16 teams");
		if (matchCount == 8) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForEightTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 12) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 14) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 15) {
			// if (scheduleType != "final") {
			// 	let dummyTeamArr =
			// 		await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			// 	finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
			// } else {
			finalTournamentMatchArr = tournamentMatchArr;
			// }
		} else {
			finalTournamentMatchArr = tournamentMatchArr;
		}
	} else if (totalTeams == 8) {
		console.log("8 teams");
		if (matchCount == 4) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 6) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 7) {
			// if (scheduleType != "final") {
			// 	let dummyTeamArr =
			// 		await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			// 	finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
			// } else {
			finalTournamentMatchArr = tournamentMatchArr;
			// }
		} else {
			finalTournamentMatchArr = tournamentMatchArr;
		}
	} else if (totalTeams == 4) {
		console.log("4 teams");

		if (matchCount == 2) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 3) {
			// if (scheduleType != "final") {
			// 	let dummyTeamArr =
			// 		await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			// 	finalTournamentMatchArr = tournamentMatchArr.concat(dummyTeamArr);
			// } else {
			finalTournamentMatchArr = tournamentMatchArr;
			// }
		} else {
			finalTournamentMatchArr = tournamentMatchArr;
		}
	}
	return finalTournamentMatchArr;
};
//////////// for developers

exports.softDeleteTournaments = async (req, res) => {
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
		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentHelper.softDeleteTournament();
			deleted = "delete";
		} else {
			deleted = "not delete";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.deleted = deleted;
		return res.status(response.code).json(response);
	}
};
exports.softDeleteTournamentResults = async (req, res) => {
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
		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentResultHelper.softDeleteTournamentResults();
			deleted = "delete";
		} else {
			deleted = "not delete";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.deleted = deleted;
		return res.status(response.code).json(response);
	}
};

exports.changeTounamentDeleteStatusByTournamentId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentId = request.tournamentId;
	let deleteStatus = request.deleteStatus;
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
		let updated;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentHelper.updateTournamentDeleteStatus(
				tournamentId,
				deleteStatus
			);
			updated = "updated";
		} else {
			updated = "not updated";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.updated = updated;
		return res.status(response.code).json(response);
	}
};
exports.changeTounamentResultDeleteStatusByTournamentId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentId = request.tournamentId;
	let deleteStatus = request.deleteStatus;
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
		let updated;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentResultHelper.updateTournamentResultDeleteStatus(
				tournamentId,
				deleteStatus
			);
			updated = "updated";
		} else {
			updated = "not updated";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.updated = updated;
		return res.status(response.code).json(response);
	}
};
exports.softDeleteTournamentScheduleByTornamentId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentId = request.tournamentId;
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
		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentScheduleHelper.softDeleteTournamentScheduleByTornamentId(
				tournamentId
			);

			deleted = "delete";
		} else {
			deleted = "not delete";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.deleted = deleted;
		return res.status(response.code).json(response);
	}
};

exports.showAllTournamentsWithDeleted = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentId = request.tournamentId;
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
		let tournament;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			let allTournaments =
				await TournamentHelper.showAllTournamentsWithDeleted();

			tournament = allTournaments;
		} else {
			tournament = "not results";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tournament = tournament;
		return res.status(response.code).json(response);
	}
};

exports.deleteTournamentScheduleByTornamentId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let tournamentId = request.tournamentId;
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
		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentScheduleHelper.deleteTournamentScheduleByTornamentId(
				tournamentId
			);

			deleted = "delete";
		} else {
			deleted = "not delete";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.deleted = deleted;
		return res.status(response.code).json(response);
	}
};
exports.showAllTournamentSchedule = async (req, res) => {
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
		let allSchedule;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			let allScheduleDetail =
				await TournamentScheduleHelper.allTournamentSchedule();

			allSchedule = allScheduleDetail;
		} else {
			allSchedule = "no schedule";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.allSchedule = allSchedule;
		return res.status(response.code).json(response);
	}
};
