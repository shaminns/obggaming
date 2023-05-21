const moment = require("moment");
const fs = require("fs");
//Controller
const TeamController = require("../Controllers/TeamController");
//Helpers
const LadderHelper = require("../Services/LadderHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const TeamHelper = require("../Services/TeamHelper");
const UserHelper = require("../Services/UserHelper");
const GameHelper = require("../Services/GameHelper");
const LadderResultHelper = require("../Services/LadderResultHelper");
const TotalWarLadderHelper = require("../Services/TotalWarLadderHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const GeneralHelper = require("../Services/GeneralHelper");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
const tokenExtractor = require("../Middleware/TokenExtracter");
const Ladder = require("../Models/Ladder");
exports.createLadder = async (req, res) => {
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
		console.log("image path add ladder : ", req.file.path);
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
		!request.ladderName ||
		!request.gameToPlay ||
		!request.entryFee ||
		!request.prize ||
		!request.teamSize ||
		!request.totalTeams ||
		!request.startingDateAndTime ||
		!request.endingDateAndTime ||
		!request.ladderType
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
	let endDateAndTime = await GeneralHelper.dateTimeToUtc(
		request.endingDateAndTime
	);
	let ladderName = request.ladderName.toLowerCase().trim();
	let ladderNameCheck = await LadderHelper.findLadderByName(ladderName);
	if (ladderNameCheck != null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.ALREADY_EXIST
		);
		return res.status(response.code).json(response);
	}
	if (request.totalTeams < 8) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.TOTAL_TEAMS_NOT_LESS_THAN_8
		);
		return res.status(response.code).json(response);
	}

	if (ladderNameCheck == null) {
		let savedLadderId = await LadderHelper.createLadder(
			request,
			imagePath,
			startDateAndTime,
			endDateAndTime
		);
		let ladder = await LadderHelper.findLadderByIdWithoutPopulateGame(
			savedLadderId
		);
		console.log("ladder : ", ladder);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL,
			ladder
		);
		return res.status(response.code).json(response);
	}
};
exports.listLadder = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let ladderDataArr = [];
	let result;
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}

	result = await LadderHelper.laddersByNameWithPagination(
		pageNo, req.query.query
	);
	if (result.data.length > 0) {
		for (let i = 0; i < result.data.length; i++) {
			let gameDetail = await GameHelper.findGameByIdWithDelete(
				result.data[i].gameToPlay
			);
			if (gameDetail != null) {
				let gameName = gameDetail.gameName;

				let ladderObj = {
					ladderTitleImage: result.data[i].ladderTitleImage,
					totalTeams: result.data[i].totalTeams,
					isDeleted: result.data[i].isDeleted,
					deletedAt: result.data[i].deletedAt,
					_id: result.data[i]._id,
					ladderName: result.data[i].ladderName,
					game: gameName,
					entryFee: result.data[i].entryFee,
					prize: result.data[i].prize,
					teamSize: result.data[i].teamSize,
					ladderType: result.data[i].ladderType,
					startingDateAndTime: result.data[i].startingDateAndTime,
					endingDateAndTime: result.data[i].endingDateAndTime,
					participatingTeams: result.data[i].participateInTeam,
					createdAt: result.data[i].createdAt,
					updatedAt: result.data[i].updatedAt,
				};
				ladderDataArr.push(ladderObj);
			}
		}
	}
	let pagination = result.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ladderData = { ...pagination, data: ladderDataArr };
	return res.status(response.code).json(response);
};
exports.updateLadder = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let imagePath;
	let jpgImage;
	let pngImage;
	let ladderDetail = await LadderHelper.findLadderById(request._id);
	if (ladderDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.LADDER_DOES_NOT_EXIST
		);
		return res.status(response.code).json(response);
	} else {
		let participatingTeams = ladderDetail.participatingTeams;
		if (!req.file) {
			imagePath = ladderDetail.ladderTitleImage;
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
		if (!request._id) {
			if (req.file) {
				ImagePath = req.file.path;
				fs.unlinkSync(imagePath);
			}
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let ladder = await LadderHelper.findLadder(request._id);
		if (ladder == null) {
			if (req.file) {
				imagePath = req.file.path;
				fs.unlinkSync(imagePath);
			}
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LADDER_DOES_NOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (req.file) {
			await LadderHelper.updateLadderImage(request._id, imagePath);
			let ladderData = await LadderHelper.findLadderByIdWithoutPopulate(
				request._id
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.IMAGE_UPDATED
			);
			response.ladderData = ladderData;
			return res.status(response.code).json(response);
		} else {
			if (participatingTeams.length > 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.CAN_NOT_UPDATE
				);
				return res.status(response.code).json(response);
			} else {
				await LadderHelper.updateLadder(ladder, request, imagePath);
			}
			let ladderData = await LadderHelper.findLadderByIdWithoutPopulate(
				request._id
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.ladderData = ladderData;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteLadder = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let deletedId = [];
	let notDeletedIds = [];
	let ladderTeamArr = [];
	for (let i = 0; i < request.ids.length; i++) {
		let ladderId = request.ids[i];
		let ladderDetail = await LadderHelper.findLadderById(ladderId);
		if (ladderId == null) {
			notDeletedIds.push(ladderId);
		} else {
			let participatingTeams = ladderDetail.participatingTeams;
			if (participatingTeams.length > 0) {
				let checkResultExist = await LadderResultHelper.findLadderResultExist(
					ladderId
				);
				if (checkResultExist.length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.CAN_NOT_DELETE_RESULT_WAITING
					);
					return res.status(response.code).json(response);
				} else {
					let checkPendingTournamentResults =
						await LadderResultHelper.findPendingResultByLadderId(ladderId);
					if (checkPendingTournamentResults.length > 0) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.CAN_NOT_DELETE_PENDING_RESULT
						);
						return res.status(response.code).json(response);
					} else {
						if (checkResultExist.length < participatingTeams.length) {
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.CAN_NOT_DELETE_SOME_PENDING_RESULT
							);
							return res.status(response.code).json(response);
						} else {
							for (let j = 0; j < checkResultExist.length; j++) {
								let teamId = checkResultExist[j].teamId;
								ladderTeamArr.push(teamId.toString());
							}
							let filterTeamArr = [...new Set(ladderTeamArr)];
							console.log("filter team arr : ", filterTeamArr);
							if (filterTeamArr.length != participatingTeams.length) {
								response = ResponseHelper.setResponse(
									ResponseCode.NOT_SUCCESS,
									Message.CAN_NOT_DELETE_TEAM_PENDING_RESULT
								);
								return res.status(response.code).json(response);
							} else {
								await LadderHelper.deleteLadder(ladderId);
								deletedId.push(ladderId);
							}
						}
					}
				}
			} else {
				let ladderImg = ladderDetail.ladderTitleImage;
				fs.unlinkSync(ladderImg);
				await LadderHelper.deleteLadderPermanent(ladderId);
				deletedId.push(ladderId);
			}
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ladderId = deletedId;
	return res.status(response.code).json(response);
};
exports.joinLadder = async (req, res) => {
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
		if (!request.ladderId || !request.teamId) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let teamData = await TeamHelper.findTeamById(request);
		if (teamData == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_DOESNOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		let participateInTeam = await TeamHelper.findParticipateInTeam(
			request.teamId,
			userId
		);
		if (participateInTeam == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_TEAM_MEMBER
			);
			return res.status(response.code).json(response);
		}
		let ladderDetail = await LadderHelper.findLadderById(request.ladderId);
		if (ladderDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LADDER_DOESNOT_EXIST
			);
			return res.status(response.code).json(response);
		} else {
			let ladderStartDate = ladderDetail.startingDateAndTime;
			let startDate = moment(ladderStartDate).format("MMM DD YYYY");
			// console.log("startDate : ", startDate)
			let nowDate = moment().format("MMM DD YYYY");
			// console.log("now date : ", nowDate)
			let dateCheckResult = moment(startDate).isBefore(nowDate, "day");
			// console.log("date check ladder join : ", dateCheckResult)
			if (dateCheckResult) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.CAN_NOT_JOIN_AFTER_DATE
				);
				return res.status(response.code).json(response);
			} else {
				let teamMemberCountCheck = teamData.teamMembers.length;
				let participatingTeamMemberRequired = ladderDetail.teamSize;
				let participatingTeamsCount = ladderDetail.participatingTeams.length;
				let participatingTeamsRequired = ladderDetail.totalTeams;
				let ladderEntryFee = ladderDetail.entryFee;
				let userData = await UserHelper.foundUserById(userId);
				let userCredit = userData.userDetail.credits;
				let startingDateAndTime = ladderDetail.startingDateAndTime;
				let updatedUserCredit;
				if (participatingTeamMemberRequired != teamMemberCountCheck) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TEAM_SIZE_NOT_MATCH
					);
					return res.status(response.code).json(response);
				}
				if (participatingTeamsCount == participatingTeamsRequired) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TEAM_SIZE_EXCEED
					);
					return res.status(response.code).json(response);
				}
				let ladderArr = [];
				let teamMemberArr = [];
				let participatingMemberArr = ladderDetail.participatingTeams;
				for (let i = 0; i < participatingMemberArr.length; i++) {
					let teamId = participatingMemberArr[i].teamId._id;
					let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
					let teamMemberId = teamDetail.teamMembers[0].userId;
					teamMemberArr.push(teamMemberId.toString());
					for (let k = 0; k < teamDetail.teamMembers.length; k++) {
						let teamMemberCheck = teamMemberArr.includes(
							teamData.teamMembers[k].userId.toString()
						);
						if (teamMemberCheck == true) {
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.MEMBER_ALREADY_PARTICIPATED
							);
							return res.status(response.code).json(response);
						}
						ladderArr.push(teamId.toString());
					}
					let teamMemberCheck = teamMemberArr.includes(userId.toString());
					if (teamMemberCheck == true) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.MEMBER_ALREADY_PARTICIPATED
						);
						return res.status(response.code).json(response);
					}
					ladderArr.push(teamId.toString());
				}
				if (ladderArr.includes(request.teamId.toString())) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TEAM_ALREADY_PARTICIPATING
					);
					return res.status(response.code).json(response);
				}
				// let string = (moment(startingDateAndTime).fromNow()).toString();
				// let match = "ago";
				// let regex = new RegExp('\\b(' + match + ')\\b');
				// let matchResult = (string.match(regex) == null)
				// if (matchResult == false) {
				//     response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.DATE_PASSED)
				//     return res.status(response.code).json(response);
				// }
				if (userCredit < ladderEntryFee) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.NOT_ENOUGH_CREDIT
					);
					return res.status(response.code).json(response);
				}
				let ladderTeamResult = {
					winCount: 0,
					lossCount: 0,
					streakRecord: [],
				};
				await LadderHelper.addTeam(
					request.ladderId,
					request.teamId,
					ladderTeamResult
				);
				updatedUserCredit = userCredit - ladderEntryFee;
				await UserHelper.updateCredit(userId, updatedUserCredit);
				let ladderId = request.ladderId;
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.ladderData = await this.ladderDetailData(ladderId, userId);
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.ladders = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let ladderFinalArr = [];
	let gamePlateformArr = [];
	let laddersList = await LadderHelper.allLaddersListWithoutDeleted();
	if (req.query.platform) {
		let platform = req.query.platform.toLowerCase();
		if (platform != "all") {
			if (platform == "mobile") {
				for (let i = 0; i < laddersList.length; i++) {
					let gameId = laddersList[i].gameToPlay;
					let gameDetail = await GameHelper.findGameById(gameId);
					gamePlateformArr = gameDetail.platforms;
					let androidPlatformResult = gamePlateformArr.includes("android");
					let iosPlatformResult = gamePlateformArr.includes("ios");
					if (androidPlatformResult == true || iosPlatformResult == true) {
						let startingDateAndTime = laddersList[i].startingDateAndTime;
						let ladderStartDate =
							moment(startingDateAndTime).format("MMM DD yyyy");
						let ladderStartTime = moment(startingDateAndTime).format("hh:mm A");
						let endingDateANdTime = laddersList[i].endingDateAndTime;
						let ladderEndDate = moment(endingDateANdTime).format("MMM DD yyyy");
						let ladderEndTime = moment(endingDateANdTime).format("hh:mm A");
						let tournamentDetail = {
							_id: laddersList[i]._id,
							ladderName: laddersList[i].ladderName,
							ladderTitleImage: laddersList[i].ladderTitleImage,
							prize: laddersList[i].prize,
							teamSize: laddersList[i].teamSize,
							entryFee: laddersList[i].entryFee,
							totalTeams: laddersList[i].totalTeams,
							registered: laddersList[i].participatingTeams.length,
							ladderStartDate: ladderStartDate,
							ladderStartTime: ladderStartTime,
							ladderEndDate: ladderEndDate,
							ladderEndTime: ladderEndTime,
						};
						ladderFinalArr.push(tournamentDetail);
					}
				}
			}
			if (platform != "mobile") {
				for (let i = 0; i < laddersList.length; i++) {
					let gameId = laddersList[i].gameToPlay;
					let gameDetail = await GameHelper.findGameById(gameId);
					let gamePlateformArr = gameDetail.platforms;
					let platformResult = gamePlateformArr.includes(platform.toString());
					if (platformResult == true) {
						let startingDateAndTime = laddersList[i].startingDateAndTime;
						let ladderStartDate =
							moment(startingDateAndTime).format("MMM DD yyyy");
						let ladderStartTime = moment(startingDateAndTime).format("hh:mm A");
						let endingDateANdTime = laddersList[i].endingDateAndTime;
						let ladderEndDate = moment(endingDateANdTime).format("MMM DD yyyy");
						let ladderEndTime = moment(endingDateANdTime).format("hh:mm A");
						let tournamentDetail = {
							_id: laddersList[i]._id,
							ladderName: laddersList[i].ladderName,
							ladderTitleImage: laddersList[i].ladderTitleImage,
							prize: laddersList[i].prize,
							teamSize: laddersList[i].teamSize,
							entryFee: laddersList[i].entryFee,
							totalTeams: laddersList[i].totalTeams,
							registered: laddersList[i].participatingTeams.length,
							ladderStartDate: ladderStartDate,
							ladderStartTime: ladderStartTime,
							ladderEndDate: ladderEndDate,
							ladderEndTime: ladderEndTime,
						};
						ladderFinalArr.push(tournamentDetail);
					}
				}
			}
		}
		if (platform == "all") {
			for (let i = 0; i < laddersList.length; i++) {
				let startingDateAndTime = laddersList[i].startingDateAndTime;
				let ladderStartDate = moment(startingDateAndTime).format("MMM DD yyyy");
				let ladderStartTime = moment(startingDateAndTime).format("hh:mm A");
				let endingDateANdTime = laddersList[i].endingDateAndTime;
				let ladderEndDate = moment(endingDateANdTime).format("MMM DD yyyy");
				let ladderEndTime = moment(endingDateANdTime).format("hh:mm A");
				let tournamentDetail = {
					_id: laddersList[i]._id,
					ladderName: laddersList[i].ladderName,
					ladderTitleImage: laddersList[i].ladderTitleImage,
					prize: laddersList[i].prize,
					teamSize: laddersList[i].teamSize,
					entryFee: laddersList[i].entryFee,
					totalTeams: laddersList[i].totalTeams,
					registered: laddersList[i].participatingTeams.length,
					ladderStartDate: ladderStartDate,
					ladderStartTime: ladderStartTime,
					ladderEndDate: ladderEndDate,
					ladderEndTime: ladderEndTime,
				};
				ladderFinalArr.push(tournamentDetail);
			}
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ladderData = ladderFinalArr;
	return res.status(response.code).json(response);
};
exports.ladderDetail = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let ladderId = req.query.id;
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
		response.ladderData = await this.ladderDetailData(ladderId, userId);
		return res.status(response.code).json(response);
	}
};
exports.addLadderResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let ladderId = request.ladderId;
	let teamId = request.teamId;
	let score = request.score;
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
		let ladderName;
		let gameId;
		let ladderStartDate;
		let ladderEndDate;
		let ladderDetail = await LadderHelper.findLadderById(ladderId);
		if (ladderDetail != null) {
			ladderName = ladderDetail.ladderName;
			gameId = ladderDetail.gameToPlay._id;
			ladderEndDate = ladderDetail.endingDateAndTime;
			ladderStartDate = ladderDetail.startingDateAndTime;
			for (let i = 0; i < ladderDetail.participatingTeams.length; i++) {
				let teamId = ladderDetail.participatingTeams[i].teamId._id.toString();
				participatingTeamArr.push(teamId);
			}
		}
		let nowDate = moment().utc().format("MMM DD YYYY");
		let startDate = moment(ladderStartDate).format("MMM DD YYYY");
		let startDateCHeckResult = moment(startDate).isSameOrBefore(
			nowDate,
			"days"
		);
		if (!startDateCHeckResult) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.CAN_NOT_SUBMIT_RESULT_BEFORE_START
			);
			return res.status(response.code).json(response);
		} else {
			let endDate = moment(ladderEndDate).format("MMM DD YYYY");
			let dateCheckResult = moment(endDate).isSameOrAfter(nowDate, "day");
			if (!dateCheckResult) {
				fs.unlinkSync(filePath);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.CAN_NOT_SUBMIT_RESULT
				);
				return res.status(response.code).json(response);
			} else {
				let teamCheck = participatingTeamArr.includes(teamId.toString());
				if (teamCheck == false) {
					fs.unlinkSync(filePath);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TEAM_NOT_PARTICIPATING
					);
					return res.status(response.code).json(response);
				}
				if (teamCheck == true) {
					//Todo:duplicate submittion allow
					//
					// let checkAlreadySubmit = await LadderResultHelper.findAlreadySubmitResult(ladderId, teamId)
					// if (checkAlreadySubmit != null) {
					//     fs.unlinkSync(filePath)
					//     response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.RESULT_ALREADY_SUBMITTED)
					//     return res.status(response.code).json(response);
					// } else {
					let resultLadderId = await LadderResultHelper.submitResult(
						ladderId,
						ladderName,
						gameId,
						teamId,
						userId,
						score,
						filePath
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.ladderData = await this.ladderDetailData(
						resultLadderId,
						userId
					);
					return res.status(response.code).json(response);
				}
				// }
			}
		}
	}
};
exports.showLaddersForResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let SearchResultForLadderSearch;
	let ladderName = req.query.query;
	let request = req.query;
	let result;
	let pageNo;
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}

	laddersForResult = await LadderResultHelper.laddersResultWithPagination(
		pageNo, ladderName
	);

	let pagination = laddersForResult.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ladderData = { ...pagination, data: laddersForResult.data };
	return res.status(response.code).json(response);
};
exports.updateResultForLadder = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let ladderResultId = request.resultId;
	let resultStatus = request.resultStatus.toLowerCase();
	let ladderResultDetail =
		await LadderResultHelper.findLadderResultByIdForResult(ladderResultId);
	if (ladderResultDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.ALREADY_UPDATED
		);
		return res.status(response.code).json(response);
	}
	if (ladderResultDetail != null) {
		let teamId = ladderResultDetail.teamId.toString();
		let ladderId = ladderResultDetail.ladderId;
		await LadderResultHelper.updateLadderResult(ladderResultId, resultStatus);
		let ladderDetail = await LadderHelper.findLadderById(ladderId);
		let ladderTeamResult;
		let ladderTeams = ladderDetail.participatingTeams;
		for (let i = 0; i < ladderTeams.length; i++) {
			let tid = ladderTeams[i].teamId._id.toString();
			if (tid == teamId) {
				ladderTeamResult = {
					winCount: ladderTeams[i].ladderTeamResult.winCount,
					lossCount: ladderTeams[i].ladderTeamResult.lossCount,
					streakRecord: ladderTeams[i].ladderTeamResult.streakRecord,
				};
			}
		}
		let preWinCount = ladderTeamResult.winCount;
		let preLossCount = ladderTeamResult.lossCount;
		let preStreakRecord = ladderTeamResult.streakRecord;
		let newWinCount, newLossCount;
		let newladderTeamResult;
		if (resultStatus.toLowerCase() == "win") {
			preStreakRecord.push("W");
			newWinCount = preWinCount + 1;
			newLossCount = preLossCount;
		}
		if (resultStatus.toLowerCase() == "loss") {
			preStreakRecord.push("L");
			newWinCount = preWinCount;
			newLossCount = preLossCount + 1;
		}
		newladderTeamResult = {
			winCount: newWinCount,
			lossCount: newLossCount,
			streakRecord: preStreakRecord,
		};
		await LadderHelper.updateLadderTeamResult(
			ladderId,
			teamId,
			newladderTeamResult
		);
		let laddersForResult = await LadderResultHelper.findLadderResultById(
			ladderResultId
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.laddersData = laddersForResult;
		return res.status(response.code).json(response);
	}
};
exports.deleteLadderResultRecord = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId;
	let notResultId = [];
	let deletedResultId = [];
	let pendingResultId = [];
	let resultIdArr = request.resultId;
	for (let i = 0; i < resultIdArr.length; i++) {
		resultId = resultIdArr[i];
		let ladderResultDetailById =
			await LadderResultHelper.findLadderResultByIdForResult(resultId);
		if (ladderResultDetailById == null) {
			notResultId.push(resultId);
		}
		if (ladderResultDetailById != null) {
			if (ladderResultDetailById.result == "pending") {
				pendingResultId.push(resultId);
			} else {
				let resultVideoPath = ladderResultDetailById.resultVideo;
				fs.unlinkSync(resultVideoPath);
				await LadderResultHelper.deleteLadderResultById(resultId);
				deletedResultId.push(resultId);
			}
		}
	}
	if (notResultId.length != 0) {
		console.log("Records of these ID/s not found : " + notResultId);
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
exports.myLadders = async (req, res) => {
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
		let ladderArr = [];
		let finalLadderArr = [];
		let ladderData;
		let ladderObj;
		for (let i = 0; i < teamData.length; i++) {
			let dataCount = 0;
			let teamId = teamData[i]._id;
			ladderData = await LadderHelper.findMyLaddersWithOutDelete(teamId);
			dataCount = ladderData.length;
			if (ladderData.length != 0) {
				for (let j = 0; j < ladderData.length; j++) {
					let ladderDate = moment(ladderData[j].startingDateAndTime).format(
						"MMM DD yyyy"
					);
					let ladderTime = moment(ladderData[j].startingDateAndTime).format(
						"hh:mm A"
					);
					ladderObj = {
						ladderTitleImage: ladderData[j].ladderTitleImage,
						totalTeams: ladderData[j].totalTeams,
						_id: ladderData[j]._id,
						ladderName: ladderData[j].ladderName,
						teamSize: ladderData[j].teamSize,
						entryFee: ladderData[j].entryFee,
						prize: ladderData[j].prize,
						ladderDate: ladderDate,
						ladderTime: ladderTime,
					};
					ladderArr.push(ladderObj);
				}
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.ladderData = ladderArr;
		return res.status(response.code).json(response);
	}
};
exports.ladderByGame = async (req, res) => {
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
		let ladderData = [];
		let ladderList;
		if ("game" in req.query && request.game.length > 0) {
			let gameName = request.game.toLowerCase();
			let gameDetail = await GameHelper.findGameByNameWithoutDelete(gameName);
			if (gameDetail != null) {
				let gameId = gameDetail._id;
				ladderList = await LadderHelper.findLadderByGameIdWithoutDelete(gameId);
				ladderData = await this.ladderListToObj(ladderList);
			} else {
				ladderData = [];
			}
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.ladderData = ladderData;
			return res.status(response.code).json(response);
		}
		if ("game" in req.query && request.game.length == 0) {
			ladderData = [];
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.ladderData = ladderData;
			return res.status(response.code).json(response);
		}
		if (!request.game) {
			ladderList = await LadderHelper.allLaddersListWithoutDeleted();
			ladderData = await this.ladderListToObj(ladderList);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.ladderData = ladderData;
			return res.status(response.code).json(response);
		}
	}
};
exports.createAndGetTotalWarLadder = async (req, res) => {
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
		let twlTeamArr = [];
		let matchResultArr = [];
		let firstEigthResultArr;
		let gameName = "";
		let ladderId = request.ladderId;
		let ladderDetail = await LadderHelper.findLadderByIdWithoutPopulate(
			ladderId
		);
		if (ladderDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LADDER_NOT_EXIST
			);
			return res.status(response.code).json(response);
		} else {
			let gameToPlay = ladderDetail.gameToPlay;
			let gameDetail = await GameHelper.findUserFranchiseGameByIdWithDeleted(
				gameToPlay
			);
			if (gameDetail == null) {
				console.log("game not found in ladder");
			} else {
				gameName = gameDetail.gameName;
			}
			let ladderEndDate = ladderDetail.endingDateAndTime;
			let endDate = moment(ladderEndDate).format("MMM DD YYYY");
			let nowDate = moment().utc().format("MMM DD YYYY");
			let dateCheckResult = moment(endDate).isBefore(nowDate, "day");
			// console.log("date check : ", dateCheckResult)
			if (!dateCheckResult) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.CAN_NOT_START_TWL
				);
				return res.status(response.code).json(response);
			} else {
				let checkPendingLadderResultExist =
					await LadderResultHelper.findPendingResultByLadderId(ladderId);
				if (checkPendingLadderResultExist.length > 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.LADDER_RESULT_NOT_FINALIZE_PENDING
					);
					return res.status(response.code).json(response);
				} else {
					let ladderDetailDataForTwl = await this.ladderDetailData(
						ladderId,
						userId
					);
					let ladderParticipatingTeams =
						ladderDetailDataForTwl.ladderTeamRecord;
					if (ladderParticipatingTeams.length > 0) {
						if (ladderParticipatingTeams.length < 8) {
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.LESS_THAN_REQUIRED_TEAMS
							);
							return res.status(response.code).json(response);
						} else {
							firstEigthResultArr = ladderParticipatingTeams.slice(0, 8);
							let checkTotalWarLadderExist =
								await TotalWarLadderHelper.findTotalWarLadderByLadderIdWithoutDelete(
									ladderId
								);
							if (checkTotalWarLadderExist != null) {
								let matchResultArr = [];
								let win;
								let loss;
								let twlDetail =
									await TotalWarLadderHelper.findTotalWarLadderByLadderIdWithoutDelete(
										ladderId
									);
								if (twlDetail == null) {
									response = ResponseHelper.setResponse(
										ResponseCode.NOT_SUCCESS,
										Message.RECORD_NOT_FOUND
									);
									return res.status(response.code).json(response);
								} else {
									console.log("this 1");
									let twlData = await this.getTotalWarObj(ladderId, userId);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.totalWarLadderData = twlData;
									return res.status(response.code).json(response);
								}
							} else {
								let totalWarLadderId =
									await TotalWarLadderHelper.createTotalWarLadder(
										ladderId,
										gameToPlay,
										gameName,
										firstEigthResultArr
									);
								//let totalWarLadderId = "62ce9903572cbc47384eec42"
								// console.log("total war ladder : ", totalWarLadderId)
								let twlMatchExist =
									await TotalWarLadderHelper.findTotalWarLadderMatchByTwlId(
										totalWarLadderId
									);
								if (twlMatchExist.length == 0) {
									let totalWarLadderDetail =
										await TotalWarLadderHelper.findTotalWarLadderById(
											totalWarLadderId
										);
									let totalWarLadderParticipatingTeams =
										totalWarLadderDetail.participatingTeams;
									let firstTeamsArr = totalWarLadderParticipatingTeams.slice(
										0,
										4
									);
									let secondTeamsArr = totalWarLadderParticipatingTeams.slice(
										4,
										8
									);
									let reverseSecondTeamsArr = secondTeamsArr.reverse();
									for (let i = 0; i < firstTeamsArr.length; i++) {
										let matchId = await this.getRandomNmmber();
										await TotalWarLadderHelper.createTotalWarLadderMatch(
											ladderId,
											totalWarLadderId,
											matchId,
											firstTeamsArr[i],
											reverseSecondTeamsArr[i]
										);
									}
								}
								let twlMatchesArr =
									await TotalWarLadderHelper.findTotalWarLadderMatchByTwlId(
										totalWarLadderId
									);
								let totalWarLadderData = await this.getTotalWarTeamDetailData(
									twlMatchesArr
								);
								let totalWarLadderDetail =
									await TotalWarLadderHelper.findTotalWarLadderById(
										totalWarLadderId
									);
								let totalWarLadderParticipatingTeams =
									totalWarLadderDetail.participatingTeams;
								if (totalWarLadderParticipatingTeams.length > 0) {
									for (let i = 0; i < firstEigthResultArr.length; i++) {
										let teamId = firstEigthResultArr[i];
										let teamDetail = await TeamController.getTeamNameAndImage(
											teamId
										);
										let twlObj = {
											standing: i + 1,
											team: teamDetail.teamViewName,
											win: 0,
											loss: 0,
										};
										matchResultArr.push(twlObj);
									}
								}
								let checkResultSubmit = await this.checkUserSubmitTwlResult(
									ladderId,
									userId
								);
								console.log("result submit obj : ", checkResultSubmit);
								response = ResponseHelper.setResponse(
									ResponseCode.SUCCESS,
									Message.REQUEST_SUCCESSFUL
								);
								response.totalWarLadderData = {
									resultSubmit: checkResultSubmit,
									matches: totalWarLadderData,
									matchResults: matchResultArr,
								};
								return res.status(response.code).json(response);
							}
						}
					}
				}
			}
		}
	}
};
exports.submitTotalWarLadderResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
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
		let ladderId = request.ladderId;
		let score = request.score;
		let teamId = request.teamId;
		let twlDetail =
			await TotalWarLadderHelper.findTotalWarLadderByLadderIdWithoutDelete(
				ladderId
			);
		let totalWarLadderId = twlDetail._id;
		let matchId;
		if ((!request.totalWarLadderId && !request.score, !request.teamId)) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let checkTeamParticipation =
			await TotalWarLadderHelper.findTeamPariticipated(
				totalWarLadderId,
				teamId
			);
		if (checkTeamParticipation == null) {
			fs.unlinkSync(filePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_NOT_PARTICIPATING
			);
			return res.status(response.code).json(response);
		} else {
			let checkIsUserTeam = await TeamHelper.findParticipateInTeam(
				teamId,
				userId
			);
			if (checkIsUserTeam == null) {
				fs.unlinkSync(filePath);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_TEAM_MEMBER
				);
				return res.status(response.code).json(response);
			} else {
				let checkAlreadyResultSubmitted =
					await TotalWarLadderHelper.findAlreadyResultSubmittedByTeam(
						totalWarLadderId,
						teamId
					);
				if (checkAlreadyResultSubmitted != null) {
					fs.unlinkSync(filePath);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.RESULT_ALREADY_SUBMITTED
					);
					return res.status(response.code).json(response);
				} else {
					let twlDetail = await TotalWarLadderHelper.findTotalWarLadderById(
						totalWarLadderId
					);
					if (twlDetail == null) {
						fs.unlinkSync(filePath);
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.TWL_NOT_EXIST
						);
						return res.status(response.code).json(response);
					} else {
						let ladderName = "";
						let gameName = "";
						let ladderId = twlDetail.ladder;
						let ladderDetail = await LadderHelper.findLadderById(ladderId);
						if (ladderDetail != null) {
							ladderName = ladderDetail.ladderName;
						}
						let gameToPlay = twlDetail.gameToPlay;
						let gameDetail =
							await GameHelper.findUserFranchiseGameByIdWithDeleted(gameToPlay);
						if (gameDetail != null) {
							gameName = gameDetail.gameName;
						}
						let teamDetail = await TeamController.getTeamNameAndImage(teamId);
						let teamName = teamDetail.teamViewName;
						let teamMatchDetailForMatchId =
							await TotalWarLadderHelper.findTeamMatchByTeamId(
								totalWarLadderId,
								teamId
							);
						if (teamMatchDetailForMatchId != null) {
							matchId = teamMatchDetailForMatchId.matchId;
						}
						await TotalWarLadderHelper.submitResult(
							totalWarLadderId,
							teamId,
							score,
							ladderId,
							ladderName,
							gameToPlay,
							gameName,
							teamName,
							matchId,
							userId,
							filePath
						);
					}
					let twlData = await this.getTotalWarObj(ladderId, userId);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.totalWarLadderData = twlData;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.showAndSearchTotalWarLadderResults = async (req, res) => {
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
		let twlResultArr = [];
		let allTotalWarLadderResults;
		if (req.query.query) {
			allTotalWarLadderResults =
				await TotalWarLadderHelper.searchAllTotalWarLadderResultWithoutDeleteWithPagination(
					req.query.query.toLowerCase(),
					pageNo
				);
		}
		if (!req.query.query) {
			allTotalWarLadderResults =
				await TotalWarLadderHelper.getAllTotalWarLadderResultWithoutDeleteWithPagination(
					pageNo
				);
		}
		if (allTotalWarLadderResults.data.length > 0) {
			for (let i = 0; i < allTotalWarLadderResults.data.length; i++) {
				let twlObj = {
					_id: allTotalWarLadderResults.data[i]._id,
					teamId: allTotalWarLadderResults.data[i].teamId,
					teamViewName: allTotalWarLadderResults.data[i].teamName,
					gameName: allTotalWarLadderResults.data[i].gameName,
					// gameToPlay:allTotalWarLadderResults.data[i].gameToPlay, //game id
					ladderName: allTotalWarLadderResults.data[i].ladderName,
					score: allTotalWarLadderResults.data[i].score,
					result: allTotalWarLadderResults.data[i].result,
					resultVideo: allTotalWarLadderResults.data[i].resultVideo,
				};
				twlResultArr.push(twlObj);
			}
		}
		let pagination = allTotalWarLadderResults.pagination;
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.totalWarLadderResultData = { ...pagination, data: twlResultArr };
		return res.status(response.code).json(response);
	}
};
exports.deleteTotalWarLadderResults = async (req, res) => {
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
		let resultId;
		let notResultId = [];
		let deletedResultId = [];
		let pendingResultId = [];
		let resultIdArr = request.resultId;
		for (let i = 0; i < resultIdArr.length; i++) {
			resultId = resultIdArr[i];
			let totalWarLadderResultById =
				await TotalWarLadderHelper.findTwlResultByResultId(resultId);
			if (totalWarLadderResultById == null) {
				notResultId.push(resultId);
			}
			if (totalWarLadderResultById != null) {
				if (totalWarLadderResultById.result == "pending") {
					pendingResultId.push(resultId);
				} else {
					let resultVideoPath = totalWarLadderResultById.resultVideo;
					fs.unlinkSync(resultVideoPath);
					await TotalWarLadderHelper.deleteTwlResultById(resultId);
					deletedResultId.push(resultId);
				}
			}
		}
		if (notResultId.length != 0) {
			console.log("Records of these ID/s not found : " + notResultId);
		}
		if (pendingResultId.length > 0) {
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
	}
};
exports.updateTotalWarLadderResults = async (req, res) => {
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
		let resultId = request.resultId;
		let resultStatus = request.resultStatus.toLowerCase();
		let checkTwlResultExist =
			await TotalWarLadderHelper.findTwlResultByResultId(resultId);
		if (checkTwlResultExist == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		} else {
			let teamId = checkTwlResultExist.teamId;
			let twlId = checkTwlResultExist.twlId;
			let teamDetailFromTwlResultForMatchId =
				await TotalWarLadderHelper.findTeamMatchByTeamId(twlId, teamId);
			let matchId = teamDetailFromTwlResultForMatchId.matchId;
			let checkAlreadyResultStatus =
				await TotalWarLadderHelper.findAlreadyResultStatusByMatchId(
					matchId,
					resultStatus
				);
			if (checkAlreadyResultStatus != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_HAVE_THIS_STATUS
				);
				return res.status(response.code).json(response);
			} else {
				await TotalWarLadderHelper.updateResultStatus(resultId, resultStatus);
				let recordDetailByResultId =
					await TotalWarLadderHelper.findTwlResultByResultId(resultId);
				let twlResultObj = {
					_id: recordDetailByResultId._id,
					teamId: recordDetailByResultId.teamId,
					teamViewName: recordDetailByResultId.teamName,
					gameName: recordDetailByResultId.gameName,
					// gameToPlay:recordDetailByResultId.gameToPlay, //game id
					ladderName: recordDetailByResultId.ladderName,
					score: recordDetailByResultId.score,
					result: recordDetailByResultId.result,
					resultVideo: recordDetailByResultId.resultVideo,
				};
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.totalWarLadderResultData = twlResultObj;
				return res.status(response.code).json(response);
			}
		}
	}
};
//// Use with in LadderController - (waheeb) ////////////////////////////////////////////////////
exports.ladderDetailData = async (ladderId, userId) => {
	let myTeamsArr = [];
	let ladderJoined;
	let teamId;
	let userTeams = await TeamHelper.showTeams(userId);
	for (let i = 0; i < userTeams.length; i++) {
		let myTeamsId = userTeams[i]._id;
		myTeamsArr.push(myTeamsId.toString());
	}
	let ladderTeamArr = [];
	let ladderTeamFinalArr = [];
	let participatingTeamsInLadderArr = [];
	let ladderDetail = await LadderHelper.findLadderById(ladderId);
	for (let i = 0; i < ladderDetail.participatingTeams.length; i++) {
		let teamId = ladderDetail.participatingTeams[i].teamId._id;
		participatingTeamsInLadderArr.push(teamId.toString());
	}
	const intersection = participatingTeamsInLadderArr.filter((element) =>
		myTeamsArr.includes(element)
	);
	teamId = intersection[0];
	let participatingResult = myTeamsArr.includes(teamId);
	if (participatingResult == true) {
		ladderJoined = true;
	}
	if (participatingResult == false) {
		ladderJoined = false;
		teamId = "";
	}
	let joinStartingDateAndTime = ladderDetail.startingDateAndTime;
	let ladderStartDate = moment(joinStartingDateAndTime).format("MMM DD yyyy");
	let ladderStartTime = moment(joinStartingDateAndTime).format("hh:mm A");
	let endingDateANdTime = ladderDetail.endingDateAndTime;
	let ladderEndDate = moment(endingDateANdTime).format("MMM DD yyyy");
	let ladderEndTime = moment(endingDateANdTime).format("hh:mm A");
	let ladderData = {
		_id: ladderDetail._id,
		ladderName: ladderDetail.ladderName,
		ladderTitleImage: ladderDetail.ladderTitleImage,
		prize: ladderDetail.prize,
		teamSize: ladderDetail.teamSize,
		entryFee: ladderDetail.entryFee,
		totalTeams: ladderDetail.totalTeams,
		registered: ladderDetail.participatingTeams.length,
		ladderStartDate: ladderStartDate,
		ladderStartTime: ladderStartTime,
		ladderEndDate: ladderEndDate,
		ladderEndTime: ladderEndTime,
		ladderJoined: ladderJoined,
		teamId: teamId,
	};
	for (let k = 0; k < ladderDetail.participatingTeams.length; k++) {
		let streakArr =
			ladderDetail.participatingTeams[k].ladderTeamResult.streakRecord;
		let streakResultArr = [];
		let streakResultArr2 = [];
		let streakResult;
		let arrFirstIndex;
		let win = 0;
		let loss = 0;
		let finalWinPercentage;
		if (streakArr.length == 0) {
			streakResult = null;
		}
		if (streakArr.length != 0) {
			for (let i = 0; i < streakArr.length; i++) {
				arrFirstIndex = streakArr[0]; //first index value
				if (arrFirstIndex == streakArr[i]) {
					if (streakArr[i] == "W") {
						win++;
						if (streakArr[i] != streakArr[i + 1]) {
							streakResultArr.push(win);
							streakResultArr2.push("W");
							win = 0;
						}
					}
					if (streakArr[i] == "L") {
						loss++;
						if (streakArr[i] != streakArr[i + 1]) {
							streakResultArr.push(loss);
							streakResultArr2.push("L");
							loss = 0;
						}
					}
				}
				if (arrFirstIndex != streakArr[i]) {
					if (streakArr[i] == "W") {
						win++;
						if (streakArr[i] != streakArr[i + 1]) {
							streakResultArr.push(win);
							streakResultArr2.push("W");
							win = 0;
						}
					}
					if (streakArr[i] == "L") {
						loss++;
						if (streakArr[i] != streakArr[i + 1]) {
							streakResultArr.push(loss);
							streakResultArr2.push("L");
							loss = 0;
						}
					}
				}
			}
			let largest = streakResultArr[0];
			let streakResultArrIndex;
			for (let i = 0; i < streakResultArr.length; i++) {
				if (largest < streakResultArr[i] || largest == streakResultArr[i]) {
					largest = streakResultArr[i];
					streakResultArrIndex = i;
				}
			}
			streakResult = largest + "" + streakResultArr2[streakResultArrIndex];
		}
		let winCount = ladderDetail.participatingTeams[k].ladderTeamResult.winCount;
		let lossCount =
			ladderDetail.participatingTeams[k].ladderTeamResult.lossCount;
		let totalCount = winCount + lossCount;
		if (totalCount == 0) {
			totalCount = 1;
		}
		let winPercentage = (winCount / (winCount + lossCount)) * 100;
		let nanCheck = isNaN(winPercentage);
		if (nanCheck == true) {
			finalWinPercentage = 0;
		} else {
			finalWinPercentage = winPercentage.toFixed(0);
		}
		let ladderTeamData = {
			teamId: ladderDetail.participatingTeams[k].teamId._id,
			teamViewName: ladderDetail.participatingTeams[k].teamId.teamViewName,
			winCount: winCount,
			lossCount: lossCount,
			winPercentage: finalWinPercentage + "%",
			streakResult: streakResult,
		};
		ladderTeamArr.push(ladderTeamData);
	}
	let ladderTeamDataSortByWinCount = [];
	// sort by value
	ladderTeamDataSortByWinCount = ladderTeamArr.sort(function (a, b) {
		return b.winCount - a.winCount;
	});
	for (let m = 0; m < ladderTeamDataSortByWinCount.length; m++) {
		let ladderTeamFinalData = {
			standing: m + 1,
			_id: ladderTeamDataSortByWinCount[m].teamId,
			teamViewName: ladderTeamDataSortByWinCount[m].teamViewName,
			winCount: ladderTeamDataSortByWinCount[m].winCount,
			lossCount: ladderTeamDataSortByWinCount[m].lossCount,
			winPercentage: ladderTeamDataSortByWinCount[m].winPercentage,
			streakResult: ladderTeamDataSortByWinCount[m].streakResult,
		};
		ladderTeamFinalArr.push(ladderTeamFinalData);
	}
	return { ...ladderData, ladderTeamRecord: [...ladderTeamFinalArr] };
};
exports.ladderListToObj = async (ladderData) => {
	let ladderArr = [];
	if (ladderData.length != 0) {
		for (let j = 0; j < ladderData.length; j++) {
			//
			// let dateAndTime = moment(ladderData[j].startingDateAndTime).utc().format('YYYY-MM-DD HH:mm:ss');
			// console.log(dateAndTime); // 2015-09-13 03:39:27
			// var stillUtc = moment.utc(dateAndTime).toDate();
			// var local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');
			// console.log(local); // 2015-09-13 09:39:27
			//
			///
			// var dateObject = new Date();
			// let aa = dateObject.toLocaleString()
			// //"8/30/2019, 10:55:19 AM" // My current time
			// console.log("aa : ", aa)
			// var utcDateObject = new Date(dateObject.getUTCFullYear(), dateObject.getUTCMonth(), dateObject.getUTCDate(), dateObject.getUTCHours(), dateObject.getUTCMinutes(), dateObject.getUTCSeconds());
			// let bb = utcDateObject.toLocaleString()
			// //   "8/30/2019, 5:26:04 AM" // UTC time which is 5.5 hours less than my local time
			// console.log("bb : ", bb)
			///
			let ladderDate = moment(ladderData[j].startingDateAndTime).format(
				"MMM DD yyyy"
			);
			let ladderTime = moment(ladderData[j].startingDateAndTime).format(
				"hh:mm A"
			);
			ladderObj = {
				ladderTitleImage: ladderData[j].ladderTitleImage,
				totalTeams: ladderData[j].totalTeams,
				_id: ladderData[j]._id,
				ladderName: ladderData[j].ladderName,
				teamSize: ladderData[j].teamSize,
				entryFee: ladderData[j].entryFee,
				prize: ladderData[j].prize,
				ladderDate: ladderDate,
				ladderTime: ladderTime,
			};
			ladderArr.push(ladderObj);
		}
	}
	return ladderArr;
};
exports.getRandomNmmber = async () => {
	let length = 8;
	let result = "";
	let characters = "abcdefghijklmnopqrstuvwxyz0123456789";
	let charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};
exports.getTotalWarTeamDetailData = async (twlMatchExist) => {
	let twlTeamArr = [];
	for (let i = 0; i < twlMatchExist.length; i++) {
		let teamOne = twlMatchExist[i].teamOne;
		let teamOneDetail = await TeamController.getTeamNameAndImage(teamOne);
		let teamOneViewName = teamOneDetail.teamViewName;
		let teamOneTitleImage = teamOneDetail.teamTitleImage;
		//
		let teamTwo = twlMatchExist[i].teamTwo;
		let teamTwoDetail = await TeamController.getTeamNameAndImage(teamTwo);
		let teamTwoViewName = teamTwoDetail.teamViewName;
		let teamTwoTitleImage = teamTwoDetail.teamTitleImage;
		//
		let twlObj = {
			_id: twlMatchExist[i]._id,
			teamOne: {
				_id: twlMatchExist[i].teamOne,
				teamViewName: teamOneViewName,
				teamTitleImage: teamOneTitleImage,
			},
			teamTwo: {
				_id: twlMatchExist[i].teamTwo,
				teamViewName: teamTwoViewName,
				teamTitleImage: teamTwoTitleImage,
			},
			result: twlMatchExist[i].result,
		};
		twlTeamArr.push(twlObj);
	}
	return twlTeamArr;
};
exports.getTotalWarObj = async (ladderId, userId) => {
	console.log("ladder data");
	let matchResultArr = [];
	let firstEigthResultArr = [];
	let twlDetail =
		await TotalWarLadderHelper.findTotalWarLadderByLadderIdWithDelete(ladderId);
	console.log("twl detail : ", twlDetail);
	let totalWarLadderId = twlDetail._id;
	console.log("totalWarLadderId : ", totalWarLadderId);
	let ladderDetailDataForTwl = await this.ladderDetailData(ladderId, userId);
	console.log("ladder detail data for twl : ", ladderDetailDataForTwl);
	let ladderParticipatingTeams = ladderDetailDataForTwl.ladderTeamRecord;
	console.log("ladder participating team : ", ladderParticipatingTeams);
	let twlMatchesArr = await TotalWarLadderHelper.findTotalWarLadderMatchByTwlId(
		totalWarLadderId
	);
	console.log("twl match arr : ", twlMatchesArr);
	let totalWarLadderData = await this.getTotalWarTeamDetailData(twlMatchesArr);
	console.log("total war ladder data arr : ", totalWarLadderData);
	let twlResultsArr =
		await TotalWarLadderHelper.getAllTotalWarLadderResultByTwlId(
			totalWarLadderId
		);
	console.log("twl result arr : ", twlResultsArr);
	console.log("result arr lebgth  : ", twlResultsArr.length);
	if (twlResultsArr.length == 0) {
		let totalWarLadderDetail =
			await TotalWarLadderHelper.findTotalWarLadderById(totalWarLadderId);
		let totalWarLadderParticipatingTeams =
			totalWarLadderDetail.participatingTeams;
		if (totalWarLadderParticipatingTeams.length > 0) {
			if (ladderParticipatingTeams.length > 0) {
				if (ladderParticipatingTeams.length < 8) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.LESS_THAN_REQUIRED_TEAMS
					);
					return res.status(response.code).json(response);
				} else {
					firstEigthResultArr = ladderParticipatingTeams.slice(0, 8);
				}
				for (let i = 0; i < firstEigthResultArr.length; i++) {
					let teamId = firstEigthResultArr[i];
					let teamDetail = await TeamController.getTeamNameAndImage(teamId);
					let twlObj = {
						standing: i + 1,
						team: teamDetail.teamViewName,
						win: 0,
						loss: 0,
					};
					matchResultArr.push(twlObj);
				}
			}
		} else if (twlResultsArr.length <= 8 || twlResultsArr.length > 0) {
			for (let i = 0; i < twlDetail.participatingTeams.length; i++) {
				let teamId = twlDetail.participatingTeams[i];
				let checkTwlResultByTeamId = await TotalWarLadderHelper.findResultById(
					totalWarLadderId,
					teamId
				);
				if (checkTwlResultByTeamId == null) {
					let teamDetail = await TeamController.getTeamNameAndImage(teamId);
					let twlObj = {
						standing: i + 1,
						team: teamDetail.teamViewName,
						win: 0,
						loss: 0,
					};
					matchResultArr.push(twlObj);
				} else {
					let teamName = checkTwlResultByTeamId.teamName;
					let result = checkTwlResultByTeamId.result;
					if (result == "win") {
						(win = 1), (loss = 0);
					} else if (result == "loss") {
						(win = 0), (loss = 1);
					} else {
						(win = 0), (loss = 0);
					}
					let twlObj = {
						standing: i + 1,
						team: teamName,
						win: win,
						loss: loss,
					};
					matchResultArr.push(twlObj);
				}
			}
		}
	} else {
		for (let i = 0; i < twlResultsArr.length; i++) {
			let teamName = twlResultsArr[i].teamName;
			let result = twlResultsArr[i].result;
			if (result == "win") {
				(win = 1), (loss = 0);
			} else if (result == "loss") {
				(win = 0), (loss = 1);
			} else {
				(win = 0), (loss = 0);
			}
			let twlObj = {
				standing: i + 1,
				team: teamName,
				win: win,
				loss: loss,
			};
			matchResultArr.push(twlObj);
		}
	}
	let checkResultSubmit = await this.checkUserSubmitTwlResult(ladderId, userId);
	return {
		resultSubmit: checkResultSubmit,
		matches: totalWarLadderData,
		matchResults: matchResultArr,
	};
};
exports.checkUserSubmitTwlResult = async (ladderId, userId) => {
	let resultSubmitted = false;
	let twlDetail =
		await TotalWarLadderHelper.findTotalWarLadderByLadderIdWithoutDelete(
			ladderId
		);
	let totalWarLadderId = twlDetail._id;
	let twlResultsArr =
		await TotalWarLadderHelper.getAllTotalWarLadderResultByTwlIdWithoutDelete(
			totalWarLadderId
		);
	if (twlResultsArr.length == 0) {
		resultSubmitted = false;
	} else {
		for (let i = 0; i < twlResultsArr.length; i++) {
			let teamId = twlResultsArr[i].teamId;
			let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
			if (teamDetail != null) {
				let teamMembers = teamDetail.teamMembers;
				if (teamMembers.length > 0) {
					for (let j = 0; j < teamMembers.length; j++) {
						let teamMemberId = teamMembers[j].userId;
						if (teamMemberId.toString() == userId.toString()) {
							resultSubmitted = true;
						}
					}
				}
			}
		}
	}
	return resultSubmitted;
};
//for home
exports.getAllLadderForHome = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let allLadders = await LadderHelper.getAllLaddersForHome();
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ladderData = allLadders;
	return res.status(response.code).json(response);
};
