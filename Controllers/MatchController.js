const fs = require("fs");
const mongoose = require("mongoose");
const cron = require("node-cron");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const MatchHelper = require("../Services/MatchHelper");
const MatchResultHelper = require("../Services/MatchResultHelper");
const GeneralHelper = require("../Services/GeneralHelper");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
const tokenExtractor = require("../Middleware/TokenExtracter");
const UserHelper = require("../Services/UserHelper");
const moment = require("moment");
const UserController = require("../Controllers/UserController");
const GameHelper = require("../Services/GameHelper");
const LadderHelper = require("../Services/LadderHelper");
//////////////////////////////////////////////////////////////////////////
exports.createMatchInvitation = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let matchDetail;
	let matchId;
	let userName;
	let matchObj;
	let jpgImage;
	let pngImage;
	let imagePath;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		imagePath = req.file.path;
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
	if (userId != null) {
		if (
			!request.matchName ||
			!request.gameToPlay ||
			!request.platform ||
			!request.startingDateAndTime ||
			!request.prize ||
			!request.matchRules
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
		let userData = await UserHelper.foundUserById(userId);
		let userCredits = userData.userDetail.credits;
		let prize = request.prize;
		let prizeDeduction = (prize / 2).toFixed(2);
		if (userCredits < prizeDeduction) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_INSUFFICIENT_CREDIT
			);
			return res.status(response.code).json(response);
		}
		if (request.challengeTo != "") {
			matchDetail = await MatchHelper.findMatchByTitleAndUserId(
				request.matchName.toLowerCase(),
				userId,
				request.challengeTo
			);
		}
		if (request.challengeTo == "" || !request.challengeTo) {
			matchDetail = await MatchHelper.findPublicMatchByTitleAndUserId(
				request.matchName.toLowerCase(),
				userId
			);
		}
		if (matchDetail != null) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MATCH_ALREADY_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (matchDetail == null) {
			if (request.challengeTo == "" || !request.challengeTo) {
				matchId = await MatchHelper.createPublicMatchInvitation(
					request,
					userId,
					imagePath,
					startDateAndTime
				);
			} else {
				matchId = await MatchHelper.createMatchInvitation(
					request,
					userId,
					imagePath,
					startDateAndTime
				);
			}
			let prizePool = userCredits - prizeDeduction;
			await UserHelper.updateCredit(userId, prizePool);
			let matchInvitation =
				await MatchHelper.findMatchInvitationByIdWithPopulate(matchId);
			if (matchInvitation.challengeTo == null) {
				userName = "";
			}
			if (matchInvitation.challengeTo != null) {
				userName = matchInvitation.challengeTo.userDetail.userName;
			}
			if (request.challengeTo != "") {
				matchObj = {
					_id: matchInvitation._id,
					matchName: matchInvitation.matchName,
					gameToPlay: matchInvitation.gameToPlay.gameName,
					platform: matchInvitation.platform,
					matchRules: matchInvitation.matchRules,
					createdBy: matchInvitation.challengeBy.userDetail.userName,
					challengeBy: {
						userName: matchInvitation.challengeBy.userDetail.userName,
						resultStatus: "",
					},
					challengeTo: {
						userName: userName,
						resultStatus: "",
					},
					prize: matchInvitation.prize,
					status: matchInvitation.status,
					startDate: moment(matchInvitation.startingDateAndTime).format(
						"MMM DD yyyy"
					),
					startTime: moment(matchInvitation.startingDateAndTime).format(
						"hh:mm A"
					),
					matchTitleImage: matchInvitation.matchTitleImage,
				};
			}
			if (request.challengeTo == "" || !request.challengeTo) {
				matchObj = {
					_id: matchInvitation._id,
					matchName: matchInvitation.matchName,
					gameToPlay: matchInvitation.gameToPlay.gameName,
					platform: matchInvitation.platform,
					challengeBy: {
						_id: matchInvitation.challengeBy._id,
						userName: matchInvitation.challengeBy.userDetail.userName,
						resultStatus: "",
					},
					challengeTo: {
						userName: "",
						resultStatus: "",
					},
					prize: matchInvitation.prize,
					status: matchInvitation.status,
					startDate: moment(matchInvitation.startingDateAndTime).format(
						"MMM DD yyyy"
					),
					startTime: moment(matchInvitation.startingDateAndTime).format(
						"hh:mm A"
					),
					matchTitleImage: matchInvitation.matchTitleImage,
					matchRules: matchInvitation.matchRules,
				};
			}
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.matchData = matchObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.responseMatchInvitation = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let userCredits = userData.userDetail.credits;
		let matchDetail = await MatchHelper.findMatchInvitationByIdWithPopulate(
			request.matchId
		);
		let challengeById = matchDetail.challengeBy._id;
		let challengeByData = await UserHelper.foundUserById(challengeById);
		let challengeToData = await MatchHelper.checkChallengeTo(request.matchId);
		let challengeByCredits = challengeByData.userDetail.credits;
		let prize = matchDetail.prize;
		let prizeDeduction = (prize / 2).toFixed(2);
		let responseStatus = request.status.toLowerCase();
		if (challengeById == userId) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_ELIGIBLE_TO_ACCEPT
			);
			return res.status(response.code).json(response);
		}
		if (responseStatus === "cancelled") {
			let challengeByUpdatedCredit =
				parseFloat(challengeByCredits) + parseFloat(prizeDeduction);
			await UserHelper.updateCredit(challengeById, challengeByUpdatedCredit);
			await MatchHelper.matchInvitationResponse(
				request.matchId,
				request.status
			);
			let myRequests = await UserController.myRequestData(userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.receivedRequests = myRequests.receivedRequests;
			response.sentRequests = myRequests.sentRequests;
			return res.status(response.code).json(response);
		}
		if (responseStatus === "accepted") {
			if (userCredits < prizeDeduction) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.USER_INSUFFICIENT_CREDIT
				);
				return res.status(response.code).json(response);
			}
			if (userCredits >= prizeDeduction) {
				let challengeToUpdatedCredit =
					parseFloat(userCredits) - parseFloat(prizeDeduction);
				await UserHelper.updateCredit(userId, challengeToUpdatedCredit);
				//for public match
				if (challengeToData.challengeTo == null) {
					await MatchHelper.publicMatchInvitationResponse(
						request.matchId,
						userId,
						request.status
					);
					let matchList = await MatchHelper.findPublicMatches();
					let matchData = await this.publicMatchesData(matchList);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.matchData = matchData;
					return res.status(response.code).json(response);
				}
			}
			//for with friend match
			if (challengeToData.challengeTo != null) {
				await MatchHelper.matchInvitationResponse(
					request.matchId,
					request.status
				);
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
};
exports.myAllMatches = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let matchFinalArr = [];
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
	let challengeById;
	let challengeToId;
	let challengeByResult;
	let challengeToResult;
	let challengeByMatchFinalResult;
	let challengeToMatchFinalResult;
	if (userId != null) {
		let matchData = await MatchHelper.findMyMatches(userId);
		for (let i = 0; i < matchData.length; i++) {
			if (matchData[i].winningUser != null) {
				// TODO: For Future Use
				let matchId = matchData[i]._id;
				challengeById = matchData[i].challengeBy._id;
				challengeToId = matchData[i].challengeTo._id;
				let challengeByMatchResult =
					await MatchResultHelper.findUserMatchResultByMatchId(
						challengeById,
						matchId
					);
				if (challengeByMatchResult != null) {
					for (let i = 0; i < challengeByMatchResult.results.length; i++) {
						if (
							challengeByMatchResult.results[i].playerId.toString() ==
							challengeById.toString()
						) {
							challengeByMatchFinalResult =
								challengeByMatchResult.results[i].result;
						}
						if (challengeByMatchFinalResult == "pending") {
							challengeByResult = "";
						} else {
							challengeByResult = challengeByMatchFinalResult;
						}
					}
				} else {
					challengeByResult = "";
				}
				let challengeToMatchResult =
					await MatchResultHelper.findUserMatchResultByMatchId(
						challengeToId,
						matchId
					);
				if (challengeToMatchResult != null) {
					for (let i = 0; i < challengeToMatchResult.results.length; i++) {
						if (
							challengeToMatchResult.results[i].playerId.toString() ==
							challengeToId.toString()
						) {
							challengeToMatchFinalResult =
								challengeToMatchResult.results[i].result;
						}
						if (challengeToMatchFinalResult == "pending") {
							challengeToResult = "";
						} else {
							challengeToResult = challengeToMatchFinalResult;
						}
					}
				} else {
					challengeToResult = "";
				}
			}
			if (matchData[i].winningUser == null) {
				challengeByResult = "";
				challengeToResult = "";
			}
			let matchObj;
			if (matchData[i].challengeTo != null) {
				matchObj = {
					_id: matchData[i]._id,
					matchName: matchData[i].matchName,
					gameToPlay: matchData[i].gameToPlay.gameName,
					platform: matchData[i].platform,
					matchRules: matchData[i].matchRules,
					challengeBy: {
						_id: matchData[i].challengeBy._id,
						userName: matchData[i].challengeBy.userDetail.userName,
						resultStatus: challengeByResult,
					},
					challengeTo: {
						_id: matchData[i].challengeTo._id,
						userName: matchData[i].challengeTo.userDetail.userName,
						resultStatus: challengeToResult,
					},
					prize: matchData[i].prize,
					status: matchData[i].status,
					startDate: moment(matchData[i].startingDateAndTime).format(
						"MMM DD yyyy"
					),
					startTime: moment(matchData[i].startingDateAndTime).format("hh:mm A"),
					matchTitleImage: matchData[i].matchTitleImage,
				};
				matchFinalArr.push(matchObj);
			}
			if (matchData[i].challengeTo == null) {
				matchObj = {
					_id: matchData[i]._id,
					matchName: matchData[i].matchName,
					gameToPlay: matchData[i].gameToPlay.gameName,
					platform: matchData[i].platform,
					challengeBy: {
						_id: matchData[i].challengeBy._id,
						userName: matchData[i].challengeBy.userDetail.userName,
						resultStatus: challengeByResult,
					},
					challengeTo: {
						_id: "",
						userName: "",
						resultStatus: challengeToResult,
					},
					prize: matchData[i].prize,
					status: matchData[i].status,
					startDate: moment(matchData[i].startingDateAndTime).format(
						"MMM DD yyyy"
					),
					startTime: moment(matchData[i].startingDateAndTime).format("hh:mm A"),
					matchTitleImage: matchData[i].matchTitleImage,
					matchRules: matchData[i].matchRules,
				};
				matchFinalArr.push(matchObj);
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.matchData = matchFinalArr;
		return res.status(response.code).json(response);
	}
};
exports.publicMatches = async (req, res) => {
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
		let matchData = [];
		let matchList;
		if ("game" in req.query && request.game.length > 0) {
			let gameName = request.game.toLowerCase();
			let gameDetail = await GameHelper.findGameByNameWithoutDelete(gameName);
			if (gameDetail != null) {
				let gameId = gameDetail._id;
				matchList = await MatchHelper.findPublicMatchesByGame(gameId);
				matchData = await this.publicMatchesData(matchList);
			} else {
				matchData = [];
			}
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.matchData = matchData;
			return res.status(response.code).json(response);
		}
		if ("game" in req.query && request.game.length == 0) {
			matchData = [];
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.matchData = matchData;
			return res.status(response.code).json(response);
		}
		if (!request.game) {
			let matchList = await MatchHelper.findPublicMatches();
			let matchData = await this.publicMatchesData(matchList);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.matchData = matchData;
			return res.status(response.code).json(response);
		}
	}
};
exports.showMatchById = async (req, res) => {
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
		let matchId = req.query.id;
		let matchDetail = await MatchHelper.findMatchByIdPopulatedWithoutDel(
			matchId
		);
		let challengeById = matchDetail.challengeBy._id;
		let challengeToId = matchDetail.challengeTo._id;
		let challengeByResult;
		let challengeToResult;
		let matchRecordOfChallengeByUser = await this.matchDataByUserId(
			challengeById
		);
		let matchRecordOfChallengeToUser = await this.matchDataByUserId(
			challengeToId
		);
		let challengeByMatchResult =
			await MatchResultHelper.findUserMatchResultByMatchId(
				challengeById,
				matchId
			);
		let challengeByMatchFinalResult;
		let challengeToMatchFinalResult;
		if (challengeByMatchResult != null) {
			for (let i = 0; i < challengeByMatchResult.results.length; i++) {
				if (
					challengeByMatchResult.results[i].playerId.toString() ==
					challengeById.toString()
				) {
					challengeByMatchFinalResult =
						challengeByMatchResult.results[i].result;
				}
			}
			if (challengeByMatchFinalResult == "pending") {
				challengeByResult = "";
			} else {
				challengeByResult = challengeByMatchFinalResult;
			}
		} else {
			challengeByResult = "";
		}
		let challengeToMatchResult =
			await MatchResultHelper.findUserMatchResultByMatchId(
				challengeToId,
				matchId
			);
		if (challengeToMatchResult != null) {
			for (let i = 0; i < challengeToMatchResult.results.length; i++) {
				if (
					challengeToMatchResult.results[i].playerId.toString() ==
					challengeToId.toString()
				) {
					challengeToMatchFinalResult =
						challengeToMatchResult.results[i].result;
				}
			}
			if (challengeToMatchFinalResult == "pending") {
				challengeToResult = "";
			} else {
				challengeToResult = challengeToMatchFinalResult;
			}
		} else {
			challengeToResult = "";
		}
		//todo:
		// Note: (pending) update on user profile function
		// if (matchDetail.winningUser != null) {
		//     if (matchDetail.winningUser._id.toString() == matchDetail.challengeBy._id.toString()) {
		//         challengeByResult = "win"
		//         challengeToResult = "loss"
		//     } else {
		//         challengeByResult = "loss"
		//         challengeToResult = "win"
		//     }
		// }
		// if (matchDetail.winningUser == null) {
		//     challengeByResult = "", challengeToResult = ""
		// }
		///
		console.log(matchDetail);
		let matchObj = {
			matchTitleImage: matchDetail.matchTitleImage,
			startDate: moment(matchDetail.startingDateAndTime).format("MMM DD yyyy"),
			startTime: moment(matchDetail.startingDateAndTime).format("hh:mm A"),
			matchName: matchDetail.matchName,
			hostedBy: matchDetail.challengeBy.userDetail.userName,
			prize: matchDetail.prize,
			challengeBy: {
				profileImage: matchDetail.challengeBy.profileImage,
				userName: matchDetail.challengeBy.userDetail.userName,
				resultStatus: challengeByResult,
				matches: matchRecordOfChallengeByUser.matches,
				win: matchRecordOfChallengeByUser.win,
				loss: matchRecordOfChallengeByUser.loss,
				winPercentage: matchRecordOfChallengeByUser.winPercentage,
			},
			challengeTo: {
				profileImage: matchDetail.challengeTo.profileImage,
				userName: matchDetail.challengeTo.userDetail.userName,
				resultStatus: challengeToResult,
				matches: matchRecordOfChallengeToUser.matches,
				win: matchRecordOfChallengeToUser.win,
				loss: matchRecordOfChallengeToUser.loss,
				winPercentage: matchRecordOfChallengeToUser.winPercentage,
			},
			matchRules: matchDetail.matchRules,
		};
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.matchData = matchObj;
		return res.status(response.code).json(response);
	}
};
exports.addMatchResult = async (req, res) => {
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
		console.log("1");
		console.log("match id : ", request.matchId);
		let userData = await UserHelper.foundUserById(userId);
		let userName = userData.userDetail.userName;
		let matchDetail = await MatchHelper.findMatchByIdPopulatedWithoutDel(
			request.matchId
		);
		console.log("match id : ", request.matchId);
		let matchName = matchDetail.matchName;
		let gameToPlay = matchDetail.gameToPlay._id;
		let results = {
			playerId: mongoose.Types.ObjectId(userId),
			playerName: userName,
			score: request.score,
			resultVideo: filePath,
			result: "pending",
			submissionDate: moment().utc().format("MMM DD yyyy HH:mm:ss"),
		};
		let matchResultRecord = await MatchResultHelper.findMatchResultByMatchId(
			request.matchId
		);
		if (matchResultRecord == null) {
			console.log("2");
			console.log(request.matchId, matchName, gameToPlay, results);
			let matchResultId = await MatchResultHelper.addNewResult(
				request.matchId,
				matchName,
				gameToPlay,
				results
			); //(request, matchName, userId, gameToPlay, filePath)
			let matchData = await MatchResultHelper.findMatchByIdWithoutDel(
				matchResultId
			);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.matchData = matchData;
			return res.status(response.code).json(response);
		}
		if (matchResultRecord != null) {
			console.log("3");
			console.log(request.matchId, userId);
			let matchResultCheck =
				await MatchResultHelper.checkAlreadySubmitMatchResult(
					request.matchId,
					userId
				);
			if (matchResultCheck != null) {
				fs.unlinkSync(filePath);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_SUBMITTED
				);
				return res.status(response.code).json(response);
			}
			if (matchResultCheck == null) {
				console.log(request.matchId, results);
				let matchResultId = await MatchResultHelper.addResult(
					request.matchId,
					results
				);
				console.log("iiddd : ", matchResultId);
				let matchData = await MatchResultHelper.findMatchByIdWithoutDel(
					matchResultId
				);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.matchData = matchData;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.showAndSearchMatchForResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let matchData;
	let matchDataObj;
	let matchDataArr = [];
	let request = req.query;
	let pageNo;
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}

	matchData =
		await MatchResultHelper.allMatchWithPagination(
			pageNo, req.query.query
		);

	if (matchData.data.length != 0) {
		for (let i = 0; i < matchData.data.length; i++) {
			matchDataObj = {
				isDeleted: matchData.data[i].isDeleted,
				deletedAt: matchData.data[i].deletedAt,
				winner: matchData.data[i].winner,
				results: matchData.data[i].results,
				_id: matchData.data[i]._id,
				matchId: matchData.data[i].matchId,
				matchName: matchData.data[i].matchName,
				gameToPlay: matchData.data[i].gameToPlay.gameName,
				createdAt: matchData.data[i].createdAt,
				updatedAt: matchData.data[i].updatedAt,
			};
			matchDataArr.push(matchDataObj);
		}
	} else {
		matchDataArr = [];
	}
	let pagination = matchData.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.matchData = { ...pagination, data: matchDataArr };
	return res.status(response.code).json(response);
};
exports.updateResultForMatch = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let matchDataArr = [];
	let matchResultId = request.resultId;
	let resultStatus = request.resultStatus.toLowerCase();
	let matchResultDetail = await MatchResultHelper.findMatchResultByIdWithDel(
		matchResultId
	);
	if (matchResultDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.NOT_REQUESTED
		);
		return res.status(response.code).json(response);
	}
	if (matchResultDetail != null) {
		let userId = request.userId;
		let matchId = matchResultDetail.matchId;
		let matchDetail = await MatchHelper.findMatchByIdWithDel(matchId);
		let matchPrize = matchDetail.prize;
		let userData = await UserHelper.foundUserById(userId);
		let userCredit = userData.userDetail.credits;
		if (resultStatus == "loss") {
			let resultArr = [];
			let alreadyWinLossMatch =
				await MatchResultHelper.checkAlreadyWinLossMatchResult(matchId, userId);
			for (let i = 0; i < alreadyWinLossMatch.results.length; i++) {
				resultArr.push(alreadyWinLossMatch.results[i].result);
			}
			if (resultArr.includes("loss") == true) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_HAVE_THIS_STATUS
				);
				return res.status(response.code).json(response);
			}
			if (resultArr.includes("loss") == false) {
				let checkAlreadyMatchWinningUser =
					await MatchHelper.findAlreadyWinningUser(matchId, userId);
				if (checkAlreadyMatchWinningUser.length != 0) {
					await MatchHelper.updateMatchWinningUserToNull(matchId);
					await MatchResultHelper.updateMatchResultWinnerToNull(matchId);
					let credit = userCredit - matchPrize;
					await UserHelper.updateCredit(userId, credit);
				}
				await MatchResultHelper.updateMatchResult(
					matchResultId,
					userId,
					resultStatus
				);
			}
		}
		if (resultStatus == "win") {
			let resultArr = [];
			let alreadyWinLossMatch =
				await MatchResultHelper.checkAlreadyWinLossMatchResult(matchId, userId);
			for (let i = 0; i < alreadyWinLossMatch.results.length; i++) {
				resultArr.push(alreadyWinLossMatch.results[i].result);
			}
			if (resultArr.includes("win") == true) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_HAVE_THIS_STATUS
				);
				return res.status(response.code).json(response);
			}
			if (resultArr.includes("win") == false) {
				let findWinningResult =
					await MatchResultHelper.findAlreadyWinMatchResult(matchId);
				if (findWinningResult != null) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_WIN_MATCH_RESULT
					);
					return res.status(response.code).json(response);
				}
				if (findWinningResult == null) {
					await MatchResultHelper.updateMatchResult(
						matchResultId,
						userId,
						resultStatus
					);
					await MatchHelper.updateWinUserMatchResult(matchId, userId);
					let credit = userCredit + matchPrize;
					await UserHelper.updateCredit(userId, credit);
				}
			}
		}
		let resultArrForCheckPending = [];
		let winPlayerId;
		let checkPendingMatch = await MatchResultHelper.checkPendingForMatchResult(
			matchId,
			userId
		);
		for (let i = 0; i < checkPendingMatch.results.length; i++) {
			let playerId = checkPendingMatch.results[i].playerId;
			resultArrForCheckPending.push(checkPendingMatch.results[i].result);
			if (checkPendingMatch.results[i].result == "win") {
				winPlayerId = playerId;
			}
		}
		if (resultArrForCheckPending.includes("pending") == false) {
			await MatchResultHelper.updateWinnerUser(matchResultId, winPlayerId);
		}
		let matchForResult = await MatchResultHelper.findMatchResultByIdWithDel(
			matchResultId
		);
		let matchDataObj = {
			isDeleted: matchForResult.isDeleted,
			deletedAt: matchForResult.deletedAt,
			winner: matchForResult.winner,
			results: matchForResult.results,
			_id: matchForResult._id,
			matchId: matchForResult.matchId,
			matchName: matchForResult.matchName,
			gameToPlay: matchForResult.gameToPlay.gameName,
			createdAt: matchForResult.createdAt,
			updatedAt: matchForResult.updatedAt,
		};
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.matchData = matchDataObj;
		return res.status(response.code).json(response);
	}
};
exports.deleteMatchResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId;
	let notResultId = [];
	let deletedResultId = [];
	let pendingResultId = [];
	let resultIdArr = request.resultId;
	for (let i = 0; i < resultIdArr.length; i++) {
		resultId = resultIdArr[i];
		let matchResultDetailById =
			await MatchResultHelper.findMatchResultByIdWithoutPopulate(resultId);
		console.log("match result : ", matchResultDetailById);
		if (matchResultDetailById == null) {
			notResultId.push(resultId);
		}
		if (matchResultDetailById != null) {
			let checkPendingResultExist =
				await MatchResultHelper.checkPendingResultExist(resultId);
			if (checkPendingResultExist != null) {
				pendingResultId.push(resultIdArr);
			} else {
				for (let j = 0; j < matchResultDetailById.results.length; j++) {
					let playerId = matchResultDetailById.results[j].playerId;
					let resultFilePath = matchResultDetailById.results[j].resultVideo;
					fs.unlinkSync(resultFilePath);
					await MatchResultHelper.updateVideoFileLink(resultId, playerId);
				}
				await MatchResultHelper.deleteMatchResultById(resultId);
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
////////////// Auto Cancel / Expires Match Invitation ////////////////////////
cron.schedule("*/30 * * * *", () => {
	this.matchAutoExpire();
});
exports.matchAutoExpire = async (req, res) => {
	let deleteMatchNumber = 0;
	let pendingMatchList = await MatchHelper.findPendingMatches();
	for (let i = 0; i < pendingMatchList.length; i++) {
		let matchId = pendingMatchList[i]._id;
		let matchDetail = await MatchHelper.findMatchInvitationByIdWithPopulate(
			matchId
		);
		let challengeById = matchDetail.challengeBy._id; //for update credit if cancel
		let challengeByData = await UserHelper.foundUserById(challengeById);
		let challengeByCredits = challengeByData.userDetail.credits; //challengeBy credit to check prize pool updating
		let prize = matchDetail.prize;
		let prizeDeduction = (prize / 2).toFixed(2);
		let challengeByUpdatedCredit =
			parseFloat(challengeByCredits) + parseFloat(prizeDeduction);
		let matchCreatedDateTime = pendingMatchList[i].createdAt;
		//TODO : For 24 HOURS EXPIRED
		let hourDurration = moment(
			matchCreatedDateTime,
			"yyyy-MM-dd hh:mm:ss a"
		).fromNow();
		if (hourDurration.includes("a day") == true) {
			await UserHelper.updateCredit(challengeById, challengeByUpdatedCredit);
			await MatchHelper.matchInvitationResponse(matchId, "expired");
			let challengeToData = await MatchHelper.checkChallengeTo(matchId);
			if (challengeToData.challengeTo == null) {
				await MatchHelper.deletePermanentPublicMatch(matchId);
			}
			deleteMatchNumber++;
		}
	}
	console.log(deleteMatchNumber + " Auto Match Expired!!!!!!!");
};
////////////////User with in match controller (user in admin controller) ////////////////////////////
exports.matchDataByUserId = async (userId) => {
	let resultArr = [];
	let totalLossMatch = 0;
	let totalWinMatch = 0;
	// let userWinMatches = await MatchHelper.findUserWinMatchesWithPopulate(userId)
	let matchData = await MatchHelper.findMyMatches(userId);
	let userTotalMatches = matchData.length;
	for (let i = 0; i < matchData.length; i++) {
		if (matchData[i].winningUser != null) {
			if (userId.toString() == matchData[i].winningUser._id.toString()) {
				resultArr.push("W");
				totalWinMatch++;
			} else {
				resultArr.push("L");
				totalLossMatch++;
			}
		}
	}
	let reverserResultArr = resultArr.reverse();
	let userTotalWinMatches = totalWinMatch;
	let totalWinAndLoss;
	if (userTotalWinMatches + totalLossMatch > 0) {
		totalWinAndLoss = userTotalWinMatches + totalLossMatch;
	} else {
		totalWinAndLoss = 1;
	}
	let winPercentage = (userTotalWinMatches / totalWinAndLoss) * 100;
	let matchDataObj = {
		matches: userTotalMatches,
		win: userTotalWinMatches,
		loss: totalLossMatch,
		winPercentage: winPercentage.toFixed(0) + "%",
		recentResult: reverserResultArr,
	};
	return matchDataObj;
};
//use in public match , response of Match Invitation Response (responseMatchInvitation)
exports.publicMatchesData = async (matchData) => {
	let matchFinalArr = [];
	if (matchData.length > 0) {
		for (let i = 0; i < matchData.length; i++) {
			let matchObj = {
				_id: matchData[i]._id,
				matchName: matchData[i].matchName,
				gameToPlay: matchData[i].gameToPlay.gameName,
				platform: matchData[i].platform,
				matchRules: matchData[i].matchRules,
				challengeBy: {
					_id: matchData[i].challengeBy._id,
					userName: matchData[i].challengeBy.userDetail.userName,
				},
				challengeTo: {
					_id: "",
					userName: "",
				},
				prize: matchData[i].prize,
				status: matchData[i].status,
				startDate: moment(matchData[i].startingDateAndTime).format(
					"MMM DD yyyy"
				),
				startTime: moment(matchData[i].startingDateAndTime).format("hh:mm A"),
				matchTitleImage: matchData[i].matchTitleImage,
			};
			matchFinalArr.push(matchObj);
		}
	}
	return matchFinalArr;
};
