const fs = require("fs");
const moment = require("moment");
const mongoose = require("mongoose");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
// Controller
const TeamController = require("../Controllers/TeamController");
const FranchiseController = require("../Controllers/FranchiseController");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const UserHelper = require("../Services/UserHelper");
const LeagueHelper = require("../Services/LeagueHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const TeamHelper = require("../Services/TeamHelper");
const LeagueScheduleHelper = require("../Services/LeagueScheduleHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const LeagueResultHelper = require("../Services/LeagueResultHelper");
const GameHelper = require("../Services/GameHelper");
const TournamentAndLeagueHelper = require("../Services/TournamentAndLeagueHelper");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");

// const { use } = require("express/lib/router");
// const { leagueDetailData } = require("./LeagueController");
// const {
// 	getPreviousRoundWinnerList,
// } = require("../Services/LeagueScheduleHelper");
// const { matchDataByUserId } = require("./MatchController");

// const TournamentResultHelper = require("../Services/TournamentResultHelper");

// const MatchController = require("../Controllers/MatchController");
///
exports.createLeague = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueTeamArr = [];
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
	if (userId != null) {
		if (
			!request.leagueName ||
			!request.prize ||
			!request.totalTeams ||
			!request.teamSize ||
			!request.startingDate ||
			!request.endingDate ||
			!request.gameToPlay
		) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let startDate = moment(request.startingDate)
			.utc()
			.format("MMM DD YYYY hh:mm a");
		let endDate = moment(request.endingDate)
			.utc()
			.format("MMM DD YYYY hh:mm a");
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
		let currentYear = moment().format("yyyy");
		let startingYear = moment(request.startingDate).format("yyyy");
		if (currentYear.toString() != startingYear.toString()) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_STARTING_DATE
			);
			return res.status(response.code).json(response);
		}
		let leagueForGameCheck =
			await LeagueHelper.findLeagueByGameIdAndStartingDate(request.gameToPlay);
		let leagueNewStartingDate = moment(request.startingDate).format(
			"yyyy-MM-DD"
		);
		let momentLeagueNewStartingDate = moment(leagueNewStartingDate);
		let leagueNewEndingDate = moment(request.endingDate).format("yyyy-MM-DD");
		let momentLeagueNewEndingDate = moment(leagueNewEndingDate);
		let duration = moment.duration(
			momentLeagueNewEndingDate.diff(momentLeagueNewStartingDate)
		);
		let days = duration.asDays();
		if (days < 1) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_ENDING_DATE
			);
			return res.status(response.code).json(response);
		}
		if (leagueForGameCheck.length > 0) {
			for (let i = 0; i < leagueForGameCheck.length; i++) {
				let previousLeagueStartingDate = moment(
					leagueForGameCheck[i].startingDate
				).format("yyyy");
				if (previousLeagueStartingDate.toString() == currentYear) {
					fs.unlinkSync(imagePath);
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.LEAGUE_FOR_THIS_YEAR_ALREADY_EXIST
					);
					return res.status(response.code).json(response);
				}
			}
		} else {
			let leagueNameCheck = await LeagueHelper.findLeagueByNameWithoutDelete(
				request.leagueName.toLowerCase().trim()
			);
			if (leagueNameCheck != null) {
				fs.unlinkSync(imagePath);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NAME_ALREADY_EXIST
				);
				return res.status(response.code).json(response);
			}
			if (leagueNameCheck == null) {
				let newLeagueId = await LeagueHelper.createLeague(
					request,
					imagePath,
					startDate,
					endDate
				);
				let leagueObj = await this.leagueObjDataWithoutTeams(newLeagueId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.leagueData = leagueObj;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.getAllLeagues = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let leagueArr = [];
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
		let leagueResult;
		let pageNo;
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!request.pageNo) {
			pageNo = 1;
		}
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role != "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.AUTHENTICATION_FAILED
			);
			return res.status(response.code).json(response);
		} else {
			if (req.query.query) {
				leagueResult = await LeagueHelper.searchLeagueByNameWithPagination(
					req.query.query.toLowerCase(),
					pageNo
				);
			}
			if (!req.query.query) {
				leagueResult = await LeagueHelper.allLeaguesWithPagination(pageNo);
			}
			console.log("league result : ", leagueResult);
			if (leagueResult.data.length > 0) {
				for (let i = 0; i < leagueResult.data.length; i++) {
					let gameDetail = await GameHelper.findGameByIdWithDelete(
						leagueResult.data[i].gameToPlay
					);
					if (gameDetail != null) {
						let gameName = gameDetail?.gameName;
						let leagueStartingDate = moment(
							leagueResult.data[i].startingDate
						).format("MMM DD, yyyy");
						let leagueEndingDate = moment(
							leagueResult.data[i].endingDate
						).format("MMM DD, yyyy");
						let leagueYear = moment(leagueResult.data[i].createdAt).format(
							"yyyy"
						);
						let leagueObj = {
							_id: leagueResult.data[i]._id,
							entryFee: leagueResult.data[i].entryFee,
							isDeleted: leagueResult.data[i].isDeleted,
							deletedAt: leagueResult.data[i].deletedAt,
							leagueName: leagueResult.data[i].leagueName,
							gameToPlay: {
								_id: leagueResult.data[i].gameToPlay,
								gameName: gameName,
							},
							teamSize: leagueResult.data[i].teamSize,
							totalTeams: leagueResult.data[i].totalTeams,
							prize: leagueResult.data[i].prize,
							startingDate: leagueResult.data[i].startingDate,
							endingDate: leagueResult.data[i].endingDate,
							leagueTitleImage: leagueResult.data[i].leagueTitleImage,
							year: leagueYear,
							registeredTeams: leagueResult.data[i].participatingTeams.length,
						};
						leagueArr.push(leagueObj);
					}
				}
			}
			let pagination = leagueResult.pagination;
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.leagueData = { ...pagination, data: leagueArr };
			return res.status(response.code).json(response);
		}
	}
};
exports.editLeague = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let imagePath;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(request._id);
		imagePath = leagueDetail.leagueTitleImage;
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
			if (req.file) {
				fs.unlinkSync(imagePath);
			}
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
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
		let leagueId = request._id;
		let leagueDetail = await LeagueHelper.findLeagueByIdWithDeleteWithPopulate(
			leagueId
		);

		let leagueRegisteredTeams = leagueDetail.participatingTeams.length;
		if (leagueRegisteredTeams > 0) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.CAN_NOT_UPDATE
			);
			return res.status(response.code).json(response);
		} else {
			if (request.totalTeams) {
				let totalTeamsArr = ["4", "8", "16", "32"];
				let teamCountResult = totalTeamsArr.includes(
					request.totalTeams.toString()
				);
				if (teamCountResult == false) {
					if (req.file) {
						fs.unlinkSync(imagePath);
					}
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TOTAL_TEAMS_ERROR
					);
					return res.status(response.code).json(response);
				}
			}
			if (request.leagueName) {
				let leagueNameCheck = await LeagueHelper.findLeagueByNameWithoutDelete(
					request.leagueName.toLowerCase().trim()
				);
				if (leagueNameCheck != null) {
					if (
						leagueNameCheck.leagueName !=
						request.leagueName.toLowerCase().trim()
					) {
						if (req.file) {
							fs.unlinkSync(imagePath);
						}
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.NAME_ALREADY_EXIST
						);
						return res.status(response.code).json(response);
					}
				}
			}
			await LeagueHelper.updateLeagueDetail(leagueId, request, imagePath);
			let leagueObj = await this.leagueObjDataWithoutTeams(request._id);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.leagueData = leagueObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.showAllLeagues = async (req, res) => {
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
		let leagueObjArr = [];
		let allLeague = await LeagueHelper.allLeaguesWithoutDelete();
		for (let i = 0; i < allLeague.length; i++) {
			let leagueStartingDate = moment(allLeague[i].startingDate).format(
				"MMM DD yyyy"
			);
			let leagueEndingDate = moment(allLeague[i].endingDate).format(
				"MMM DD yyyy"
			);
			let leagueYear = moment(allLeague[i].createdAt).format("yyyy");
			let leagueObj = {
				_id: allLeague[i]._id,
				leagueTitleImage: allLeague[i].leagueTitleImage,
				startingDate: leagueStartingDate,
				endingDate: leagueEndingDate,
				leagueName: allLeague[i].leagueName,
				prize: allLeague[i].prize,
				totalTeams: allLeague[i].totalTeams,
				registeredTeams: allLeague[i].participatingTeams.length,
				entryFee: allLeague[i].entryFee,
				year: leagueYear,
				teamSize: allLeague[i].teamSize,
			};
			leagueObjArr.push(leagueObj);
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.leagueData = leagueObjArr;
		return res.status(response.code).json(response);
	}
};
exports.joinLeague = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueTeamSizeRequired;
	let totalTeamLimit;
	let teamSizeOfUser;
	let finalCredit;
	let leagueFinalObj = {};
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
		if (!request.teamId && !request.leagueId) {
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
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
				request.leagueId
			);
		if (leagueDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEAGUE_DOES_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		} else {
			leagueTeamSizeRequired = leagueDetail.teamSize;
		}
		let leagueTeamExist = await LeagueHelper.findTeamInLeague(
			request.leagueId,
			request.teamId
		);
		if (leagueTeamExist != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_EXIST
			);
			return res.status(response.code).json(response);
		}
		teamSizeOfUser = teamDetail.teamMembers.length;
		if (leagueTeamSizeRequired != teamSizeOfUser) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_SIZE_NOT_MATCH
			);
			return res.status(response.code).json(response);
		}
		totalTeamLimit = leagueDetail.participatingTeams.length;
		leagueTeamSizeRequired = leagueDetail.totalTeams;
		if (totalTeamLimit == leagueTeamSizeRequired) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_SIZE_EXCEED
			);
			return res.status(response.code).json(response);
		}
		let userData = await UserHelper.foundUserById(userId);
		let userCredit = userData.userDetail.credits;
		let leagueEntryFee = leagueDetail.entryFee;
		let finalCredit = 0;
		if (userCredit < leagueEntryFee) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_ENOUGH_CREDIT
			);
			return res.status(response.code).json(response);
		} else {
			finalCredit = userCredit - leagueEntryFee;
		}
		let leagueParticipatingTeams = leagueDetail.participatingTeams;
		let franchiseDetail = await FranchiseHelper.findFranchiseIdByTeamId(
			request.teamId
		);
		if (franchiseDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_FRANCHISE_TEAM
			);
			return res.status(response.code).json(response);
		} else {
			let userFranchiseTeams = franchiseDetail.franchiseTeams;
			const intersection = leagueParticipatingTeams.filter((element) =>
				userFranchiseTeams.includes(element)
			);
			if (intersection.length > 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.FRANCHISE_PARTICIPATING
				);
				return res.status(response.code).json(response);
			}
			if (intersection.length == 0) {
				console.log("not participating");
				let leagueId = request.leagueId;
				let gameToPlay = leagueDetail.gameToPlay;
				await LeagueHelper.addTeam(leagueDetail, request.teamId);
				let participatingInLeagueCheck =
					await TeamHelper.findAlreadyParticipatingInLeague(
						request.teamId,
						leagueId
					);
				if (participatingInLeagueCheck == null) {
					await TeamHelper.updateLeagueDetail(request.teamId, leagueId);
				}
				let participatingGameCheck =
					await TeamHelper.findAlreadyParticipatingInGame(
						request.teamId,
						gameToPlay._id
					);
				if (participatingGameCheck == null) {
					await TeamHelper.updateTournamentGameDetail(
						request.teamId,
						gameToPlay._id
					);
				}
				await UserHelper.updateCredit(userId, finalCredit);
				let teamArr = [];
				let leagueJoinedStatus = await this.userLeagueJoinedStatus(
					userId,
					request.leagueId
				);
				let leagueObj = await this.leagueObjDataWithoutTeams(request.leagueId);
				for (let i = 0; i < leagueObj.participatingTeams.length; i++) {
					let teamId = leagueObj.participatingTeams[i];
					let teamObj = await TeamController.getLeagueTeamData(teamId);
					teamArr.push(teamObj);
				}
				leagueFinalObj = {
					_id: leagueObj._id,
					leagueTitleImage: leagueObj.leagueTitleImage,
					startingDate: leagueObj.startingDate,
					endingDate: leagueObj.endingDate,
					leagueName: leagueObj.leagueName,
					hostedBy: leagueObj.hostedBy,
					gameToPlay: leagueObj.gameToPlay,
					prize: leagueObj.prize,
					teamSize: leagueObj.teamSize,
					entryFee: leagueObj.entryFee,
					registered: leagueObj.registered,
					totalTeams: leagueObj.totalTeams,
					participatingTeams: teamArr,
					leagueJoined: leagueJoinedStatus.leagueJoined,
					teamId: leagueJoinedStatus.teamId,
					franchiseId: leagueJoinedStatus.franchiseId,
				};
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.leagueData = leagueFinalObj;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.getLeagueById = async (req, res) => {
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
		let leagueJoinedStatus = await this.userLeagueJoinedStatus(
			userId,
			request.leagueId
		);
		let teamArr = [];
		let leagueObj = await this.leagueObjDataWithoutTeams(request.leagueId);
		for (let i = 0; i < leagueObj.participatingTeams.length; i++) {
			let teamId = leagueObj.participatingTeams[i];
			let teamObj = await TeamController.getLeagueTeamData(teamId);
			teamArr.push(teamObj);
		}
		let leagueStartDate = moment(leagueObj.startingDate).format("MMM DD yyyy");
		let leagueEndDate = moment(leagueObj.endingDate).format("MMM DD yyyy");
		let leagueFinalObj = {
			_id: leagueObj._id,
			leagueTitleImage: leagueObj.leagueTitleImage,
			startingDate: leagueStartDate,
			endingDate: leagueEndDate,
			leagueName: leagueObj.leagueName,
			hostedBy: leagueObj.hostedBy,
			gameToPlay: leagueObj.gameToPlay,
			prize: leagueObj.prize,
			teamSize: leagueObj.teamSize,
			entryFee: leagueObj.entryFee,
			registered: leagueObj.registered,
			totalTeams: leagueObj.totalTeams,
			leagueJoined: leagueJoinedStatus.leagueJoined,
			teamId: leagueJoinedStatus.teamId,
			franchiseId: leagueJoinedStatus.franchiseId,
			participatingTeams: teamArr,
		};
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.leagueData = leagueFinalObj;
		return res.status(response.code).json(response);
	}
};
exports.deleteLeague = async (req, res) => {
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
		let deletedLeagueId = [];
		let notDeletedLeagueId = [];
		let userData = await UserHelper.foundUserById(userId);
		let userRole = userData.role;
		if (userRole != "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.AUTHENTICATION_FAILED
			);
			return res.status(response.code).json(response);
		} else {
			for (let i = 0; i < request.leagueId.length; i++) {
				let leagueId = request.leagueId[i];
				let leagueDetail =
					await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
				let momentDate = moment();
				let leagueEndDate = moment(leagueDetail.endingDate).format(
					"yyyy-MM-DD"
				);
				let momentLeagueEndDate = moment(leagueEndDate);
				let duration = moment.duration(momentLeagueEndDate.diff(momentDate));
				let days = duration.asDays();
				if (days < 1 && leagueDetail.winningTeam != null) {
					deletedLeagueId.push(leagueId);
				} else if (leagueDetail.participatingTeams.length == 0) {
					deletedLeagueId.push(leagueId);
				} else {
					notDeletedLeagueId.push(leagueId);
				}
			}
			if (notDeletedLeagueId.length > 0) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.SOME_LEAGUE_HAVE_PENDING_RESULT
				);
				return res.status(response.code).json(response);
			}
			if (deletedLeagueId.length > 0) {
				for (let i = 0; i < deletedLeagueId.length; i++) {
					let leagueId = deletedLeagueId[i];
					await LeagueHelper.deleteLeague(leagueId);
				}
			} else {
				deletedLeagueId = [];
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.leagueId = deletedLeagueId;
		return res.status(response.code).json(response);
	}
};
exports.leagueSchedule = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let totalRequiredTeams;
	let franchiseId;
	let roundNumber = 1;
	let totalTeams;
	let scheduleType;
	let leagueId = request.leagueId;
	let teamArr = [];
	let participatingTeamArr = [];
	let allKillPoints = 0;
	let finalTeamArrWithAddKillPoints = [];
	let sortedTeamArrWithKillPoints = [];
	let previousRoundWinnerTeamsArr;
	let leagueRound = 1;
	let pageNo;
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
		// if (!request.pageNo) {
		//     pageNo = 1
		// }
		// if (request.pageNo) {
		//     pageNo = request.pageNo
		// }
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
		totalTeams = leagueDetail.participatingTeams.length;
		totalRequiredTeams = leagueDetail.totalTeams;
		participatingTeamArr = leagueDetail.participatingTeams;
		if (totalTeams < totalRequiredTeams) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEAGUE_SLOTS_EMPTY
			);
			response.leagueScheduleData = [];
			return res.status(response.code).json(response);
		} else {
			let leagueStartingDate = leagueDetail.startingDate;
			let startDate = moment(leagueStartingDate).format("MMM DD YYYY");
			let nowDate = moment().format("MMM DD YYYY");
			let dateCheckResult = moment(startDate).isSameOrBefore(nowDate, "day");
			if (dateCheckResult == false) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.LEAGUE_START_DATE_WAIT
				);
				response.leagueScheduleData = [];
				return res.status(response.code).json(response);
			} else {
				let alreadyScheduleCheck =
					await LeagueScheduleHelper.findLeagueScheduleByLeagueId(leagueId);
				if (alreadyScheduleCheck.length == 0) {
					scheduleType = "round";
					let shuffledParticipatingTeamArr =
						TournamentAndLeagueHelper.shuffle(participatingTeamArr);
					console.log("1##");
					await this.generateLeagueSchedule(
						totalTeams,
						shuffledParticipatingTeamArr,
						roundNumber,
						leagueId,
						scheduleType
					);
					let leagueMatchScheduleDetail = await this.leagueScheduleData(
						request.leagueId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.leagueScheduleData = leagueMatchScheduleDetail;
					response.message = Message.CHECK_NEW_SCHEDULE;
					return res.status(response.code).json(response);
				}
				if (alreadyScheduleCheck.length > 0) {
					let leagueDetailForMaxRoundNumber =
						await LeagueScheduleHelper.getLeagueDetailForMaxRoundNumber(
							leagueId
						);
					let maxRoundNumber = leagueDetailForMaxRoundNumber[0].roundNumber;
					let checkAlreadyLeagueScheduleResult =
						await LeagueResultHelper.checkAlreadyLeagueScheduleResult(leagueId);
					if (checkAlreadyLeagueScheduleResult.length == 0) {
						console.log("pending 4");
						let leagueMatchScheduleDetail = await this.leagueScheduleData(
							request.leagueId
						);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.leagueScheduleData = leagueMatchScheduleDetail;
						response.message = Message.PENDING_LEAGUE_RESULTS;
						return res.status(response.code).json(response);
					}
					if (checkAlreadyLeagueScheduleResult.length > 0) {
						let checkAlreadyLeagueSchedulePendingResult =
							await LeagueResultHelper.checkAlreadyLeagueSchedulePendingResult(
								leagueId,
								maxRoundNumber
							);
						if (checkAlreadyLeagueSchedulePendingResult.length > 0) {
							console.log("pending 3");
							let leagueMatchScheduleDetail = await this.leagueScheduleData(
								request.leagueId
							);
							response = ResponseHelper.setResponse(
								ResponseCode.SUCCESS,
								Message.REQUEST_SUCCESSFUL
							);
							response.leagueScheduleData = leagueMatchScheduleDetail;
							response.message = Message.PENDING_LEAGUE_RESULTS;
							return res.status(response.code).json(response);
						}
					}
					let checkLeagueCompleteAndWinnerByRound =
						await LeagueScheduleHelper.checkAlreadyLeagueSchedule(
							leagueId,
							maxRoundNumber
						);
					if (checkLeagueCompleteAndWinnerByRound.length > 0) {
						console.log("pending 2");
						let leagueMatchScheduleDetail = await this.leagueScheduleData(
							request.leagueId
						);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.leagueScheduleData = leagueMatchScheduleDetail;
						response.message = Message.PENDING_LEAGUE_RESULTS;
						return res.status(response.code).json(response);
					}
					if (checkLeagueCompleteAndWinnerByRound.length == 0) {
						let checkAlreadyLeagueSchedulePendingResult =
							await LeagueResultHelper.checkAlreadyLeagueSchedulePendingResult(
								leagueId,
								maxRoundNumber
							);
						if (checkAlreadyLeagueSchedulePendingResult.length > 0) {
							console.log("pending 2.1");
							let leagueMatchScheduleDetail = await this.leagueScheduleData(
								request.leagueId
							);
							response = ResponseHelper.setResponse(
								ResponseCode.SUCCESS,
								Message.REQUEST_SUCCESSFUL
							);
							response.leagueScheduleData = leagueMatchScheduleDetail;
							response.message = Message.PENDING_LEAGUE_RESULTS;
							return res.status(response.code).json(response);
						} else {
							console.log("all done");
							if (totalTeams == 4 && maxRoundNumber == 1) {
								let firstRoundFourTeamsArr =
									await LeagueResultHelper.getPreviousRoundFourTeamList(
										leagueId,
										maxRoundNumber
									);
								console.log("first Round 4 teams : ", firstRoundFourTeamsArr);
								previousRoundWinnerTeamsArr = firstRoundFourTeamsArr;
							} else {
								previousRoundWinnerTeamsArr =
									await LeagueResultHelper.getPreviousRoundWinnerList(
										leagueId,
										maxRoundNumber
									);
							}
							if (
								previousRoundWinnerTeamsArr.length == 32 ||
								previousRoundWinnerTeamsArr.length == 16 ||
								previousRoundWinnerTeamsArr.length == 8 ||
								previousRoundWinnerTeamsArr.length == 4 ||
								previousRoundWinnerTeamsArr.length == 2 ||
								previousRoundWinnerTeamsArr.length == 1
							) {
								for (let l = 0; l < previousRoundWinnerTeamsArr.length; l++) {
									let teamArrForAddAllKillPoints =
										await LeagueResultHelper.getWinnerTeamsWithKillPoint(
											previousRoundWinnerTeamsArr[l].teamId,
											leagueId,
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
								console.log(
									"final TeamArr with add kill points : ",
									finalTeamArrWithAddKillPoints
								);
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
								if (previousRoundWinnerTeamsArr.length > 4) {
									scheduleType = "round";
									let totalTeams = teamArr.length;
									let roundNumber = parseInt(maxRoundNumber) + 1;
									await this.generateLeagueSchedule(
										totalTeams,
										teamArr,
										roundNumber,
										leagueId,
										scheduleType
									);
									let leagueMatchScheduleDetail = await this.leagueScheduleData(
										request.leagueId
									);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.leagueScheduleData = leagueMatchScheduleDetail;
									response.message = Message.CHECK_NEW_SCHEDULE;
									return res.status(response.code).json(response);
								}
								if (previousRoundWinnerTeamsArr.length == 4) {
									console.log("4 schedule");
									let leagueMatchScheduleDetail = await this.scheduleForFourTeams(
										teamArr,
										maxRoundNumber,
										leagueId
									);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.leagueScheduleData = leagueMatchScheduleDetail;
									response.message = Message.CHECK_NEW_SCHEDULE;
									return res.status(response.code).json(response);
								}
								if (previousRoundWinnerTeamsArr.length == 2) {
									console.log("2 schedule");
									let leagueMatchScheduleDetail = await this.scheduleForTwoTeams(
										maxRoundNumber,
										leagueId
									);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.leagueScheduleData = leagueMatchScheduleDetail;
									response.message = Message.CHECK_NEW_SCHEDULE;
									return res.status(response.code).json(response);
								}
								if (previousRoundWinnerTeamsArr.length == 1) {
									let checkLeagueFinalExist =
										await LeagueScheduleHelper.checkLeagueFinalExist(leagueId);
									if (checkLeagueFinalExist == null) {
										console.log("1 schedule");
										let leagueMatchScheduleDetail = await this.scheduleForOneTeam(
											maxRoundNumber,
											previousRoundWinnerTeamsArr,
											leagueId
										);
										response = ResponseHelper.setResponse(
											ResponseCode.SUCCESS,
											Message.REQUEST_SUCCESSFUL
										);
										response.leagueScheduleData = leagueMatchScheduleDetail;
										response.message = Message.CHECK_NEW_SCHEDULE;
										return res.status(response.code).json(response);
									}
									if (checkLeagueFinalExist != null) {
										let winnigTeamId = checkLeagueFinalExist.winner;
										let leagueDetails =
											await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
												request.leagueId
											);
										if (leagueDetails.winningTeam == null) {
											await LeagueHelper.updateWinnerTeam(
												request.leagueId,
												winnigTeamId
											);
										}
										let winningTeamName =
											await TournamentAndLeagueHelper.getTeamName(winnigTeamId);
										console.log("no schedule required");
										let leagueMatchScheduleDetail = await this.leagueScheduleData(
											request.leagueId
										);
										response = ResponseHelper.setResponse(
											ResponseCode.SUCCESS,
											Message.REQUEST_SUCCESSFUL
										);
										response.leagueScheduleData = leagueMatchScheduleDetail;
										response.message =
											"WooHoo Congratulation! " +
											winningTeamName +
											" has won this league.";
										return res.status(response.code).json(response);
									}
								}
							} else {
								console.log("else pending");
								let leagueMatchScheduleDetail = await this.leagueScheduleData(
									request.leagueId
								);
								response = ResponseHelper.setResponse(
									ResponseCode.SUCCESS,
									Message.REQUEST_SUCCESSFUL
								);
								response.leagueScheduleData = leagueMatchScheduleDetail;
								response.message = Message.PENDING_LEAGUE_RESULTS;
								return res.status(response.code).json(response);
							}
						}
					}
				}
			}
		}
	}
};
exports.submitLeagueMatchResult = async (req, res) => {
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
		let franchiseTeamId;
		let gameName;
		if ((!request.leagueId, !request.score, !request.matchId)) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		} else {
			let leagueId = request.leagueId;
			let userFranchiseTeamDetail =
				await FranchiseController.getUserFranchiseTeam(userId);
			if (userFranchiseTeamDetail == null) {
				console.log("participating team detail not found");
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_PARTICIPATING
				);
				return res.status(response.code).json(response);
			} else {
				franchiseTeamId = userFranchiseTeamDetail._id;
			}
			let teamDetail = await TeamHelper.findTeamDeatilByTeamId(franchiseTeamId);
			let teamViewName = teamDetail.teamViewName;
			let leagueData =
				await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
			if (leagueData != null) {
				gameName = leagueData.gameToPlay.gameName;
			}
			let matchId = request.matchId;
			let score = request.score;
			let roundNumber;
			let scheduleType;
			let leagueRecordByMatchIdAndLeagueId =
				await LeagueScheduleHelper.findLeagueByMatchIdAndLeagueId(
					leagueId,
					matchId
				);

			if (leagueRecordByMatchIdAndLeagueId != null) {
				roundNumber = leagueRecordByMatchIdAndLeagueId.roundNumber;
				scheduleType = leagueRecordByMatchIdAndLeagueId.scheduleType;
			} else {
				console.log("league schedule detail not found by match Id");
			}
			// console.log("team id : ", franchiseTeamId)
			let validateMatchId = await LeagueScheduleHelper.checkTeamAndMatchId(
				franchiseTeamId,
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
				await LeagueScheduleHelper.findTypeAndRoundNumber(matchId);
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
				// console.log("round number : ", roundNumber);
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
					let checkAlreadySubmitResult =
						await LeagueResultHelper.findAlreadySubmittedResult(
							franchiseTeamId,
							matchId
						);
					if (checkAlreadySubmitResult != null) {
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.ALREADY_SUBMITTED
						);
						return res.status(response.code).json(response);
					} else {
						let leagueDetail =
							await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
								leagueId
							);
						let leagueName = leagueDetail.leagueName;
						await LeagueResultHelper.addLeagueResult(
							userId,
							leagueId,
							leagueName,
							franchiseTeamId,
							roundNumber,
							score,
							scheduleType,
							matchId,
							filePath,
							teamViewName,
							gameName
						);
						let leagueMatchScheduleDetail = await this.leagueScheduleData(
							request.leagueId
						);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.leagueScheduleData = leagueMatchScheduleDetail;
						return res.status(response.code).json(response);
					}
				}
			}
		}
	}
};
exports.showLeagueResult = async (req, res) => {
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
		let leagueIdArr = [];
		let franchiseLeagueResult;
		if (req.query.query) {
			franchiseLeagueResult =
				await LeagueResultHelper.findLeagueResultWithLeagueNameOrMatchIdWithPagination(
					req.query.query.toLowerCase(),
					pageNo
				);
		}
		if (!req.query.query) {
			franchiseLeagueResult =
				await LeagueResultHelper.findAllLeagueResultsWithOutDeleteWithPagination(
					pageNo
				);
		}
		let leagueResultData = await this.leagueResultData(franchiseLeagueResult);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.leagueResultData = leagueResultData;
		return res.status(response.code).json(response);
	}
};
exports.updateLeagueMatchResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let playerKillPoints = request.playerKillPoints;
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
		// let pageNo
		// if (request.pageNo) {
		//     pageNo = request.pageNo
		// }
		// if (!request.pageNo) {
		//     pageNo = 1
		// }
		let resultId = request.resultId;
		let resultStatus = request.resultStatus;
		let killPoints = 0;
		let placePoints = parseInt(process.env.PLACE_POINT);
		let checkLeagueResultExist =
			await LeagueResultHelper.findLeagueResultByResultId(resultId);
		let roundNumber;
		let scheduleType;
		let leagueIdForResult;
		if (checkLeagueResultExist == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (checkLeagueResultExist != null) {
			let matchId = checkLeagueResultExist.matchId;
			let teamId = checkLeagueResultExist.teamId;
			scheduleType = checkLeagueResultExist.scheduleType;
			roundNumber = checkLeagueResultExist.roundNumber;
			leagueIdForResult = checkLeagueResultExist.leagueId;
			let checkAllResultSubmittedWithMatchId =
				await LeagueResultHelper.checkAllResultSubmittedWithMatchId(matchId)
			if (checkAllResultSubmittedWithMatchId.length < 2) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.PENDING_RESULT_SUBMISSION_BY_OPPONENT
				);
				return res.status(response.code).json(response);
			}
			if (resultStatus == "loss") {
				let checkAlreadyHaveResultStatus =
					await LeagueResultHelper.findAlreadyWinLossOfMatchId(
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
						await LeagueResultHelper.checkAlreadyPlayerResults(
							request.resultId
						);
					if (checkAlreadyPlayerResults.playerResults.length == 0) {
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await LeagueResultHelper.updateLeagueMatchResultPlayerPoints(
								request.resultId,
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
							await LeagueResultHelper.addPlayerLeaguePoints(
								playerId,
								userKillPoints,
								leagueIdForResult,
								scheduleType,
								roundNumber
							);
						}
					} else {
						///subtract points if loss
						let playerResults = checkLeagueResultExist.playerResults;
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
						await LeagueResultHelper.setPlayerResultArrEmpty(request.resultId);
						//add new player results
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await LeagueResultHelper.updateLeagueMatchResultPlayerPoints(
								request.resultId,
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
							await LeagueResultHelper.deletePlayerLeaguePoints(
								playerId,
								leagueIdForResult,
								scheduleType,
								roundNumber
							);
							await LeagueResultHelper.addPlayerLeaguePoints(
								playerId,
								userKillPoints,
								leagueIdForResult,
								scheduleType,
								roundNumber
							);
						}
					}
					await LeagueResultHelper.updateLeagueMatchResult(
						resultId,
						resultStatus,
						killPoints,
						placePoints
					);
				}
			}
			if (resultStatus == "win") {
				let checkAlreadyHaveResultStatus =
					await LeagueResultHelper.findAlreadyWinLossOfMatchId(
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
						await LeagueResultHelper.checkAlreadyPlayerResults(
							request.resultId
						);
					if (checkAlreadyPlayerResults.playerResults.length == 0) {
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await LeagueResultHelper.updateLeagueMatchResultPlayerPoints(
								request.resultId,
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
							await LeagueResultHelper.addPlayerLeaguePoints(
								playerId,
								userKillPoints,
								leagueIdForResult,
								scheduleType,
								roundNumber
							);
						}
					} else {
						///subtract points if loss
						let playerResults = checkLeagueResultExist.playerResults;
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
								await LeagueResultHelper.deletePlayerLeaguePoints(
									playerId,
									leagueIdForResult,
									scheduleType,
									roundNumber
								);
							}
						}
						//empty arr player results
						await LeagueResultHelper.setPlayerResultArrEmpty(request.resultId);
						//add new player results
						for (let i = 0; i < playerKillPoints.length; i++) {
							let playerId = playerKillPoints[i].userId;
							let userKillPoints = playerKillPoints[i].killPoints;
							await LeagueResultHelper.updateLeagueMatchResultPlayerPoints(
								request.resultId,
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
							await LeagueResultHelper.addPlayerLeaguePoints(
								playerId,
								userKillPoints,
								leagueIdForResult,
								scheduleType,
								roundNumber
							);
						}
					}
					await LeagueResultHelper.updateLeagueMatchResult(
						resultId,
						resultStatus,
						killPoints,
						placePoints
					);
					await LeagueScheduleHelper.updateWinnerTeamByMatchId(matchId, teamId);
				}
			}
			let leagueId = checkLeagueResultExist.leagueId;
			let leagueDetail =
				await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
			let gameName = leagueDetail?.gameToPlay?.gameName;
			let franchiseLeagueResult =
				await LeagueResultHelper.findLeagueResultByResultId(resultId);
			let teamViewName = await TournamentAndLeagueHelper.getTeamName(
				franchiseLeagueResult.teamId
			);
			let teamMembersFinalArr = [];
			let teamData = await TeamHelper.findTeamDeatilByTeamId(
				franchiseLeagueResult.teamId
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
			let leagueResultObj = {
				result: franchiseLeagueResult.result,
				scheduleType: franchiseLeagueResult.scheduleType,
				total: parseInt(
					franchiseLeagueResult.killPoints +
					parseInt(franchiseLeagueResult.placePoints)
				),
				_id: franchiseLeagueResult._id,
				leagueId: franchiseLeagueResult.leagueId,
				leagueName: franchiseLeagueResult.leagueName,
				teamViewName: teamViewName,
				score: franchiseLeagueResult.score,
				roundNumber: franchiseLeagueResult.roundNumber,
				gameName: gameName,
				matchId: franchiseLeagueResult.matchId,
				resultVideo: franchiseLeagueResult.resultVideo,
				teamMembers: teamMembersFinalArr,
				playerResults: franchiseLeagueResult.playerResults,
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.leagueResultData = leagueResultObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.leagueStanding = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let leagueId = request.leagueId;
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
		let winCount = 0;
		let lossCount = 0;
		let totalCount = 0;
		let teamDetailArr = [];
		let sortedTeamDetailArr = [];
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
		let leagueParticipatingTeams = leagueDetail.participatingTeams;
		for (let i = 0; i < leagueParticipatingTeams.length; i++) {
			let teamName = await TournamentAndLeagueHelper.getTeamName(
				leagueParticipatingTeams[i]
			);
			let teamWinDetail = await LeagueResultHelper.findTeamWinDetail(
				leagueId,
				leagueParticipatingTeams[i]
			);
			if (teamWinDetail != null) {
				winCount = teamWinDetail.length;
			}
			let teamLossDetail = await LeagueResultHelper.findTeamLossDetail(
				leagueId,
				leagueParticipatingTeams[i]
			);
			if (teamLossDetail != null) {
				lossCount = teamLossDetail.length;
			}
			let winLossCount = winCount + lossCount;
			if (winLossCount == 0) {
				totalCount = 1;
			} else {
				totalCount = winLossCount;
			}
			let winPercentage = ((winCount / totalCount) * 100).toFixed(0);
			let teamDetailObj = {
				teamName: teamName,
				winCount: winCount,
				lossCount: lossCount,
				winPercentage: winPercentage,
			};
			teamDetailArr.push(teamDetailObj);
		}
		let leagueSortedStanding = teamDetailArr.sort(function (a, b) {
			return b.winPercentage - a.winPercentage;
		});
		for (let j = 0; j < leagueSortedStanding.length; j++) {
			let sortedTeamDetailObj = {
				standing: j + 1,
				teamName: leagueSortedStanding[j].teamName,
				winCount: leagueSortedStanding[j].winCount,
				lossCount: leagueSortedStanding[j].lossCount,
				winPercentage: leagueSortedStanding[j].winPercentage,
			};
			sortedTeamDetailArr.push(sortedTeamDetailObj);
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.standingData = sortedTeamDetailArr;
		return res.status(response.code).json(response);
	}
};
exports.leagueStats = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let leagueId = request.leagueId;
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
		let totalKillPoints;
		let totalPlacePoints;
		let resultArr = [];
		let finalStatArr = [];
		let sortedFinalArr = [];
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
		let participatingTeams = leagueDetail.participatingTeams;
		if (participatingTeams.length > 0) {
			for (let i = 0; i < participatingTeams.length; i++) {
				totalKillPoints = 0;
				totalPlacePoints = 0;
				let teamStatObj;
				resultArr = [];
				let teamId = participatingTeams[i];
				let teamName = await TournamentAndLeagueHelper.getTeamName(teamId);
				let teamDetailInLeague =
					await LeagueResultHelper.findTeamDetailInLeague(leagueId, teamId);
				if (teamDetailInLeague.length > 0) {
					for (let j = 0; j < teamDetailInLeague.length; j++) {
						let killPoints = teamDetailInLeague[j].killPoints;
						totalKillPoints = totalKillPoints + killPoints;
						let placePoints = teamDetailInLeague[j].placePoints;
						totalPlacePoints = totalPlacePoints + placePoints;
						if (teamDetailInLeague[j].result == "win") {
							resultArr.push("W");
						}
						if (teamDetailInLeague[j].result == "loss") {
							resultArr.push("L");
						}
					}
					let streakArr = resultArr;
					let streakResultArr = [];
					let streakResultArr2 = [];
					let streakResult;
					let arrFirstIndex;
					let win = 0;
					let loss = 0;
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
							if (
								largest < streakResultArr[i] ||
								largest == streakResultArr[i]
							) {
								largest = streakResultArr[i];
								streakResultArrIndex = i;
							}
						}
						streakResult =
							largest + "" + streakResultArr2[streakResultArrIndex];
					}
					teamStatObj = {
						teamName: teamName,
						matches: teamDetailInLeague.length,
						killPoints: totalKillPoints,
						placePoints: totalPlacePoints,
						totalPoints: parseInt(totalKillPoints) + parseInt(totalPlacePoints),
						streak: streakResult,
					};
				} else {
					teamStatObj = {
						teamName: teamName,
						matches: teamDetailInLeague.length,
						killPoints: "",
						placePoints: "",
						totalPoints: "",
						streak: "",
					};
				}
				finalStatArr.push(teamStatObj);
			}
		} else {
			finalStatArr = [];
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.statsData = finalStatArr;
		return res.status(response.code).json(response);
	}
};
exports.deleteLeagueResult = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId;
	let notResultId = [];
	let deletedResultId = [];
	let pendingResultId = [];
	let resultIdArr = request.resultId;
	for (let i = 0; i < resultIdArr.length; i++) {
		resultId = resultIdArr[i];
		let leagueResultDetailById =
			await LeagueResultHelper.findLeagueResultByResultId(resultId);
		if (leagueResultDetailById == null) {
			notResultId.push(resultId);
		}
		if (leagueResultDetailById != null) {
			let leagueId = leagueResultDetailById.leagueId;
			let leagueDetail =
				await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate();
			if (leagueDetail != null) {
				if (leagueResultDetailById.result == "pending") {
					pendingResultId.push(resultId);
				} else {
					let resultVideoPath = leagueResultDetailById.resultVideo;
					fs.unlinkSync(resultVideoPath);
					await LeagueResultHelper.deleteLeagueResultById(resultId);
					deletedResultId.push(resultId);
				}
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
///////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////// Use with in league controller ///////////////////////////////////////////////
exports.leagueDetailData = async (leagueId, userId) => {
	let leagueTeamArr = [];
	let teamDataArr = [];
	let leagueJoined;
	let franchiseIdArr = await TeamController.getFranchiseIdForUser(userId);
	if (franchiseIdArr.length > 0) {
		let franchiseId = franchiseIdArr[0];
		// let userFranchiseDetail = await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseId)
		// let franchiseTeams = userFranchiseDetail.franchiseTeams
		// let participatingTeamsInLeagueArr = []
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
		// for (let i = 0; i < leagueDetail.participatingTeams.length; i++) {
		//     let teamId = leagueDetail.participatingTeams[i]._id
		//     participatingTeamsInLeagueArr.push(teamId.toString())
		// }
		// const intersection = participatingTeamsInLeagueArr.filter(element => franchiseTeams.includes(element));
		// let teamId = intersection[0]
		// if (intersection.length == 0) {
		//     console.log("not joined")
		//     leagueJoined = false
		//     teamId = ""
		// }
		// if (intersection.length > 0) {
		//     console.log("joined")
		//     leagueJoined = true
		//     teamId = teamId
		// }
		let leagueJoinedStatus = await this.userLeagueJoinedStatus(
			userId,
			leagueId
		);
		let leagueStartingDate = moment(leagueDetail.startingDate).format(
			"MMM DD yyyy"
		);
		let leagueEndingDate = moment(leagueDetail.endingDate).format(
			"MMM DD yyyy"
		);
		let leagueObj = {
			_id: leagueDetail._id,
			leagueTitleImage: leagueDetail.leagueTitleImage,
			startingDate: leagueStartingDate,
			endingDate: leagueEndingDate,
			leagueName: leagueDetail.leagueName,
			hostedBy: leagueDetail.createdBy.userDetail.userName,
			gameToPlay: leagueDetail.gameToPlay.gameName,
			prize: leagueDetail.prize,
			teamSize: leagueDetail.teamSize,
			entryFee: leagueDetail.entryFee,
			registered: leagueDetail.participatingTeams.length,
			totalTeams: leagueDetail.totalTeams,
			leagueJoinedleagued: leagueJoinedStatus.leagueJoined,
			teamId: leagueJoinedStatus.teamId,
		};
		let leagueTeamsArr = leagueDetail.participatingTeams;
		if (leagueTeamsArr.length > 0) {
			for (let i = 0; i < leagueTeamsArr.length; i++) {
				let teamId = leagueTeamsArr[i];
				let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				let leaderDetail = await UserHelper.foundUserById(
					teamDetail.teamLeader
				);
				let leaderName = leaderDetail.userDetail.userName;
				let teamObj = {
					_id: teamDetail._id,
					teamTitleImage: teamDetail.teamTitleImage,
					teamName: teamDetail.teamViewName,
					leader: leaderName,
					rooster: teamDetail.teamMembers.length,
				};
				leagueTeamArr.push(teamObj);
			}
		}
		return { ...leagueObj, participatingTeams: [...leagueTeamArr] };
	}
};
////league object data without teams
exports.leagueObjDataWithoutTeams = async (leagueId) => {
	let leagueJoined;
	let leagueDetail = await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
		leagueId
	);
	let leagueStartingDate = moment(leagueDetail.startingDate)
		.local()
		.format("MMM DD yyyy");
	let leagueEndingDate = moment(leagueDetail.endingDate)
		.utc()
		.format("MMM DD yyyy");
	let leagueYear = moment(leagueDetail.createdAt).format("yyyy");
	//
	// let franchiseId = leagueDetail.leagueFranchise
	// let userFranchiseDetail = await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseId)
	// let franchiseTeams = userFranchiseDetail.franchiseTeams
	// let participatingTeamsInLeagueArr = []
	// console.log("league participating team : ", leagueDetail.participatingTeams)
	// for (let i = 0; i < leagueDetail.participatingTeams.length; i++) {
	//     let teamId = leagueDetail.participatingTeams[i]._id
	//     participatingTeamsInLeagueArr.push(teamId.toString())
	// }
	// const intersection = participatingTeamsInLeagueArr.filter(element => franchiseTeams.includes(element));
	// let teamId = intersection[0]
	// if (intersection.length == 0) {
	//     console.log("not joined")
	//     leagueJoined = false
	//     teamId = ""
	// }
	// if (intersection.length > 0) {
	//     console.log("joined")
	//     leagueJoined = true
	//     teamId = teamId
	// }
	//
	let leagueObj = {
		_id: leagueDetail._id,
		leagueTitleImage: leagueDetail.leagueTitleImage,
		year: leagueYear,
		startingDate: leagueDetail.startingDate,
		endingDate: leagueDetail.endingDate,
		leagueName: leagueDetail.leagueName,
		gameToPlay: leagueDetail.gameToPlay,
		prize: leagueDetail.prize,
		teamSize: leagueDetail.teamSize,
		entryFee: leagueDetail.entryFee,
		totalTeams: leagueDetail.totalTeams,
		registered: leagueDetail.participatingTeams.length,
		participatingTeams: leagueDetail.participatingTeams,
		registeredTeams: leagueDetail.participatingTeams.length,
	};
	return leagueObj;
};

// generate league schedule data
exports.generateLeagueSchedule = async (
	totalTeams,
	participatingTeamArr,
	roundNumber,
	leagueId,
	scheduleType
) => {
	let srNo;
	let teamOneArr = [];
	let teamTwoArr = [];
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
		console.log("round greater than 1");
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
		srNo = i + 1;
		await LeagueScheduleHelper.saveLeagueSchedule(
			roundNumber,
			srNo,
			scheduleType,
			randomNumber,
			leagueId,
			teamOneArr[i],
			teamTwoArr[i]
		);
	}
};
///get league schedule data
exports.leagueScheduleData = async (leagueId) => {
	let winnerTeamName;
	let leagueMatchArr = [];
	let roundCountArr = [];
	let finalLeagueMatchArr = [];
	let leagueRoundDataObject;
	let scheduleTypeForData;
	let laegueMatches = await LeagueScheduleHelper.checkLeagueSchedule(leagueId);
	for (let a = 0; a < laegueMatches.length; a++) {
		roundCountArr.push(laegueMatches[a].roundNumber);
	}
	let maxRoundCount = Math.max(...roundCountArr);
	for (let k = 0; k < maxRoundCount; k++) {
		for (let l = 0; l < laegueMatches.length; l++) {
			if (laegueMatches[l].roundNumber == k + 1) {
				let teamOneName = await TournamentAndLeagueHelper.getTeamName(
					laegueMatches[l].teamOne
				);
				let teamTwoName = await TournamentAndLeagueHelper.getTeamName(
					laegueMatches[l].teamTwo
				);
				let winnerTeamId = laegueMatches[l].winner;
				let matchId = laegueMatches[l].randomMatchId;
				let leagueResutlDetailByMatchId =
					await LeagueResultHelper.findPendingResultByMatchId(matchId);
				let leagueTotalResultByMatchId =
					await LeagueResultHelper.findTotalResultByMatchId(matchId);
				let totalSubmittedResult = leagueTotalResultByMatchId.length;
				if (
					leagueResutlDetailByMatchId.length == 0 &&
					totalSubmittedResult == 2
				) {
					winnerTeamName = await TournamentAndLeagueHelper.getTeamName(
						winnerTeamId
					);
				} else {
					winnerTeamName = "";
				}
				let leagueMatchObj = {
					_id: laegueMatches[l]._id,
					srNo: laegueMatches[l].rowNumber,
					matchId: laegueMatches[l].randomMatchId,
					teamOne: teamOneName,
					teamTwo: teamTwoName,
					scheduleType: laegueMatches[l].scheduleType,
					winner: winnerTeamName,
				};
				scheduleTypeForData = laegueMatches[l].scheduleType;
				leagueMatchArr.push(leagueMatchObj);
			}
		}
		leagueRoundDataObject = {
			roundNumber: k + 1,
			scheduleType: scheduleTypeForData,
			matches: leagueMatchArr,
		};
		finalLeagueMatchArr.push(leagueRoundDataObject);
		leagueMatchArr = [];
	}
	// let pagination = laegueMatches.pagination
	// return {...pagination, data: finalLeagueMatchArr}
	return finalLeagueMatchArr;
};
/// random match id generator
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
/// get league result data
exports.leagueResultData = async (franchiseLeagueResult) => {
	let teamMembersFinalArr = [];
	let leagueResultArr = [];
	let killPointsArr = [];
	if (franchiseLeagueResult.data.length > 0) {
		for (let j = 0; j < franchiseLeagueResult.data.length; j++) {
			let leagueId = franchiseLeagueResult.data[j].leagueId;
			let leagueDetail =
				await LeagueHelper.findLeagueByIdWithDeleteWithPopulate(leagueId);
			if (leagueDetail != null) {
				let gameName = leagueDetail.gameToPlay.gameName;
				let teamId = franchiseLeagueResult.data[j].teamId._id;
				let teamData = await TeamHelper.findTeamDeatilByTeamId(teamId);
				let playerResultArr = franchiseLeagueResult.data[j].playerResults;
				if (playerResultArr.length > 0) {
					for (let k = 0; k < playerResultArr.length; k++) {
						let pointsData = {
							userId: playerResultArr[k].userId,
							killPoints: playerResultArr[k].killPoints,
						};
						killPointsArr.push(pointsData);
					}
				}
				// console.log("kill arr : ", killPointsArr)
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
				let leagueResultObj = {
					result: franchiseLeagueResult.data[j].result,
					scheduleType: franchiseLeagueResult.data[j].scheduleType,
					total: parseInt(
						franchiseLeagueResult.data[j].killPoints +
						parseInt(franchiseLeagueResult.data[j].placePoints)
					),
					_id: franchiseLeagueResult.data[j]._id,
					leagueId: franchiseLeagueResult.data[j].leagueId,
					leagueName: franchiseLeagueResult.data[j].leagueName,
					teamViewName: franchiseLeagueResult.data[j].teamId.teamViewName,
					score: franchiseLeagueResult.data[j].score,
					roundNumber: franchiseLeagueResult.data[j].roundNumber,
					gameName: gameName,
					matchId: franchiseLeagueResult.data[j].matchId,
					resultVideo: franchiseLeagueResult.data[j].resultVideo,
					teamMembers: teamMembersFinalArr,
					killPointsArr: killPointsArr,
				};
				leagueResultArr.push(leagueResultObj);
				killPointsArr = []; //empty array
				teamMembersFinalArr = []; //empty array
			}
		}
	}
	let pagination = franchiseLeagueResult.pagination;
	return { ...pagination, data: leagueResultArr };
};
/////generate league schedule for 4 teams
exports.scheduleForFourTeams = async (teamArr, maxRoundNumber, leagueId) => {
	let roundNumber = parseInt(maxRoundNumber) + 1;
	let checkLeagueScheduleExist =
		await LeagueScheduleHelper.findLeagueScheduleByLeagueId(leagueId);
	if (checkLeagueScheduleExist.length > 0) {
		let checkLeagueCompleteAndWinnerByPlayoff =
			await LeagueScheduleHelper.checkAlreadyLeagueScheduleForPlayoff(
				leagueId,
				roundNumber
			);
		if (checkLeagueCompleteAndWinnerByPlayoff.length > 0) {
			console.log("pending 1");
			return await this.leagueScheduleData(leagueId);
		}
		if (checkLeagueCompleteAndWinnerByPlayoff.length == 0) {
			let checkAlreadyLeagueSchedulePendingResult =
				await LeagueResultHelper.checkAlreadyLeagueSchedulePendingResult(
					leagueId,
					maxRoundNumber
				);
			if (checkAlreadyLeagueSchedulePendingResult.length > 0) {
				console.log("pending 1.1");
				let leagueMatchScheduleDetail = await this.leagueScheduleData(
					request.leagueId
				);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.leagueScheduleData = leagueMatchScheduleDetail;
				response.message = Message.PENDING_LEAGUE_RESULTS;
				return res.status(response.code).json(response);
			} else {
				let scheduleType = "playoff";
				let totalTeams = teamArr.length;
				await this.generateLeagueSchedule(
					totalTeams,
					teamArr,
					roundNumber,
					leagueId,
					scheduleType
				);
			}
		}
	} else {
		let scheduleType = "playoff";
		let totalTeams = teamArr.length;
		await this.generateLeagueSchedule(
			totalTeams,
			teamArr,
			roundNumber,
			leagueId,
			scheduleType
		);
	}
	return await this.leagueScheduleData(leagueId);
};
//generate league schedule for 2 teams
exports.scheduleForTwoTeams = async (maxRoundNumber, leagueId) => {
	console.log("2 schedule");
	let firstTeam;
	let secondTeam;
	let matchOneData =
		await LeagueScheduleHelper.getPlayOffMatchDataWithRoundNumber(
			leagueId,
			maxRoundNumber,
			1
		); //1 is row number(match number)
	if (matchOneData.teamOne.toString() == matchOneData.winner.toString()) {
		firstTeam = matchOneData.teamTwo;
	} else {
		firstTeam = matchOneData.teamOne;
	}
	let matchTwoData =
		await LeagueScheduleHelper.getPlayOffMatchDataWithRoundNumber(
			leagueId,
			maxRoundNumber,
			2
		); //2 is row number(match number)
	secondTeam = matchTwoData.winner;
	let roundNumber = parseInt(maxRoundNumber) + 1;
	let teamArr = []; // empty array from previous value
	teamArr.push(firstTeam);
	teamArr.push(secondTeam);
	let scheduleType = "playoff";
	let totalTeams = teamArr.length;
	await this.generateLeagueSchedule(
		totalTeams,
		teamArr,
		roundNumber,
		leagueId,
		scheduleType
	);
	return await this.leagueScheduleData(leagueId);
};
//generate one schedule
exports.scheduleForOneTeam = async (
	maxRoundNumber,
	previousRoundWinnerTeamsArr,
	leagueId
) => {
	let checkFinalScheduleRequired =
		await LeagueScheduleHelper.findLeagueScheduleDetailByRoundNumber(
			maxRoundNumber,
			leagueId
		);
	if (checkFinalScheduleRequired.scheduleType != "final") {
		let oldRoundNumber = parseInt(maxRoundNumber) - 1;
		let previousMatchDataToGetFirstQualifyTeam =
			await LeagueScheduleHelper.getPlayOffMatchDataWithRoundNumber(
				leagueId,
				oldRoundNumber,
				1
			);
		let previousQualifyTeamId = previousMatchDataToGetFirstQualifyTeam.winner;
		let secondTeamIdForFinal = previousRoundWinnerTeamsArr[0].teamId;
		let teamArr = []; //empty array from previous value
		teamArr.push(previousQualifyTeamId);
		teamArr.push(secondTeamIdForFinal);
		let roundNumber = parseInt(maxRoundNumber) + 1;
		let scheduleType = "final";
		let totalTeams = teamArr.length;
		await this.generateLeagueSchedule(
			totalTeams,
			teamArr,
			roundNumber,
			leagueId,
			scheduleType
		);
		return await this.leagueScheduleData(leagueId);
	} else {
		console.log("winner announced");
		return await this.leagueScheduleData(leagueId);
	}
};
//User league joined status
exports.userLeagueJoinedStatus = async (userId, leagueId) => {
	let teamId;
	let leagueJoined;
	let franchiseId = "";
	let checkUserFranchiseTeam = await TeamHelper.findUserFranchiseTeam(userId);
	if (checkUserFranchiseTeam == null) {
		teamId = "";
		leagueJoined = false;
	}
	if (checkUserFranchiseTeam != null) {
		teamId = checkUserFranchiseTeam._id;
		let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
		if (teamDetail != null) {
			franchiseId = teamDetail.teamType;
		}
		let checkLeagueJoined = await LeagueHelper.findTeamInLeague(
			leagueId,
			teamId
		);
		if (checkLeagueJoined == null) {
			franchiseId = franchiseId;
			teamId = teamId;
			leagueJoined = false;
		}
		if (checkLeagueJoined != null) {
			franchiseId = franchiseId;
			teamId = teamId;
			leagueJoined = true;
		}
	}
	return {
		franchiseId: franchiseId,
		teamId: teamId,
		leagueJoined: leagueJoined,
	};
};
