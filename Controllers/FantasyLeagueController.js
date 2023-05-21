const fs = require("fs");
const moment = require("moment");
const mongoose = require("mongoose");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
// Controller
const TeamController = require("../Controllers/TeamController");
const FranchiseController = require("../Controllers/FranchiseController");
const UserController = require("../Controllers/UserController");
const LeagueController = require("../Controllers/LeagueController");
const matchController = require("../Controllers/MatchController");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const LeagueHelper = require("../Services/LeagueHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const TeamHelper = require("../Services/TeamHelper");
const LeagueScheduleHelper = require("../Services/LeagueScheduleHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const LeagueResultHelper = require("../Services/LeagueResultHelper");
const GameHelper = require("../Services/GameHelper");
const FantasyLeagueHelper = require("../Services/FantasyLeagueHelper");
const FantasyTeamHelper = require("../Services/FantasyTeamHelper");
const TradeMoveHelper = require("../Services/TradeMovesHelper");
const TournamentAndLeagueHelper = require("../Services/TournamentAndLeagueHelper");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
const { playerData } = require("./FantasyLeagueController");
const EmailHelper = require("../Services/EmailHelper");
//
exports.createFantasyLeague = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let flType;
	let flData;
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
		let userRole = userData.role;
		if (
			(!request.flName,
				!request.teamSize,
				!request.totalTeams,
				!request.draftDateAndTime,
				!request.leagueId)
		) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let leagueJoinedStatus = await LeagueController.userLeagueJoinedStatus(
			userId,
			request.leagueId
		);
		if (leagueJoinedStatus.leagueJoined == true) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEAGUE_PLAYER_CANNOT_CREATE_FL
			);
			return res.status(response.code).json(response);
		} else {
			let leagueDetail =
				await LeagueHelper.findLeagueByIdWithDeleteWithPopulate(
					request.leagueId
				);
			let leagueEndDate = leagueDetail.endingDate;
			let endDate = moment(leagueEndDate).format("MMM DD YYYY");
			let nowDate = moment().utc().format("MMM DD YYYY");
			let dateCheckResult = moment(endDate).isSameOrAfter(nowDate, "day");
			if (!dateCheckResult) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.CAN_NOT_CREATE_FL_LEAGUE_END
				);
				return res.status(response.code).json(response);
			} else {
				let leagueTotalTeams = leagueDetail.totalTeams; //for check total teams in FL will less than
				let leagueTeamSize = leagueDetail.teamSize;
				let teamSizeCalculation =
					(parseInt(leagueTotalTeams) * parseInt(leagueTeamSize)) /
					parseInt(request.totalTeams);
				let requiredFlTeamSize = teamSizeCalculation.toFixed(0);
				let totalTeamsArr = ["4", "8", "16", "32"];
				let teamCountResult = totalTeamsArr.includes(
					request.totalTeams.toString()
				);
				if (teamCountResult === false) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.TOTAL_TEAMS_ERROR
					);
					return res.status(response.code).json(response);
				}
				if (request.totalTeams < 4) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.MINIMUM_TEAM_REQUIRED
					);
					return res.status(response.code).json(response);
				}
				if (request.totalTeams > leagueTotalTeams) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						"Total team must be equal or less than " + leagueTotalTeams
					);
					return res.status(response.code).json(response);
				}
				if (request.teamSize > requiredFlTeamSize) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						"Maximum team size must be " + requiredFlTeamSize
					);
					return res.status(response.code).json(response);
				}
				let fantasyLeagueNameCheck =
					await FantasyLeagueHelper.findFantasyLeagueByNameWithoutDelete(
						request.flName.toLowerCase().trim()
					);
				if (userRole == "Admin") {
					flType = "public";
				} else {
					flType = "private";
				}
				if (fantasyLeagueNameCheck != null) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.NAME_ALREADY_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let flTitleImage = leagueDetail.leagueTitleImage;
					let gameId = leagueDetail.gameToPlay._id;
					let gameName = leagueDetail.gameToPlay.gameName;
					let randomNumber = await TournamentAndLeagueHelper.getRandomNmmber();
					let leagueName = leagueDetail.leagueName;
					let fantasyLeagueId = await FantasyLeagueHelper.creatFantasyLeague(
						request.flName.toLowerCase().trim(),
						request.totalTeams,
						request.teamSize,
						request.draftDateAndTime,
						request.leagueId,
						gameName,
						gameId,
						userId,
						flTitleImage,
						randomNumber,
						flType,
						leagueName
					);
					if (userRole == "User") {
						let userFantasyTeamId = await this.createFantasyTeamForUser(
							userId,
							fantasyLeagueId,
							request.teamSize,
							request.totalTeams
						);
						await FantasyLeagueHelper.addFantasyTeam(
							fantasyLeagueId,
							userFantasyTeamId
						);
						let fantasyLeagueDetail =
							await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
								fantasyLeagueId
							);
						flData = {
							_id: fantasyLeagueDetail._id,
							flTitleImage: fantasyLeagueDetail.flTitleImage,
							flName: fantasyLeagueDetail.flName,
						};
					}
					if (userRole == "Admin") {
						let fantasyLeagueDetail =
							await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
								fantasyLeagueId
							);
						let fantasyLeagueYear = moment(
							fantasyLeagueDetail.createdAt
						).format("yyyy");
						flData = {
							_id: fantasyLeagueDetail._id,
							flName: fantasyLeagueDetail.flName,
							flTitleImage: fantasyLeagueDetail.flTitleImage,
							type: fantasyLeagueDetail.flType,
							totalTeams: fantasyLeagueDetail.totalTeams,
							teamSize: fantasyLeagueDetail.teamSize,
							draftDateAndTime: fantasyLeagueDetail.draftDateAndTime,
							year: fantasyLeagueYear,
							leagueName: fantasyLeagueDetail.leagueName,
							leagueId: fantasyLeagueDetail.league,
							winner: fantasyLeagueDetail.winner,
							registeredTeams: fantasyLeagueDetail.flTeams.length,
						};
					}
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.flData = flData;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.showAllFantasyLeague = async (req, res) => {
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
		let finalPublicFlArr = [];
		let finalPrivateFlArr = [];
		let finalJoinedFlArr = [];
		let allPrivateFantasyLeague;
		let allPublicFantasyLeague;
		let allJoinedFantasyLeague;
		let joinFlArr = [];
		let joinFlArrByGame = [];
		if (!req.query.game) {
			allPublicFantasyLeague =
				await FantasyLeagueHelper.findAllPublicFantasyLeagues();
			allPrivateFantasyLeague =
				await FantasyLeagueHelper.findAllPrivateFantasyLeagues(userId);
			let userAllFantasyLeague =
				await FantasyTeamHelper.findAllFantasyTeamByUserId(userId);
			if (userAllFantasyLeague.length > 0) {
				for (let i = 0; i < userAllFantasyLeague.length; i++) {
					let flTeamId = userAllFantasyLeague[i]._id;
					let leagueId = userAllFantasyLeague[i].teamType;
					let leagueDetail =
						await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
							leagueId
						);
					let createdBy = leagueDetail.createdBy;
					if (createdBy.toString() != userId.toString()) {
						let joinedFl = await FantasyLeagueHelper.findFantasyLeagueByFlTeam(
							flTeamId
						);
						joinFlArr.push(joinedFl);
					}
				}
			}
			allJoinedFantasyLeague = joinFlArr;
		}
		if (req.query.game) {
			let gameName = req.query.game.toLowerCase().trim();
			console.log("game name : ", gameName);
			let parseGameName = gameName.replace(/%20/g, " ");
			console.log("parse game name : ", parseGameName);
			if (parseGameName.toString() == "all") {
				allPublicFantasyLeague =
					await FantasyLeagueHelper.findAllPublicFantasyLeagues();
				allPrivateFantasyLeague =
					await FantasyLeagueHelper.findAllPrivateFantasyLeagues(userId);
				let userAllFantasyLeague =
					await FantasyTeamHelper.findAllFantasyTeamByUserId(userId);
				if (userAllFantasyLeague.length > 0) {
					for (let i = 0; i < userAllFantasyLeague.length; i++) {
						let flTeamId = userAllFantasyLeague[i]._id;
						let leagueId = userAllFantasyLeague[i].teamType;
						let leagueDetail =
							await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
								leagueId
							);
						if (leagueDetail != null) {
							let createdBy = leagueDetail.createdBy;
							if (createdBy.toString() != userId.toString()) {
								let joinedFl =
									await FantasyLeagueHelper.findFantasyLeagueByFlTeam(flTeamId);
								joinFlArr.push(joinedFl);
							}
						}
					}
				}
				allJoinedFantasyLeague = joinFlArr;
			} else {
				let gameId = "";
				let gameDetail = await GameHelper.findFranchiseGameByName(gameName);
				if (gameDetail != null) {
					gameId = gameDetail._id;
				}
				allPublicFantasyLeague =
					await FantasyLeagueHelper.findAllPublicFantasyLeaguesByGameName(
						gameName
					);
				allPrivateFantasyLeague =
					await FantasyLeagueHelper.findAllPrivateFantasyLeaguesByGameName(
						userId,
						gameName
					);
				let userAllFantasyLeague =
					await FantasyTeamHelper.findAllFantasyTeamByUserId(userId);
				if (userAllFantasyLeague.length > 0) {
					for (let i = 0; i < userAllFantasyLeague.length; i++) {
						let flTeamId = userAllFantasyLeague[i]._id;
						let leagueId = userAllFantasyLeague[i].teamType;
						let leagueDetail =
							await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
								leagueId
							);
						if (leagueDetail != null) {
							let createdBy = leagueDetail.createdBy;
							if (leagueDetail.gameToPlay.toString() == gameId.toString()) {
								if (createdBy.toString() != userId.toString()) {
									let joinedFl =
										await FantasyLeagueHelper.findFantasyLeagueByFlTeam(
											flTeamId
										);
									joinFlArr.push(joinedFl);
								}
							}
						}
					}
				}
				allJoinedFantasyLeague = joinFlArr;
			}
		}
		if (allPublicFantasyLeague.length > 0) {
			for (let i = 0; i < allPublicFantasyLeague.length; i++) {
				let flObj = {
					_id: allPublicFantasyLeague[i]._id,
					flName: allPublicFantasyLeague[i].flName,
					flTitleImage: allPublicFantasyLeague[i].flTitleImage,
				};
				finalPublicFlArr.push(flObj);
			}
		}
		if (allPrivateFantasyLeague.length > 0) {
			for (let i = 0; i < allPrivateFantasyLeague.length; i++) {
				let flObj = {
					_id: allPrivateFantasyLeague[i]._id,
					flName: allPrivateFantasyLeague[i].flName,
					flTitleImage: allPrivateFantasyLeague[i].flTitleImage,
				};
				finalPrivateFlArr.push(flObj);
			}
		}
		if (allJoinedFantasyLeague.length > 0) {
			for (let i = 0; i < allJoinedFantasyLeague.length; i++) {
				let flObj = {
					_id: allJoinedFantasyLeague[i]._id,
					flName: allJoinedFantasyLeague[i].flName,
					flTitleImage: allJoinedFantasyLeague[i].flTitleImage,
				};
				finalJoinedFlArr.push(flObj);
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.flData = {
			publicFl: finalPublicFlArr,
			privateFl: finalPrivateFlArr,
			joinedFl: finalJoinedFlArr,
		};
		return res.status(response.code).json(response);
	}
};
exports.getFantasyLeagueById = async (req, res) => {
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
		let fantasyLeagueId = request.fantasyLeagueId;
		let userFantasyLeagueDetail = await this.userFantasyLeagueDetailData(
			userId,
			fantasyLeagueId
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.fantasyLeagueData = userFantasyLeagueDetail;
		return res.status(response.code).json(response);
	}
};
exports.joinFantasyLeague = async (req, res) => {
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
		let fantasyLeagueId = request.fantasyLeagueId;
		let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
		let leagueId = flDetail.league;
		let registeredTeams = flDetail.flTeams.length;
		let requiredTeams = flDetail.totalTeams;
		let teamSize = flDetail.teamSize;
		if (registeredTeams >= requiredTeams) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.REQUIRED_TEAMS_ALREADY_REGISTERED
			);
			return res.status(response.code).json(response);
		} else {
			let checkLeagueJoinStatus = await LeagueController.userLeagueJoinedStatus(
				userId,
				leagueId
			);
			if (checkLeagueJoinStatus.leagueJoined == true) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.LEAGUE_PLAYER_CANNOT_JOIN
				);
				return res.status(response.code).json(response);
			} else {
				let checkAlreadyJoined = await FantasyTeamHelper.checkAlreadyHaveTeam(
					userId,
					fantasyLeagueId
				);
				if (checkAlreadyJoined != null) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_JOINED
					);
					return res.status(response.code).json(response);
				} else {
					let userFantasyTeamId = await this.createFantasyTeamForUser(
						userId,
						fantasyLeagueId,
						teamSize,
						requiredTeams
					);
					await FantasyLeagueHelper.addFantasyTeam(
						fantasyLeagueId,
						userFantasyTeamId
					);
					let userFantasyLeagueDetail = await this.userFantasyLeagueDetailData(
						userId,
						fantasyLeagueId
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.fantasyLeagueData = userFantasyLeagueDetail;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.sendFlJoinInvitation = async (req, res) => {
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
		if (!request.friendId || !request.fantasyLeagueId) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let fantasyLeagueId = request.fantasyLeagueId;
		let friendId = request.friendId;
		let leagueId;
		let leagueDetailByFLId =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				fantasyLeagueId
			);
		if (leagueDetailByFLId != null) {
			leagueId = leagueDetailByFLId.league;
		}
		let userLeagueJoinedStatus = await LeagueController.userLeagueJoinedStatus(
			friendId,
			leagueId
		);
		if (userLeagueJoinedStatus.leagueJoined == true) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.LEAGUE_PLAYER_CANNOT_PARTICIPATE
			);
			return res.status(response.code).json(response);
		}

		let flInviteCheck = await FantasyLeagueHelper.findInvite(
			fantasyLeagueId,
			userId,
			friendId
		);
		if (flInviteCheck != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_REQUESTED
			);
			return res.status(response.code).json(response);
		}
		if (flInviteCheck == null) {
			let flJoinCheck = await this.fantasyLeagueJoinCheckForUser(
				friendId,
				fantasyLeagueId
			);
			if (flJoinCheck == true) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_MEMBER
				);
				return res.status(response.code).json(response);
			} else {
				await FantasyLeagueHelper.createFlInvite(
					fantasyLeagueId,
					userId,
					friendId
				);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.responseFlJoinInvitaion = async (req, res) => {
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
		if (!request.fromId || !request.fantasyLeagueId || !request.status) {
			let response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let fantasyLeagueId = request.fantasyLeagueId;
		let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
		let registeredTeams = flDetail.flTeams.length;
		let requiredTeams = flDetail.totalTeams;
		let teamSize = flDetail.teamSize;
		let flInviteCheck = await FantasyLeagueHelper.findRequestedInvite(
			fantasyLeagueId,
			userId,
			request.fromId
		);
		if (flInviteCheck == null) {
			response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		} else {
			if (registeredTeams >= requiredTeams) {
				let status = "dropped";
				await FantasyLeagueHelper.updateInvitationStatus(
					fantasyLeagueId,
					userId,
					request.fromId,
					status
				);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.REQUIRED_TEAMS_ALREADY_REGISTERED
				);
				return res.status(response.code).json(response);
			} else {
				let status = request.status.toLowerCase();
				await FantasyLeagueHelper.updateInvitationStatus(
					fantasyLeagueId,
					userId,
					request.fromId,
					status
				);
				if (status == "accepted") {
					//////////////////////////////
					let userFantasyTeamId = await this.createFantasyTeamForUser(
						userId,
						fantasyLeagueId,
						teamSize,
						registeredTeams
					);
					await FantasyLeagueHelper.addFantasyTeam(
						fantasyLeagueId,
						userFantasyTeamId
					);
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
};
exports.getFantasyTeamById = async (req, res) => {
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
		let flTeamId = request.flTeamId;
		// let requiredTeamSize
		// let finalTeamMembersArr = []
		// let flTeamDetail = await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flTeamId)
		// if (flTeamDetail != null) {
		//     requiredTeamSize = flTeamDetail.teamSize
		//     let flId = flTeamDetail.teamType//for future use
		//     let teamMembers = flTeamDetail.teamMembers
		//     if (teamMembers.length > 0) {
		//         for (let i = 0; i < teamMembers.length; i++) {
		//             let playerId = teamMembers[i].userId
		//             let playerData = await UserHelper.foundUserById(playerId)
		//             let playerObj = await this.getPlayerData(playerData)
		//             finalTeamMembersArr.push(playerObj)
		//         }
		//     } else {
		//         for (let j = 0; j < requiredTeamSize; j++) {
		//             let playerObj = {
		//                 _id: "",
		//                 userName: "",
		//                 profileImage: "",
		//                 userPoints: ""
		//             }
		//             finalTeamMembersArr.push(playerObj)
		//         }
		//     }
		// }
		let finalTeamMembersArr = await this.teamMemberDetail(flTeamId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		// response.teamSize = requiredTeamSize
		response.teamMemberData = finalTeamMembersArr;
		return res.status(response.code).json(response);
	}
};
exports.showAllLeaguePlayer = async (req, res) => {
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
		let selectedPlayersArr = [];
		let playersArr = [];
		let playerIdArr = [];
		let finalPlayerArr = [];
		let sortedPlayersArr;
		let leagueId = request.leagueId;
		let fantasyLeagueId = request.fantasyLeagueId;
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
				fantasyLeagueId
			);
		if (fantasyLeagueDetail != null) {
			let flTeams = fantasyLeagueDetail.flTeams;
			if (flTeams.length > 0) {
				for (let i = 0; i < flTeams.length; i++) {
					let flTeamId = flTeams[i];
					let flTeamDetail =
						await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
							flTeamId
						);
					if (flTeamDetail != null) {
						let flTeamMembers = flTeamDetail.teamMembers;
						if (flTeamMembers.length > 0) {
							for (let j = 0; j < flTeamMembers.length; j++) {
								let selectedPlayerId = flTeamMembers[j].userId;
								selectedPlayersArr.push(selectedPlayerId.toString());
							}
						}
					}
				}
			}
		}
		//console.log("selected players Arr : ", selectedPlayersArr)
		let leagueDetail =
			await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
		if (leagueDetail != null) {
			// console.log("league detail : ", leagueDetail)
			let leagueTeams = leagueDetail.participatingTeams;
			if (leagueTeams.length > 0) {
				for (let i = 0; i < leagueTeams.length; i++) {
					//  console.log("teams : ", i + 1, " ", leagueTeams[i])
					let teamDetail = await TeamHelper.findTeamDeatilByTeamId(
						leagueTeams[i]
					);
					if (teamDetail != null) {
						//  console.log("team Detail : ", teamDetail)
						let teamMembers = teamDetail.teamMembers;
						//  console.log("team members : ", teamMembers)
						if (teamMembers.length > 0) {
							for (let j = 0; j < teamMembers.length; j++) {
								let userObj = {};
								// console.log("member id : ", j + 1, " ", teamMembers[j].userId)
								let playerId = teamMembers[j].userId;
								let userData = await UserHelper.foundUserById(playerId);
								playerIdArr.push(userData._id.toString());
							}
						}
					}
				}
			}
		}
		//for filter selected player from selection list
		finalPlayerArr = playerIdArr.filter(
			(val) => !selectedPlayersArr.includes(val)
		);
		if (finalPlayerArr.length > 0) {
			for (let k = 0; k < finalPlayerArr.length; k++) {
				let playerId = finalPlayerArr[k];
				let userData = await UserHelper.foundUserById(playerId);
				userObj = {
					_id: userData._id,
					userName: userData.userDetail.userName,
					profileImage: userData.profileImage,
					userPoints: userData.userPoints,
				};
				playersArr.push(userObj);
			}
			sortedPlayersArr = playersArr.sort((a, b) => b.userPoints - a.userPoints);
		} else {
			sortedPlayersArr = [];
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.playersData = sortedPlayersArr;
		return res.status(response.code).json(response);
	}
};
exports.addMemberToFantasyLeague = async (req, res) => {
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
		let playerId = request.playerId;
		let flTeamId = request.flTeamId;
		let alreadyTeamMemberCheck = await FantasyTeamHelper.checkAlreadyTeamMember(
			flTeamId,
			playerId
		);
		if (alreadyTeamMemberCheck != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_SELECTED
			);
			return res.status(response.code).json(response);
		} else {
			let teamDetail =
				await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flTeamId);
			let registeredMember = teamDetail.teamMembers.length;
			let requiredMember = teamDetail.teamSize;
			if (registeredMember >= requiredMember) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.TEAM_SIZE_EXCEED
				);
				return res.status(response.code).json(response);
			} else {
				await FantasyTeamHelper.addMemberToFlTeam(flTeamId, playerId);
				let teamMemberDetail = await this.teamMemberDetail(flTeamId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.teamMemberData = teamMemberDetail;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.updateMemberToFantasyLeague = async (req, res) => {
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
		let playerId = request.playerId;
		let flTeamId = request.flTeamId;
		let oldPlayerId = request.oldPlayerId;
		let alreadyTeamMemberCheck = await FantasyTeamHelper.checkAlreadyTeamMember(
			flTeamId,
			playerId
		);
		if (alreadyTeamMemberCheck != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_SELECTED
			);
			return res.status(response.code).json(response);
		} else {
			await FantasyTeamHelper.updateMemberToFlTeam(
				flTeamId,
				playerId,
				oldPlayerId
			);
			let userData = await UserHelper.foundUserById(playerId);
			let newUserObj = {
				_id: userData._id,
				userName: userData.userDetail.userName,
				profileImage: userData.profileImage,
				userPoints: userData.userPoints + " pts",
			};
			// let teamMemberDetail = await this.teamMemberDetail(flTeamId)
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamMemberData = newUserObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.showAllPublicFantasyLeague = async (req, res) => {
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
		let finalPublicFlArr = [];
		let allPublicFantasyLeague;
		let pageNo;
		if (!request.pageNo) {
			pageNo = 1;
		}
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!req.query.query) {
			allPublicFantasyLeague =
				await FantasyLeagueHelper.allFantasyLeaguesWithPagination(pageNo);
		}
		if (req.query.query) {
			let searchStr = req.query.query.toLowerCase().trim();
			allPublicFantasyLeague =
				await FantasyLeagueHelper.searchFantasyLeagueByNameWithPagination(
					searchStr,
					pageNo
				);
		}
		if (allPublicFantasyLeague.data.length > 0) {
			for (let i = 0; i < allPublicFantasyLeague.data.length; i++) {
				let fantasyLeagueYear = moment(
					allPublicFantasyLeague.data[i].createdAt
				).format("yyyy");
				let flTeamDetail =
					await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
						allPublicFantasyLeague.data[i].winner
					);
				let winnerTeamName;
				if (flTeamDetail != null) {
					winnerTeamName = flTeamDetail.teamViewName;
				} else {
					winnerTeamName = "";
				}
				let flObj = {
					_id: allPublicFantasyLeague.data[i]._id,
					flName: allPublicFantasyLeague.data[i].flName,
					flTitleImage: allPublicFantasyLeague.data[i].flTitleImage,
					type: allPublicFantasyLeague.data[i].flType,
					totalTeams: allPublicFantasyLeague.data[i].totalTeams,
					teamSize: allPublicFantasyLeague.data[i].teamSize,
					draftDateAndTime: allPublicFantasyLeague.data[i].draftDateAndTime,
					year: fantasyLeagueYear,
					leagueName: allPublicFantasyLeague.data[i].leagueName,
					leagueId: allPublicFantasyLeague.data[i].league,
					winner: winnerTeamName,
					registeredTeams: allPublicFantasyLeague.data[i].flTeams.length,
				};
				finalPublicFlArr.push(flObj);
			}
		} else {
			finalPublicFlArr = [];
		}
		let pagination = allPublicFantasyLeague.pagination;
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.flData = { ...pagination, data: finalPublicFlArr };
		return res.status(response.code).json(response);
	}
};
exports.editFantasyLeague = async (req, res) => {
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
		let fantasyLeagueId = request._id;
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
				fantasyLeagueId
			);
		let requiredTeams = fantasyLeagueDetail.totalTeams;
		let fantasyLeagueRegisterTeam = fantasyLeagueDetail.flTeams.length;
		if (fantasyLeagueRegisterTeam > 0) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_UPDATE_NOW
			);
			return res.status(response.code).json(response);
		} else {
			let flId = await FantasyLeagueHelper.updateFantasyLeagueDetail(request);
			let flDetail =
				await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(flId);
			let fantasyLeagueYear = moment(flDetail.createdAt).format("yyyy");
			let flObj = {
				_id: flDetail._id,
				flName: flDetail.flName,
				flTitleImage: flDetail.flTitleImage,
				type: flDetail.flType,
				totalTeams: flDetail.totalTeams,
				teamSize: flDetail.teamSize,
				draftDateAndTime: flDetail.draftDateAndTime,
				year: fantasyLeagueYear,
				leagueName: flDetail.leagueName,
				leagueId: flDetail.league,
				winner: flDetail.winner,
				registeredTeams: flDetail.flTeams.length,
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.flData = flObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteFantasyLeague = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueId;
	let notFlId = [];
	let deletedId = [];
	let pendingId = [];
	let flIdArr = request.flId;
	for (let i = 0; i < flIdArr.length; i++) {
		leagueId = flIdArr[i];
		let fantasyLeagueDetailById =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(leagueId);
		if (fantasyLeagueDetailById == null) {
			notFlId.push(leagueId);
		}
		if (fantasyLeagueDetailById != null) {
			let flTeams = fantasyLeagueDetailById.flTeams;
			if (flTeams.length > 0) {
				pendingId.push(leagueId);
			} else {
				await FantasyLeagueHelper.deleteFantasyLeague(leagueId);
				deletedId.push(leagueId);
			}
		}
	}
	if (notFlId.length != 0) {
		console.log("Records of these ID/s not found : " + notFlId);
	}
	if (pendingId.length > 0) {
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.SOME_RECORDS_NOT_DELETE
		);
		response.resultId = deletedResultId;
		return res.status(response.code).json(response);
	} else {
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.flId = deletedId;
		return res.status(response.code).json(response);
	}
};
exports.changeFlTeamName = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let flTeamId = request.flTeamId;
	let flTeamName = request.flTeamName.toLowerCase().trim();
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
		let flTeamDetail =
			await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flTeamId);
		if (flTeamDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_NOT_FOUND
			);
			return res.status(response.code).json(response);
		} else {
			let flId = flTeamDetail.teamType;
			if (userId.toString() != flTeamDetail.teamOwner.toString()) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.NOT_AUTHORIZE_ACTION
				);
				return res.status(response.code).json(response);
			} else {
				await FantasyTeamHelper.updateFlTeamName(flTeamId, flTeamName);
				let userFantasyLeagueDetail = await this.userFantasyLeagueDetailData(
					userId,
					flId
				);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.fantasyLeagueData = userFantasyLeagueDetail;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.getFlSchedule = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let roundNumber = 1;
	let alreadyFlScheduleCheck;
	let scheduleType;
	let previousRoundWinnerTeamsArr;
	let teamArr = [];
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
		let scheduleType;
		let fantasyLeagueId = request.fantasyLeagueId;
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				fantasyLeagueId
			);
		// console.log("fl detail : ", fantasyLeagueDetail);
		if (fantasyLeagueDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.FANTASY_LEAGUE_NOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		else {
			let flId = fantasyLeagueDetail._id
			let fantasyLeagueRequiredTotalTeams = fantasyLeagueDetail.totalTeams;
			let totalRegisteredTeams = fantasyLeagueDetail.flTeams.length;
			let email = fantasyLeagueDetail.createdBy.userDetail.email
			let userName = fantasyLeagueDetail.createdBy.userDetail.userName
			let flName = fantasyLeagueDetail.flName
			let emailSendStatus = fantasyLeagueDetail.emailSendStatus
			let flTeams = fantasyLeagueDetail.flTeams;
			let leagueId = fantasyLeagueDetail.league;
			//	console.log("email : ", email, "userName : ", userName, "emailSend : ", emailSendStatus);
			console.log(
				"teams required : ",
				fantasyLeagueRequiredTotalTeams,
				"registered : ",
				totalRegisteredTeams
			);
			let flSuspended = await this.flStartAndPendingRegistrationDetail(flId)
			let leagueDetail =
				await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
			let leagueTotalRequiredTeams = leagueDetail.totalTeams;
			let leagueRegisteredTeams = leagueDetail.participatingTeams.length;
			if (leagueRegisteredTeams < leagueTotalRequiredTeams) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.SLOTS_EMPTY
				);
				response.suspendedStatus = flSuspended
				return res.status(response.code).json(response);
			}
			let leagueStartingDate = leagueDetail.startingDate;
			let startDate = moment(leagueStartingDate).format("MMM DD YYYY");
			let nowDate = moment().format("MMM DD YYYY");
			let dateCheckResult = moment(startDate).isSameOrBefore(nowDate, "day");
			if (dateCheckResult == false) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.GP_LEAGUE_NOT_STARTED
				);
				response.suspendedStatus = flSuspended
				return res.status(response.code).json(response);
			} else {

				if (totalRegisteredTeams < fantasyLeagueRequiredTotalTeams) {
					if (emailSendStatus == false) {
						//send email
						let subject = "Fantasy League Cancelled - OBG";
						let message = "Your Fantasy League '" + flName +
							"' has been cancelled due to required No. of the team/s not registered before the start."
						let replacements = {};
						await EmailHelper.sendEmailToUser(
							email,
							subject,
							message,
							replacements
						);
						await FantasyLeagueHelper.updateEmailStatus(flId, true)
					}

					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.FL_PENDING_REGISTRATION
					);
					response.flScheduleData = [];
					response.suspendedStatus = flSuspended
					return res.status(response.code).json(response);
				}
				else {

					let findPendingWinnerRoundByLeagueIdAndRound =
						await LeagueResultHelper.findPendingWinnerRoundByLeagueIdAndRound(
							leagueId,
							1
						);
					alreadyFlScheduleCheck =
						await FantasyLeagueHelper.checkAlreadyFlScheduleByFlId(
							fantasyLeagueId
						);
					if (
						findPendingWinnerRoundByLeagueIdAndRound.length > 0 &&
						alreadyFlScheduleCheck.length == 0
					) {
						console.log("can not start or play FL now");
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.CAN_NOT_PLAY_FL
						);
						return res.status(response.code).json(response);
					} else {
						let flSuspended = await this.flStartAndPendingRegistrationDetail(fantasyLeagueId)
						console.log("fl schedule check");
						if (alreadyFlScheduleCheck.length == 0) {
							/////
							console.log("fl schedule not exist - new generated");
							if (fantasyLeagueRequiredTotalTeams == 4) {
								scheduleType = "playoff";
								let shuffledParticipatingTeamArr =
									TournamentAndLeagueHelper.shuffle(flTeams);

								await this.generateFantasyLeagueSchedule(
									roundNumber,
									fantasyLeagueRequiredTotalTeams,
									shuffledParticipatingTeamArr,
									fantasyLeagueId,
									leagueId,
									scheduleType
								);
							} else {
								scheduleType = "round";
								let shuffledParticipatingTeamArr =
									TournamentAndLeagueHelper.shuffle(flTeams);
								await this.generateFantasyLeagueSchedule(
									roundNumber,
									fantasyLeagueRequiredTotalTeams,
									shuffledParticipatingTeamArr,
									fantasyLeagueId,
									leagueId,
									scheduleType
								);
							}
							let leagueMatchScheduleDetail =
								await this.fantasyLeagueScheduleData(fantasyLeagueId);
							response = ResponseHelper.setResponse(
								ResponseCode.SUCCESS,
								Message.REQUEST_SUCCESSFUL
							);
							response.leagueScheduleData = leagueMatchScheduleDetail;
							response.message = Message.CHECK_NEW_SCHEDULE;
							response.suspendedStatus = flSuspended
							return res.status(response.code).json(response);
						}
						if (alreadyFlScheduleCheck.length > 0) {
							console.log("fl schedule exist");

							let fantasyLeagueDetailForMaxRoundNumber =
								await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
									fantasyLeagueId
								);
							let maxRoundNumber =
								fantasyLeagueDetailForMaxRoundNumber[0].roundNumber;

							let checkPendingFantasyLeagueScheduleWinnerByRound =
								await FantasyLeagueHelper.checkPendingFantasyLeagueScheduleWinner(
									fantasyLeagueId,
									maxRoundNumber
								);

							if (checkPendingFantasyLeagueScheduleWinnerByRound.length > 0) {
								let leagueDetailForMaxRoundNumber =
									await LeagueScheduleHelper.getLeagueDetailForMaxRoundNumber(
										leagueId
									);
								console.log("leagueDetailForMaxRoundNumber : ", leagueDetailForMaxRoundNumber);
								let maxLeagueRoundNumber =
									leagueDetailForMaxRoundNumber[0].roundNumber;

								if (maxRoundNumber <= maxLeagueRoundNumber) {
									let checkAlreadyLeagueSchedulePendingResult =
										await LeagueScheduleHelper.checkLeagueRoundWinner(
											leagueId,
											maxLeagueRoundNumber
										);

									if (checkAlreadyLeagueSchedulePendingResult.length > 0) {
										console.log("pending league result.");
										let leagueMatchScheduleDetail =
											await this.fantasyLeagueScheduleData(fantasyLeagueId);
										response = ResponseHelper.setResponse(
											ResponseCode.SUCCESS,
											Message.REQUEST_SUCCESSFUL
										);
										response.leagueScheduleData = leagueMatchScheduleDetail;
										response.message = Message.PENDING_LEAGUE_RESULTS;
										response.suspendedStatus = flSuspended
										return res.status(response.code).json(response);
									}
									if (checkAlreadyLeagueSchedulePendingResult.length == 0) {
										let flScheduleForPendingResult =
											await FantasyLeagueHelper.findSchedulePendingResult(
												fantasyLeagueId,
												maxRoundNumber
											);
										if (flScheduleForPendingResult.length > 0) {
											console.log("pendign fl schedule result exist");

											let scheduleRoundNumber;
											let teamOneId;
											let teamTwoId;
											let teamOneFinalPoints = 0;
											let teamTwoFinalPoints = 0;
											let scheduleTeamArr = [];
											let flScheduleDetailForRound =
												await FantasyLeagueHelper.findScheduleOfRound(
													fantasyLeagueId,
													maxRoundNumber
												);

											console.log("FL round result going to announce");

											let maxRoundNumberFromFlScheduleWinnerDetail =
												await FantasyLeagueHelper.maxRoundNumberFromFlScheduleWinnerNull(
													fantasyLeagueId
												);
											let maxRoundNumberFromFlScheduleWinner =
												maxRoundNumberFromFlScheduleWinnerDetail[0].roundNumber;
											console.log(
												"max round number for fl schedule winner null : ",
												maxRoundNumberFromFlScheduleWinner
											);
											for (
												let i = 0;
												i < flScheduleDetailForRound.length;
												i++
											) {
												teamOneId = flScheduleDetailForRound[i].teamOne;
												teamTwoId = flScheduleDetailForRound[i].teamTwo;
												if (teamTwoId != null) {
													scheduleTeamArr.push(teamOneId);
													scheduleTeamArr.push(teamTwoId);
													let teamOneDetail =
														await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
															teamOneId
														);
													let teamOneMembers = teamOneDetail.teamMembers;
													if (teamOneMembers.length > 0) {
														for (let j = 0; j < teamOneMembers.length; j++) {
															let playerId = teamOneMembers[j].userId;
															// console.log(
															// 	"T1 player Id : ",
															// 	j + 1,
															// 	" ",
															// 	playerId,
															// 	"league id : ",
															// 	leagueId,
															// 	"max round no : ",
															// 	maxRoundNumberFromFlScheduleWinner
															// );
															let playerLeaguePointsDetail =
																await FantasyLeagueHelper.getPlayerLeaguePointByRoundNumber(
																	playerId,
																	leagueId,
																	maxRoundNumberFromFlScheduleWinner
																);

															if (playerLeaguePointsDetail == null) {
																console.log("team one givig 0");
																teamOneFinalPoints =
																	teamOneFinalPoints + parseInt(0);
															} else {
																teamOneFinalPoints =
																	teamOneFinalPoints +
																	parseInt(playerLeaguePointsDetail.points);
															}
														}
													}

													if (teamTwoId != null) {
														let teamTwoDetail =
															await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
																teamTwoId
															);
														let teamTwoMembers = teamTwoDetail.teamMembers;
														if (teamTwoMembers.length > 0) {
															for (let k = 0; k < teamTwoMembers.length; k++) {
																let playerId = teamTwoMembers[k].userId;

																let playerLeaguePointsDetail =
																	await FantasyLeagueHelper.getPlayerLeaguePointByRoundNumber(
																		playerId,
																		leagueId,
																		maxRoundNumberFromFlScheduleWinner
																	);
																if (playerLeaguePointsDetail == null) {
																	console.log("team two givig 0");
																	teamTwoFinalPoints =
																		teamTwoFinalPoints + parseInt(0);
																} else {
																	teamTwoFinalPoints =
																		teamTwoFinalPoints +
																		parseInt(playerLeaguePointsDetail.points);
																}
															}
														}
													}
													let teamOnePointRecordId;
													let teamTwoPointRecordId;
													let teamOnePointsResultExist =
														await FantasyLeagueHelper.findAlreadyTeamPointsExistForScheduleRound(
															leagueId,
															fantasyLeagueId,
															maxRoundNumber,
															teamOneId
														);
													if (teamOnePointsResultExist.length > 0) {
														console.log("Team One Points already exist");
													} else {
														console.log("Team One Points not exist");
														teamOnePointRecordId =
															await FantasyLeagueHelper.addFantasyTeamPoint(
																maxRoundNumber,
																teamOneFinalPoints,
																teamOneId,
																leagueId,
																fantasyLeagueId
															);
													}

													let teamTwoPointsResultExist =
														await FantasyLeagueHelper.findAlreadyTeamPointsExistForScheduleRound(
															leagueId,
															fantasyLeagueId,
															maxRoundNumber,
															teamTwoId
														);
													if (teamTwoPointsResultExist.length > 0) {
														console.log("Team Two Points already exist");
													} else {
														console.log("Team Two Points not exist");
														teamTwoPointRecordId =
															await FantasyLeagueHelper.addFantasyTeamPoint(
																maxRoundNumber,
																teamTwoFinalPoints,
																teamTwoId,
																leagueId,
																fantasyLeagueId
															);
													}
													if (teamOneFinalPoints == teamTwoFinalPoints) {
														console.log("same points");

														let leaderboardPointsDetailArr =
															await this.leaderboardDataDetail(fantasyLeagueId);
														// console.log(
														// 	"leaderboard detail arr : ",
														// 	leaderboardPointsDetailArr
														// );
														let teamOneLeaderBoardDetail =
															leaderboardPointsDetailArr.filter(
																(x) => x._id.toString() == teamOneId.toString()
															);
														// console.log(
														// 	"team one leader board detail : ",
														// 	teamOneLeaderBoardDetail
														// );
														let teamTwoLeaderboardPoints;
														if (teamTwoId != null) {
															let teamTwoLeaderBoardDetail =
																leaderboardPointsDetailArr.filter(
																	(x) =>
																		x._id.toString() == teamTwoId.toString()
																);
															console.log(
																"team two leader board detail : ",
																teamTwoLeaderBoardDetail
															);
															teamTwoLeaderboardPoints =
																teamTwoLeaderBoardDetail[0].points;
														} else {
															teamTwoLeaderboardPoints = 0;
														}
														let teamOneLeaderboardPoints =
															teamOneLeaderBoardDetail[0].points;

														if (
															teamOneLeaderboardPoints >
															teamTwoLeaderboardPoints
														) {
															console.log("win team one with leaderboard");
															await FantasyLeagueHelper.updateFantasyLeagueScheduleResult(
																maxRoundNumber,
																fantasyLeagueId,
																teamOneId
															);
															await FantasyLeagueHelper.updateTeamPointWinner(
																fantasyLeagueId,
																maxRoundNumber,
																teamOneId
															);
															await FantasyLeagueHelper.updateTeamPointLooser(
																fantasyLeagueId,
																maxRoundNumber,
																teamTwoId
															);
														} else {
															console.log("win team two with leaderboard");
															await FantasyLeagueHelper.updateFantasyLeagueScheduleResult(
																maxRoundNumber,
																fantasyLeagueId,
																teamTwoId
															);
															await FantasyLeagueHelper.updateTeamPointWinner(
																fantasyLeagueId,
																maxRoundNumber,
																teamTwoId
															);
															await FantasyLeagueHelper.updateTeamPointLooser(
																fantasyLeagueId,
																maxRoundNumber,
																teamOneId
															);
														}
													} else if (teamOneFinalPoints > teamTwoFinalPoints) {
														console.log("win team one");
														await FantasyLeagueHelper.updateFantasyLeagueScheduleResult(
															maxRoundNumber,
															fantasyLeagueId,
															teamOneId
														);
														await FantasyLeagueHelper.updateTeamPointWinner(
															fantasyLeagueId,
															maxRoundNumber,
															teamOneId
														);
														await FantasyLeagueHelper.updateTeamPointLooser(
															fantasyLeagueId,
															maxRoundNumber,
															teamTwoId
														);
													} else {
														console.log("win team two");
														await FantasyLeagueHelper.updateFantasyLeagueScheduleResult(
															maxRoundNumber,
															fantasyLeagueId,
															teamTwoId
														);
														await FantasyLeagueHelper.updateTeamPointWinner(
															fantasyLeagueId,
															maxRoundNumber,
															teamTwoId
														);
														await FantasyLeagueHelper.updateTeamPointLooser(
															fantasyLeagueId,
															maxRoundNumber,
															teamOneId
														);
													}
													teamOneFinalPoints = 0;
													teamTwoFinalPoints = 0;
												}
											}
											console.log(
												"fl schedule result announced going to generate next schedule"
											);
											previousRoundWinnerTeamsArr =
												await FantasyLeagueHelper.getPreviousRoundWinnerList(
													fantasyLeagueId,
													leagueId,
													maxRoundNumber
												);

											if (
												previousRoundWinnerTeamsArr.length == 32 ||
												previousRoundWinnerTeamsArr.length == 16 ||
												previousRoundWinnerTeamsArr.length == 8 ||
												previousRoundWinnerTeamsArr.length == 4 ||
												previousRoundWinnerTeamsArr.length == 2 ||
												previousRoundWinnerTeamsArr.length == 1
											) {
												for (
													let i = 0;
													i < previousRoundWinnerTeamsArr.length;
													i++
												) {
													teamArr.push(previousRoundWinnerTeamsArr[i].flTeamId);
												}

												if (previousRoundWinnerTeamsArr.length > 4) {
													scheduleType = "round";
													let totalTeams = teamArr.length;
													let roundNumber = parseInt(maxRoundNumber) + 1;
													await this.generateFantasyLeagueSchedule(
														roundNumber,
														totalTeams,
														teamArr,
														fantasyLeagueId,
														leagueId,
														scheduleType
													);
													let leagueMatchScheduleDetail =
														await this.fantasyLeagueScheduleData(
															fantasyLeagueId
														);
													response = ResponseHelper.setResponse(
														ResponseCode.SUCCESS,
														Message.REQUEST_SUCCESSFUL
													);
													response.leagueScheduleData =
														leagueMatchScheduleDetail;
													response.message = Message.CHECK_NEW_SCHEDULE;
													response.suspendedStatus = flSuspended
													return res.status(response.code).json(response);
												}
												if (previousRoundWinnerTeamsArr.length == 4) {
													console.log("4 schedule");
													//
													let leagueMatchScheduleDetail =
														await this.scheduleForFourTeams(
															teamArr,
															maxRoundNumber,
															fantasyLeagueId,
															leagueId
														);
													response = ResponseHelper.setResponse(
														ResponseCode.SUCCESS,
														Message.REQUEST_SUCCESSFUL
													);
													response.leagueScheduleData =
														leagueMatchScheduleDetail;
													response.message = Message.CHECK_NEW_SCHEDULE;
													response.suspendedStatus = flSuspended
													return res.status(response.code).json(response);
												}
												if (previousRoundWinnerTeamsArr.length == 2) {
													console.log("2 schedule");
													let leagueMatchScheduleDetail =
														await this.scheduleForTwoTeams(
															maxRoundNumber,
															fantasyLeagueId,
															leagueId
														);
													response = ResponseHelper.setResponse(
														ResponseCode.SUCCESS,
														Message.REQUEST_SUCCESSFUL
													);
													response.leagueScheduleData =
														leagueMatchScheduleDetail;
													response.message = Message.CHECK_NEW_SCHEDULE;
													response.suspendedStatus = flSuspended
													return res.status(response.code).json(response);
												}
												if (previousRoundWinnerTeamsArr.length == 1) {
													let checkLeagueFinalExist =
														await FantasyLeagueHelper.checkLeagueFinalExist(
															fantasyLeagueId
														);
													console.log(
														"check fl final exist : ",
														checkLeagueFinalExist
													);
													if (checkLeagueFinalExist == null) {
														console.log("check fl final exist is null ");
														console.log("1 schedule");
														let leagueMatchScheduleDetail =
															await this.scheduleForOneTeam(
																maxRoundNumber,
																previousRoundWinnerTeamsArr,
																fantasyLeagueId,
																leagueId
															);
														response = ResponseHelper.setResponse(
															ResponseCode.SUCCESS,
															Message.REQUEST_SUCCESSFUL
														);
														response.leagueScheduleData =
															leagueMatchScheduleDetail;
														response.message = Message.CHECK_NEW_SCHEDULE;
														response.suspendedStatus = flSuspended
														return res.status(response.code).json(response);
													}
													if (checkLeagueFinalExist != null) {
														console.log("check fl final exist is not null ");
														let winnigTeamId = checkLeagueFinalExist.winner;
														let fantasyLeagueDetails =
															await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
																fantasyLeagueId
															);
														if (fantasyLeagueDetails.winningTeam == null) {
															console.log(
																"fl schedule winner not exist and update winner"
															);
															await FantasyLeagueHelper.updateWinnerTeam(
																fantasyLeagueId,
																winnigTeamId
															);
														}
														let winningTeamName =
															await TournamentAndLeagueHelper.getFantasyTeamName(
																winnigTeamId
															);
														console.log("no schedule required");
														let leagueMatchScheduleDetail =
															await this.scheduleForOneTeam(
																maxRoundNumber,
																previousRoundWinnerTeamsArr,
																fantasyLeagueId,
																leagueId
															);
														console.log(
															"fl schedule : ",
															leagueMatchScheduleDetail
														);
														response = ResponseHelper.setResponse(
															ResponseCode.SUCCESS,
															Message.REQUEST_SUCCESSFUL
														);
														response.leagueScheduleData =
															leagueMatchScheduleDetail;
														response.message =
															"WooHoo Congratulation! " +
															winningTeamName +
															" has won this league.";
														response.suspendedStatus = flSuspended
														return res.status(response.code).json(response);
													}
												}
											} else {
												console.log("fl else pending");
												let leagueMatchScheduleDetail =
													await this.fantasyLeagueScheduleData(fantasyLeagueId);
												response = ResponseHelper.setResponse(
													ResponseCode.SUCCESS,
													Message.REQUEST_SUCCESSFUL
												);
												response.leagueScheduleData = leagueMatchScheduleDetail;
												response.message = Message.PENDING_LEAGUE_RESULTS;
												response.suspendedStatus = flSuspended
												return res.status(response.code).json(response);
											}
										} else {
											console.log("wait for pending result of league");
											let leagueMatchScheduleDetail =
												await this.fantasyLeagueScheduleData(fantasyLeagueId);
											response = ResponseHelper.setResponse(
												ResponseCode.SUCCESS,
												Message.REQUEST_SUCCESSFUL
											);
											response.leagueScheduleData = leagueMatchScheduleDetail;
											response.message = Message.PENDING_LEAGUE_RESULTS;
											response.suspendedStatus = flSuspended
											return res.status(response.code).json(response);
										}
									}
								} else {
									console.log("wait for pending result of league round max");
									let leagueMatchScheduleDetail =
										await this.fantasyLeagueScheduleData(fantasyLeagueId);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.leagueScheduleData = leagueMatchScheduleDetail;
									response.message = Message.PENDING_LEAGUE_RESULTS;
									response.suspendedStatus = flSuspended
									return res.status(response.code).json(response);
								}
							}
							if (checkPendingFantasyLeagueScheduleWinnerByRound.length == 0) {
								console.log("winner announce");
								console.log("pending fl schedule winner length = 0");
								console.log("all done");

								let pendingFantasyWinnerList =
									await FantasyLeagueHelper.findPendingWinnerList(
										fantasyLeagueId,
										maxRoundNumber
									);

								if (pendingFantasyWinnerList.length == 0) {
									previousRoundWinnerTeamsArr =
										await FantasyLeagueHelper.getPreviousRoundWinnerList(
											fantasyLeagueId,
											leagueId,
											maxRoundNumber
										);
									console.log(
										"previous round winner array : ",
										previousRoundWinnerTeamsArr
									);

									if (
										previousRoundWinnerTeamsArr.length == 32 ||
										previousRoundWinnerTeamsArr.length == 16 ||
										previousRoundWinnerTeamsArr.length == 8 ||
										previousRoundWinnerTeamsArr.length == 4 ||
										previousRoundWinnerTeamsArr.length == 2 ||
										previousRoundWinnerTeamsArr.length == 1
									) {
										for (
											let i = 0;
											i < previousRoundWinnerTeamsArr.length;
											i++
										) {
											teamArr.push(previousRoundWinnerTeamsArr[i].flTeamId);
										}

										if (previousRoundWinnerTeamsArr.length > 4) {
											console.log("****teamArr length > 4");
											scheduleType = "round";
											let totalTeams = teamArr.length;
											let roundNumber = parseInt(maxRoundNumber) + 1;
											await this.generateFantasyLeagueSchedule(
												roundNumber,
												totalTeams,
												teamArr,
												fantasyLeagueId,
												leagueId,
												scheduleType
											);
											let leagueMatchScheduleDetail =
												await this.fantasyLeagueScheduleData(fantasyLeagueId);
											response = ResponseHelper.setResponse(
												ResponseCode.SUCCESS,
												Message.REQUEST_SUCCESSFUL
											);
											response.leagueScheduleData = leagueMatchScheduleDetail;
											response.message = Message.CHECK_NEW_SCHEDULE;
											response.suspendedStatus = flSuspended
											return res.status(response.code).json(response);
										}
										if (previousRoundWinnerTeamsArr.length == 4) {
											console.log("****teamArr length = 4");
											console.log("****4 schedule");
											//
											let leagueMatchScheduleDetail =
												await this.scheduleForFourTeams(
													teamArr,
													maxRoundNumber,
													fantasyLeagueId,
													leagueId
												);
											response = ResponseHelper.setResponse(
												ResponseCode.SUCCESS,
												Message.REQUEST_SUCCESSFUL
											);
											response.leagueScheduleData = leagueMatchScheduleDetail;
											response.message = Message.CHECK_NEW_SCHEDULE;
											response.suspendedStatus = flSuspended
											return res.status(response.code).json(response);
										}
										if (previousRoundWinnerTeamsArr.length == 2) {
											console.log("****teamArr length = 2");
											console.log("****2 schedule");
											let leagueMatchScheduleDetail =
												await this.scheduleForTwoTeams(
													maxRoundNumber,
													fantasyLeagueId,
													leagueId
												);
											response = ResponseHelper.setResponse(
												ResponseCode.SUCCESS,
												Message.REQUEST_SUCCESSFUL
											);
											response.leagueScheduleData = leagueMatchScheduleDetail;
											response.message = Message.CHECK_NEW_SCHEDULE;
											response.suspendedStatus = flSuspended
											return res.status(response.code).json(response);
										}
										if (previousRoundWinnerTeamsArr.length == 1) {
											console.log("****teamArr length = 1");
											let checkLeagueFinalExist =
												await FantasyLeagueHelper.checkLeagueFinalExist(
													fantasyLeagueId
												);

											if (checkLeagueFinalExist == null) {
												console.log("****check fl final exist is null ");
												console.log("****1 schedule");
												let leagueMatchScheduleDetail =
													await this.scheduleForOneTeam(
														maxRoundNumber,
														previousRoundWinnerTeamsArr,
														fantasyLeagueId,
														leagueId
													);
												response = ResponseHelper.setResponse(
													ResponseCode.SUCCESS,
													Message.REQUEST_SUCCESSFUL
												);
												response.leagueScheduleData = leagueMatchScheduleDetail;
												response.message = Message.CHECK_NEW_SCHEDULE;
												response.suspendedStatus = flSuspended
												return res.status(response.code).json(response);
											}
											if (checkLeagueFinalExist != null) {
												console.log("****check fl final exist is not null ");
												let winnigTeamId = checkLeagueFinalExist.winner;
												let fantasyLeagueDetails =
													await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
														fantasyLeagueId
													);
												if (fantasyLeagueDetails.winningTeam == null) {
													console.log(
														"****fl schedule winner not exist and update winner"
													);
													await FantasyLeagueHelper.updateWinnerTeam(
														fantasyLeagueId,
														winnigTeamId
													);
												}
												let winningTeamName =
													await TournamentAndLeagueHelper.getFantasyTeamName(
														winnigTeamId
													);
												console.log("****no schedule required");
												let leagueMatchScheduleDetail =
													await this.scheduleForOneTeam(
														maxRoundNumber,
														previousRoundWinnerTeamsArr,
														fantasyLeagueId,
														leagueId
													);
												console.log(
													"fl2 schedule : ",
													leagueMatchScheduleDetail
												);
												response = ResponseHelper.setResponse(
													ResponseCode.SUCCESS,
													Message.REQUEST_SUCCESSFUL
												);
												response.leagueScheduleData = leagueMatchScheduleDetail;
												response.message =
													"****WooHoo Congratulation! " +
													winningTeamName +
													" has won this league.";
												response.suspendedStatus = flSuspended
												return res.status(response.code).json(response);
											}
										}
									} else {
										console.log("fl esle2 pending");
										let leagueMatchScheduleDetail =
											await this.fantasyLeagueScheduleData(fantasyLeagueId);
										response = ResponseHelper.setResponse(
											ResponseCode.SUCCESS,
											Message.REQUEST_SUCCESSFUL
										);
										response.leagueScheduleData = leagueMatchScheduleDetail;
										response.message = Message.PENDING_LEAGUE_RESULTS;
										response.suspendedStatus = flSuspended
										return res.status(response.code).json(response);
									}
								} else {
									console.log("pending");
									let leagueMatchScheduleDetail =
										await this.fantasyLeagueScheduleData(fantasyLeagueId);
									response = ResponseHelper.setResponse(
										ResponseCode.SUCCESS,
										Message.REQUEST_SUCCESSFUL
									);
									response.leagueScheduleData = leagueMatchScheduleDetail;
									response.message = Message.PENDING_LEAGUE_RESULTS;
									response.suspendedStatus = flSuspended
									return res.status(response.code).json(response);
								}
							}
						}
					}
				}
			}
		}
	}
}


exports.getFlLeaderBoard = async (req, res) => {
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
		let fantasyLeagueId = request.fantasyLeagueId;
		let finalTeamPointsArr = await this.leaderboardDataDetail(fantasyLeagueId);
		let flSuspended = await this.flStartAndPendingRegistrationDetail(fantasyLeagueId)
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.leaderboardData = finalTeamPointsArr;
		response.suspendedStatus = flSuspended
		return res.status(response.code).json(response);
	}
};
exports.getFlStat = async (req, res) => {
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
		let fantasyLeagueId = request.fantasyLeagueId;
		let finalPlayerPoints;
		let playerWithPointsArr = [];
		let sortedPlayerPointsArr = [];
		let maxRoundNumberFromFlSchedule = 1;
		let finalStatsArr = [];
		let maxRoundNumberFromFlScheduleDetail =
			await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
				fantasyLeagueId
			);
		let flSuspended = await this.flStartAndPendingRegistrationDetail(fantasyLeagueId)
		if (maxRoundNumberFromFlScheduleDetail.length > 0) {
			maxRoundNumberFromFlSchedule =
				maxRoundNumberFromFlScheduleDetail[0].roundNumber;
		}
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				fantasyLeagueId
			);
		if (fantasyLeagueDetail != null) {
			let fantasyLeagueRequiredTotalTeams = fantasyLeagueDetail.totalTeams;
			let totalRegisteredTeams = fantasyLeagueDetail.flTeams.length;
			let flTeams = fantasyLeagueDetail.flTeams;
			let leagueId = fantasyLeagueDetail.league;
			let roundNumber = maxRoundNumberFromFlSchedule;
			let leaguePlayerPointsDetailArr =
				await LeagueHelper.getPlayerPointsDetailByLeague(leagueId, roundNumber);
			if (leaguePlayerPointsDetailArr.length > 0) {
				let fantasyLeaguePlayerList = await this.getFantasyLeaguePlayersList(
					fantasyLeagueId
				);
				if (fantasyLeaguePlayerList.length > 0) {
					for (let i = 0; i < fantasyLeaguePlayerList.length; i++) {
						let playerId = fantasyLeaguePlayerList[i];
						finalPlayerPoints = 0;
						for (let j = 0; j < leaguePlayerPointsDetailArr.length; j++) {
							if (
								playerId.toString() ==
								leaguePlayerPointsDetailArr[j].playerId.toString()
							) {
								finalPlayerPoints =
									parseInt(finalPlayerPoints) +
									parseInt(leaguePlayerPointsDetailArr[j].points);
							}
						}
						playerWithPointsArr.push({
							playerId: playerId,
							finalPoints: finalPlayerPoints,
						});
					}
				}
			}
		}
		if (playerWithPointsArr.length > 0) {
			sortedPlayerPointsArr = playerWithPointsArr.sort(
				(a, b) => b.finalPoints - a.finalPoints
			);
			let allFlTeamDetail = await FantasyTeamHelper.findAllFantasyTeam();
			let flTeamsCount = allFlTeamDetail.length;
			let totalFlTeamCount;
			if (flTeamsCount == 0) {
				totalFlTeamCount = 1;
			} else {
				totalFlTeamCount = flTeamsCount;
			}
			for (let m = 0; m < sortedPlayerPointsArr.length; m++) {
				let playerIdForPick = sortedPlayerPointsArr[m].playerId;
				let playerFinalPoints = sortedPlayerPointsArr[m].finalPoints;
				let playerFlTeamDetail =
					await FantasyTeamHelper.findPlayerAllFantayTeam(playerIdForPick);
				let pickCount = playerFlTeamDetail.length;
				let pickPercentage = (
					(parseInt(pickCount) / parseInt(totalFlTeamCount)) *
					100
				).toFixed(0);
				let playerData = await UserHelper.foundUserById(playerIdForPick);
				let playerUserName;
				if (playerData != null) {
					playerUserName = playerData.userDetail.userName;
				}
				finalStatsArr.push({
					rank: m + 1,
					userName: playerUserName,
					pickPercentage: pickPercentage + "%",
					points: playerFinalPoints,
				});
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.flStatsData = finalStatsArr;
		response.suspendedStatus = flSuspended
		return res.status(response.code).json(response);
	}
};
exports.flTeamsDetail = async (req, res) => {
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
		let recordId = request._id;
		let maxRoundNumberFromFlSchedule = 1;
		let flTeamScheduleDetail =
			await FantasyLeagueHelper.flTeamsDetailFromScheduel(recordId);
		let fantasyLeagueId = flTeamScheduleDetail.fantasyLeagueId;
		let leagueId = flTeamScheduleDetail.leagueId;
		let maxRoundNumberFromFlScheduleDetail =
			await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
				fantasyLeagueId
			);
		let flSuspended = await this.flStartAndPendingRegistrationDetail(fantasyLeagueId)
		if (maxRoundNumberFromFlScheduleDetail.length > 0) {
			maxRoundNumberFromFlSchedule =
				maxRoundNumberFromFlScheduleDetail[0].roundNumber;
		}
		if (flTeamScheduleDetail != null) {
			let teamOneId = flTeamScheduleDetail.teamOne;
			let teamTwoId = flTeamScheduleDetail.teamTwo;
			let finalTeamOneArr = await this.teamDetailWithPoints(
				teamOneId,
				leagueId,
				fantasyLeagueId,
				maxRoundNumberFromFlSchedule
			);
			let finalTeamTwoArr = await this.teamDetailWithPoints(
				teamTwoId,
				leagueId,
				fantasyLeagueId,
				maxRoundNumberFromFlSchedule
			);
			console.log("final team one arr {0} : ", finalTeamOneArr);
			console.log("final team two arr {0} : ", finalTeamTwoArr);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamOne = finalTeamOneArr[0];
			response.teamTwo = finalTeamTwoArr[0];
			response.suspendedStatus = flSuspended
			return res.status(response.code).json(response);
		}
	}
};
exports.tradeMoveTeamById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let flTeamId = request.flTeamId;
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
		let teamObj = await this.fantasyTeamDetail(userId, flTeamId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamObj;
		return res.status(response.code).json(response);
	}
};
exports.dropMemberFromFlTeam = async (req, res) => {
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
		let flTeamId = request.flTeamId;
		let flMemberId = request.flMemberId;
		await FantasyTeamHelper.dropMemberFromFlTeam(flTeamId, flMemberId);
		let teamObj = await this.fantasyTeamDetail(userId, flTeamId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamObj;
		return res.status(response.code).json(response);
	}
};
exports.updateWaiverClaim = async (req, res) => {
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
		let flTeamId = request.flTeamId;
		let flMemberId = request.flMemberId;
		let status = request.status;
		await FantasyTeamHelper.updateWaiverStatus(flTeamId, flMemberId, status);
		let teamObj = await this.fantasyTeamDetail(userId, flTeamId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamObj;
		return res.status(response.code).json(response);
	}
};
exports.getTradeMovePlayerData = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let leagueId;
	// let maxRoundNumberFromFlSchedule;
	// let fantasyTeamDetail;
	// let blockTradeOff = false;
	// let teamPlayerFinalArr = [];
	let finalTeamArrWithDetail = [];
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
		let toId;
		let giveFlTeamId;
		let fromId = userId;
		let takePlayerId = request.takePlayerId;
		let takePlayerFlTeamId = request.takePlayerFlTeamId;
		let fantasyLeagueId = request.fantasyLeagueId;
		let flSuspended = await this.flStartAndPendingRegistrationDetail(fantasyLeagueId)
		let userFlTeamDetail =
			await FantasyTeamHelper.findMyFantasyTeamDetailByFlId(
				userId,
				fantasyLeagueId
			);
		if (userFlTeamDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_TEAM_NOT_FOUND
			);
			return res.status(response.code).json(response);
		} else {
			giveFlTeamId = userFlTeamDetail._id;
		}
		let flTeamDetailForAlreadyCheck =
			await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
				takePlayerFlTeamId
			);
		if (flTeamDetailForAlreadyCheck == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_NOT_FOUND
			);
			return res.status(response.code).json(response);
		} else {
			toId = flTeamDetailForAlreadyCheck.teamOwner;
		}
		let alreadyProposalDetail = await TradeMoveHelper.findAlreadySendProposal(
			takePlayerFlTeamId,
			giveFlTeamId,
			fantasyLeagueId,
			toId,
			fromId,
			takePlayerId
		);
		if (alreadyProposalDetail != null) {
			let givePlayerId = alreadyProposalDetail.givePlayerId;
			let takePlayerDataArr = await this.playerCardData(
				takePlayerId,
				fantasyLeagueId
			);
			let givePlayerDataArr = await this.playerCardData(
				givePlayerId,
				fantasyLeagueId
			);
			let playerDataArr = [];
			playerDataArr.push(takePlayerDataArr[0]);
			playerDataArr.push(givePlayerDataArr[0]);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tradeMoveData = {
				playerData: playerDataArr,
				aprrovedStatus: alreadyProposalDetail.approvedStatus,
			};
			return res.status(response.code).json(response);
		} else {
			let emptyObjForGivePlayer = {
				playerId: "",
				blockTradeOff: "",
				userName: "",
				profileImage: "",
				userPoints: "",
				win: "",
				winPercentage: "",
			};
			let playerDataArr = await this.playerCardData(
				takePlayerId,
				fantasyLeagueId
			);
			playerDataArr.push(emptyObjForGivePlayer);
			let flTeamDetail = await FantasyTeamHelper.findMyFantasyTeamDetailByFlId(
				userId,
				fantasyLeagueId
			);
			let maxRoundNumberFromFlSchedule = 1;
			let flDetail =
				await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
					fantasyLeagueId
				);
			if (flDetail != null) {
				leagueId = flDetail.league;
				let maxRoundNumberFromFlScheduleDetail =
					await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
						fantasyLeagueId
					);
				if (maxRoundNumberFromFlScheduleDetail.length > 0) {
					maxRoundNumberFromFlSchedule =
						maxRoundNumberFromFlScheduleDetail[0].roundNumber;
				}
				let teamId = flTeamDetail._id;
				let finalTeamOneArr = await this.teamDetailWithPoints(
					teamId,
					leagueId,
					fantasyLeagueId,
					maxRoundNumberFromFlSchedule
				);
				let teamDataWithPoints = finalTeamOneArr[0].teamData;
				if (teamDataWithPoints.length > 0) {
					for (let k = 0; k < teamDataWithPoints.length; k++) {
						let removePlayerFromList;
						let playerId = teamDataWithPoints[k].playerId;
						let givePlayerRequest =
							await TradeMoveHelper.findGivePlayerForThisPlayer(
								fantasyLeagueId,
								playerId
							);
						let takePlayerRequest =
							await TradeMoveHelper.findTakePlayerForThisPlayer(
								fantasyLeagueId,
								playerId
							);
						if (givePlayerRequest != null || takePlayerRequest != null) {
							removePlayerFromList = true;
						} else {
							removePlayerFromList = false;
						}
						if (removePlayerFromList == false) {
							if (teamDataWithPoints[k].blockTradeOff == false) {
								finalTeamArrWithDetail.push(teamDataWithPoints[k]);
							}
						}
					}
				}
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.tradeMoveData = {
					playerData: playerDataArr,
					playerList: finalTeamArrWithDetail,
				};
				response.suspendedStatus = flSuspended
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.sendTradeProposal = async (req, res) => {
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
		let flId;
		let toId;
		let fromId = userId;
		let takePlayerFlTeamId = request.flTeamId;
		let givePlayerId = request.givePlayerId;
		let takePlayerId = request.takePlayerId;
		let flTeamDetail =
			await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
				takePlayerFlTeamId
			);
		if (flTeamDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.TEAM_NOT_FOUND
			);
			return res.status(response.code).json(response);
		} else {
			flId = flTeamDetail.teamType;
			toId = flTeamDetail.teamOwner;
		}
		let flSuspended = await this.flStartAndPendingRegistrationDetail(flId)
		let userFlTeamDetail =
			await FantasyTeamHelper.findMyFantasyTeamDetailByFlId(userId, flId);
		let giveFlTeamId;
		let giveFlTeamName;
		if (userFlTeamDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_TEAM_NOT_FOUND
			);
			response.suspendedStatus = flSuspended
			return res.status(response.code).json(response);
		} else {
			giveFlTeamId = userFlTeamDetail._id;
			giveFlTeamName = userFlTeamDetail.teamViewName;
		}
		let alreadyProposalDetail = await TradeMoveHelper.findAlreadyProposal(
			takePlayerFlTeamId,
			giveFlTeamId,
			flId,
			toId,
			fromId,
			givePlayerId,
			takePlayerId
		);
		if (alreadyProposalDetail != null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_REQUESTED
			);
			response.suspendedStatus = flSuspended
			return res.status(response.code).json(response);
		} else {
			await TradeMoveHelper.addTradeMoveProposal(
				takePlayerFlTeamId,
				giveFlTeamId,
				flId,
				toId,
				fromId,
				givePlayerId,
				takePlayerId
			);
			let tradeMoveDetail = ""; //trademove invites.......
			//send mail
			let fromUserDetail = await UserHelper.foundUserById(fromId);
			let fromFullName = fromUserDetail.userDetail.fullName;
			let toUserDetail = await UserHelper.foundUserById(toId);
			let email = toUserDetail.userDetail.email;
			let fantasyLeagueDetail =
				await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(flId);
			let flName;
			if (fantasyLeagueDetail != null) {
				flName = fantasyLeagueDetail.flName;
			} else {
				flName = "";
			}
			let subject = "Trade Proposal - OnlineBattleGround (OBG)";
			let message = ".";
			const replacements = {
				link: "go.onlinebattleground.com", // hard code because env update issue
				fromFullName: fromFullName,
				flName: flName,
				userTeamName: giveFlTeamName,
				appName: process.env.APP_NAME,
				mailFrom: process.env.MAIL_FROM,
			};
			EmailHelper.sendEmail(
				email,
				subject,
				message,
				"tradeProposal",
				replacements
			);
			////
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			// response.tradeMoverData = tradeMoveDetail
			response.suspendedStatus = flSuspended
			return res.status(response.code).json(response);
		}
	}
};
exports.getFlTeamPlayerList = async (req, res) => {
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
		let leagueId;
		let finalTeamArrWithDetail = [];
		let fantasyLeagueId = request.fantasyLeagueId;
		let flTeamDetail = await FantasyTeamHelper.findMyFantasyTeamDetailByFlId(
			userId,
			fantasyLeagueId
		);
		let maxRoundNumberFromFlSchedule = 1;
		let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
		if (flDetail != null) {
			leagueId = flDetail.league;
			let maxRoundNumberFromFlScheduleDetail =
				await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
					fantasyLeagueId
				);
			if (maxRoundNumberFromFlScheduleDetail.length > 0) {
				maxRoundNumberFromFlSchedule =
					maxRoundNumberFromFlScheduleDetail[0].roundNumber;
			}
			let teamId = flTeamDetail._id;
			let finalTeamOneArr = await this.teamDetailWithPoints(
				teamId,
				leagueId,
				fantasyLeagueId,
				maxRoundNumberFromFlSchedule
			);
			let teamDataWithPoints = finalTeamOneArr[0].teamData;
			if (teamDataWithPoints.length > 0) {
				for (let k = 0; k < teamDataWithPoints.length; k++) {
					if (teamDataWithPoints[k].blockTradeOff == false) {
						finalTeamArrWithDetail.push(teamDataWithPoints[k]);
					}
				}
			}
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.teamData = finalTeamArrWithDetail;
			return res.status(response.code).json(response);
		}
	}
};
exports.userTradeMoveRequest = async (req, res) => {
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
		let tradeMoveRequest = "trade_move";
		let finalReceivedArr = [];
		let finalSendArr = [];
		let receivedTradeMoveRequest =
			await TradeMoveHelper.findUserReceivedTradeMoveRequest(userId);
		let sendTradeMoveRequest =
			await TradeMoveHelper.findUserSendTradeMoveRequest(userId);
		if (receivedTradeMoveRequest.length > 0) {
			for (let i = 0; i < receivedTradeMoveRequest.length; i++) {
				let userToDetail = await UserHelper.foundUserById(
					receivedTradeMoveRequest[i].toId
				);
				let userToUserName = userToDetail.userDetail.userName;
				let userFromDetail = await UserHelper.foundUserById(
					receivedTradeMoveRequest[i].fromId
				);
				let userFromUserName = userFromDetail.userDetail.userName;
				let givePlayerDetail = await UserHelper.foundUserById(
					receivedTradeMoveRequest[i].givePlayerId
				);
				let givePlayerUserName = givePlayerDetail.userDetail.userName;
				let takePlayerDetail = await UserHelper.foundUserById(
					receivedTradeMoveRequest[i].takePlayerId
				);
				let takePlayerUserName = takePlayerDetail.userDetail.userName;
				finalReceivedArr.push({
					requestDetail: receivedTradeMoveRequest[i].approvedStatus,
					_id: receivedTradeMoveRequest[i]._id,
					fromId: receivedTradeMoveRequest[i].fromId,
					fromUserName: userFromUserName,
					toId: receivedTradeMoveRequest[i].toId,
					toUserName: userToUserName,
					givePlayerId: receivedTradeMoveRequest[i].givePlayerId,
					givePlayerUserName: givePlayerUserName,
					takePlayerId: receivedTradeMoveRequest[i].takePlayerId,
					takePlayerUserName: takePlayerUserName,
					createdAt: receivedTradeMoveRequest[i].createdAt,
					updatedAt: receivedTradeMoveRequest[i].updatedAt,
					requestType: tradeMoveRequest,
					time: moment(receivedTradeMoveRequest[i].createdAt).fromNow(),
				});
			}
		}
		///
		if (sendTradeMoveRequest.length > 0) {
			for (let i = 0; i < sendTradeMoveRequest.length; i++) {
				let userToDetail = await UserHelper.foundUserById(
					sendTradeMoveRequest[i].toId
				);
				let userToUserName = userToDetail.userDetail.userName;
				let userFromDetail = await UserHelper.foundUserById(
					sendTradeMoveRequest[i].fromId
				);
				let userFromUserName = userFromDetail.userDetail.userName;
				let givePlayerDetail = await UserHelper.foundUserById(
					sendTradeMoveRequest[i].givePlayerId
				);
				let givePlayerUserName = givePlayerDetail.userDetail.userName;
				let takePlayerDetail = await UserHelper.foundUserById(
					sendTradeMoveRequest[i].takePlayerId
				);
				let takePlayerUserName = takePlayerDetail.userDetail.userName;
				finalSendArr.push({
					requestDetail: sendTradeMoveRequest[i].approvedStatus,
					_id: sendTradeMoveRequest[i]._id,
					fromId: sendTradeMoveRequest[i].fromId,
					fromUserName: userFromUserName,
					toId: sendTradeMoveRequest[i].toId,
					toUserName: userToUserName,
					givePlayerId: sendTradeMoveRequest[i].givePlayerId,
					givePlayerUserName: givePlayerUserName,
					takePlayerId: sendTradeMoveRequest[i].takePlayerId,
					takePlayerUserName: takePlayerUserName,
					createdAt: sendTradeMoveRequest[i].createdAt,
					updatedAt: sendTradeMoveRequest[i].updatedAt,
					requestType: tradeMoveRequest,
					time: moment(sendTradeMoveRequest[i].createdAt).fromNow(),
				});
			}
		}
		let sortedReceivedArray = [];
		let sortedSendArray = [];
		if (finalReceivedArr.length > 0) {
			sortedReceivedArray = finalReceivedArr.sort(
				(a, b) => new moment(b.createdAt) - new moment(a.createdAt)
			);
		}
		if (finalSendArr.length > 0) {
			sortedSendArray = finalSendArr.sort(
				(a, b) => new moment(b.createdAt) - new moment(a.createdAt)
			);
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.receivedRequests = sortedReceivedArray;
		response.sendRequests = sortedSendArray;
		return res.status(response.code).json(response);
	}
};
exports.tradeMoveRequestDetail = async (req, res) => {
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
		let recordId = request.recordId;
		let tradeMoveRequestDetail = await TradeMoveHelper.findTradeMoveReqById(
			recordId
		);
		if (tradeMoveRequestDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.RECORD_NOT_FOUND
			);
			return res.status(response.code).json(response);
		} else {
			let fantasyLeagueId = tradeMoveRequestDetail.fantasyLeagueId;
			let givePlayerId = tradeMoveRequestDetail.givePlayerId;
			let takePlayerId = tradeMoveRequestDetail.takePlayerId;
			let givePlayerDataForCard = await this.playerCardData(
				givePlayerId,
				fantasyLeagueId
			);
			let takePlayerDataForCard = await this.playerCardData(
				takePlayerId,
				fantasyLeagueId
			);
			let tradeMoveFinalObj = {
				approvedStatus: tradeMoveRequestDetail.approvedStatus,
				_id: tradeMoveRequestDetail._id,
				fantasyLeagueId: fantasyLeagueId,
				giveFlTeamId: tradeMoveRequestDetail.giveFlTeamId,
				takeFlTeamId: tradeMoveRequestDetail.takeFlTeamId,
				givePlayerData: givePlayerDataForCard[0],
				takePlayerData: takePlayerDataForCard[0],
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.tradeMoveDetailData = tradeMoveFinalObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.updateTradeMoveRequestStatus = async (req, res) => {
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
		let recordId = request.recordId;
		let approvedStatus = request.approvedStatus.toLowerCase();
		let takePlayerId = request.takePlayerId;
		let givePlayerId = request.givePlayerId;
		let takeFlTeamId = request.takeFlTeamId;
		let giveFlTeamId = request.giveFlTeamId;
		let fantasyLeagueId = request.fantasyLeagueId;
		await TradeMoveHelper.updateRequestStatus(recordId, approvedStatus);
		if (approvedStatus == "accepted") {
			await FantasyTeamHelper.updateTradeMovePlayer(
				takeFlTeamId,
				takePlayerId,
				givePlayerId
			);
			await FantasyTeamHelper.updateTradeMovePlayer(
				giveFlTeamId,
				givePlayerId,
				takePlayerId
			);
		}
		let tradeMoveRequestDetail = await TradeMoveHelper.findTradeMoveReqById(
			recordId
		);
		let givePlayerDataForCard = await this.playerCardData(
			givePlayerId,
			fantasyLeagueId
		);
		let takePlayerDataForCard = await this.playerCardData(
			takePlayerId,
			fantasyLeagueId
		);
		let tradeMoveFinalObj = {
			approvedStatus: tradeMoveRequestDetail.approvedStatus,
			_id: tradeMoveRequestDetail._id,
			fantasyLeagueId: fantasyLeagueId,
			giveFlTeamId: tradeMoveRequestDetail.giveFlTeamId,
			takeFlTeamId: tradeMoveRequestDetail.takeFlTeamId,
			givePlayerData: givePlayerDataForCard[0],
			takePlayerData: takePlayerDataForCard[0],
		};
		//
		//send mail
		let takeTeamDetail =
			await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
				takeFlTeamId
			);
		let takeTeamOwner = takeTeamDetail.teamOwner;
		let takeTeamOwnerDetail = await UserHelper.foundUserById(takeTeamOwner);
		let takeTeamOwnerEmail = takeTeamOwnerDetail.userDetail.email;
		let giveTeamDetail =
			await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
				giveFlTeamId
			);
		let giveTeamOwner = giveTeamDetail.teamOwner;
		let giveTeamName = giveTeamDetail.teamViewName;
		let giveTeamOwnerDetail = await UserHelper.foundUserById(giveTeamOwner);
		let giveTeamOwnerEmail = giveTeamOwnerDetail.userDetail.email;
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
				fantasyLeagueId
			);
		let flName;
		if (fantasyLeagueDetail != null) {
			flName = fantasyLeagueDetail.flName;
		} else {
			flName = "";
		}
		let subject = "Trade Proposal Response - OnlineBattleGround (OBG)";
		let message = ".";
		const replacements = {
			link: "go.onlinebattleground.com", // hard code because env update issue
			flName: flName,
			teamName: giveTeamName,
			approvedStatus: approvedStatus,
			appName: process.env.APP_NAME,
			mailFrom: process.env.MAIL_FROM,
		};
		EmailHelper.sendEmail(
			giveTeamOwnerEmail,
			subject,
			message,
			"tradeProposalResponse",
			replacements
		);
		//
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.tradeMoveDetailData = tradeMoveFinalObj;
		return res.status(response.code).json(response);
	}
};
///////////////////////// Use with in FantasyLeague controller ///////////////////////////////////////////////

// Create Fantasy Team
exports.createFantasyTeamForUser = async (
	userId,
	fantasyLeagueId,
	teamSize,
	totalTeams
) => {
	let userData = await UserHelper.foundUserById(userId);
	let userName = userData.userDetail.userName;
	let teamViewName = "Team " + userName;
	// let teamTitleImage = userData.profileImage
	let newFantasyTeamId = await FantasyTeamHelper.creatFantasyTeam(
		teamViewName,
		userId,
		fantasyLeagueId,
		teamSize,
		totalTeams
	);
	return newFantasyTeamId;
};
// Get Fantasy League Detail Data
exports.userFantasyLeagueDetailData = async (userId, fantasyLeagueId) => {
	let fantasyLeagueObj;
	let fantasyLeagueDetail =
		await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
	if (fantasyLeagueDetail != null) {
		let myFantasyTeam = {};
		let otherFantasyLeagueTeams = [];
		let leagueJoined = false;
		let flAdmin;
		let createdBy = fantasyLeagueDetail.createdBy;
		let leagueId = fantasyLeagueDetail.league;
		if (createdBy.toString() == userId.toString()) {
			flAdmin = true;
		} else {
			flAdmin = false;
		}
		if (fantasyLeagueDetail.flTeams.length > 0) {
			let fantasyTeamArr = fantasyLeagueDetail.flTeams;
			for (let i = 0; i < fantasyLeagueDetail.flTeams.length; i++) {
				let fantasyTeamId = fantasyLeagueDetail.flTeams[i];
				let teamImage;
				let teamDetail =
					await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
						fantasyTeamId
					);
				if (teamDetail != null) {
					let teamOwner = teamDetail.teamOwner;
					let teamOwnerDetail = await UserHelper.foundUserById(teamOwner);
					if (teamOwnerDetail != null) {
						teamImage = teamOwnerDetail.profileImage;
					}
					if (teamDetail.teamOwner.toString() == userId.toString()) {
						leagueJoined = true;
						myFantasyTeam = {
							_id: teamDetail._id,
							teamTitleImage: teamImage,
							teamViewName: teamDetail.teamViewName,
						};
					}
					if (teamDetail.teamOwner.toString() != userId.toString()) {
						let otherFantasyTeam = {
							_id: teamDetail._id,
							teamTitleImage: teamImage,
							teamViewName: teamDetail.teamViewName,
						};
						otherFantasyLeagueTeams.push(otherFantasyTeam);
					}
				}
			}
		}
		// leagueJoined: leagueJoined,
		let flJoined = await this.fantasyLeagueJoinCheckForUser(
			userId,
			fantasyLeagueId
		);
		fantasyLeagueObj = {
			_id: fantasyLeagueDetail._id,
			flTitleImage: fantasyLeagueDetail.flTitleImage,
			flName: fantasyLeagueDetail.flName,
			totalTeams: fantasyLeagueDetail.totalTeams,
			registeredTeams: fantasyLeagueDetail.flTeams.length,
			teamSize: fantasyLeagueDetail.teamSize,
			draftDateAndTime: fantasyLeagueDetail.draftDateAndTime,
			flAdmin: flAdmin,
			leagueJoined: flJoined,
			leagueId: leagueId,
			myTeam: myFantasyTeam,
			otherTeams: otherFantasyLeagueTeams,
		};
	} else {
		console.log("Fl not found");
		fantasyLeagueObj = "";
	}
	return fantasyLeagueObj;
};
exports.teamMemberDetail = async (flTeamId) => {
	let teamMembersDetailArr = [];
	let newTeamDetail =
		await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flTeamId);
	if (newTeamDetail != null) {
		let teamMembers = newTeamDetail.teamMembers;
		let teamSize = newTeamDetail.teamSize;
		if (teamMembers.length < teamSize) {
			if (teamMembers.length > 0) {
				for (let i = 0; i < teamMembers.length; i++) {
					let playerId = teamMembers[i].userId;
					let userData = await UserHelper.foundUserById(playerId);
					let userObj = {
						_id: userData._id,
						userName: userData.userDetail.userName,
						profileImage: userData.profileImage,
						userPoints: userData.userPoints + " pts",
					};
					teamMembersDetailArr.push(userObj);
				}
			}
			let teamDeiffernce = parseInt(teamSize) - parseInt(teamMembers.length);
			for (let k = 0; k < teamDeiffernce; k++) {
				let userObj = {
					_id: "",
					userName: "",
					profileImage: "",
					userPoints: "",
				};
				teamMembersDetailArr.push(userObj);
			}
		} else {
			if (teamMembers.length > 0) {
				for (let i = 0; i < teamMembers.length; i++) {
					let playerId = teamMembers[i].userId;
					console.log("player Id :", playerId);
					let userData = await UserHelper.foundUserById(playerId);
					let userObj = {
						_id: userData._id,
						userName: userData.userDetail.userName,
						profileImage: userData.profileImage,
						userPoints: userData.userPoints + " pts",
					};
					teamMembersDetailArr.push(userObj);
				}
			}
		}
	}
	return teamMembersDetailArr;
};
exports.fantasyLeagueJoinCheckForUser = async (userId, flId) => {
	let flJoinCheck;
	let flJoinDetail = await FantasyTeamHelper.checkIsFlJoined(userId, flId);
	if (flJoinDetail == null) {
		flJoinCheck = false;
	} else {
		flJoinCheck = true;
	}
	return flJoinCheck;
};
/// show Player data
exports.getPlayerData = async (playerData) => {
	let playerObj = {
		_id: playerData._id,
		userName: playerData.userDetail.userName,
		profileImage: playerData.profileImage,
		userPoints: playerData.userPoints,
	};
	return playerObj;
};

// generate fl schedule data
exports.generateFantasyLeagueSchedule = async (
	roundNumber,
	totalTeams,
	participatingTeamArr,
	fantasyLeagueId,
	leagueId,
	scheduleType
) => {
	let srNo;
	let teamOneArr = [];
	let teamTwoArr = [];
	let playOffRoundNumber;
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
		if (scheduleType == "playoff") {
			let maxPlayOffRoundNumberDetail =
				await FantasyLeagueHelper.findMaxPlayOffRoundNumber(
					leagueId,
					fantasyLeagueId
				);
			console.log("playoff round detail : ", maxPlayOffRoundNumberDetail);
			if (maxPlayOffRoundNumberDetail.length != 0) {
				let maxPlayOffRoundNumber =
					maxPlayOffRoundNumberDetail[0].playOffRoundNumber;

				playOffRoundNumber = parseInt(maxPlayOffRoundNumber) + 1;
			} else {
				playOffRoundNumber = 1;
			}
		} else {
			playOffRoundNumber = 0;
		}
	}

	for (let i = 0; i < teamOneArr.length; i++) {
		let randomNumber = await TournamentAndLeagueHelper.getRandomNmmber();
		let roundId = await TournamentAndLeagueHelper.getRandomRoundId();
		let nowDate = moment().format("MMDDhhmmss");
		let id = "" + nowDate + roundId;
		srNo = i + 1;
		////
		///previous - update match next id
		let previousRoundNumber;
		if (roundNumber > 1) {
			previousRoundNumber = parseInt(roundNumber) - 1;

			await FantasyLeagueHelper.updateNextMatchId(
				leagueId,
				fantasyLeagueId,
				teamOneArr[i],
				previousRoundNumber,
				id
			);
			await FantasyLeagueHelper.updateNextMatchId(
				leagueId,
				fantasyLeagueId,
				teamTwoArr[i],
				previousRoundNumber,
				id
			);
		}

		await FantasyLeagueHelper.saveFantasyLeagueSchedule(
			roundNumber,
			srNo,
			id,
			randomNumber,
			scheduleType,
			leagueId,
			fantasyLeagueId,
			teamOneArr[i],
			teamTwoArr[i],
			playOffRoundNumber
		);
	}
};
// generate playoff league schedule data
exports.generatePlayOffLeagueSchedule = async (
	totalTeams,
	participatingTeamArr,
	roundNumber,
	leagueId,
	scheduleType,
	fantasyLeagueId
) => {
	let srNo;
	let teamOneArr = [];
	let teamTwoArr = [];
	let playOffRoundNumber;

	let firstSlicedTeamArr = participatingTeamArr.slice(0, 1);
	let secondSlicedTeamArr = participatingTeamArr.slice(1);
	console.log("1st sliced team arr : ", firstSlicedTeamArr);
	console.log("2nd sliced team arr : ", secondSlicedTeamArr);

	if (scheduleType == "playoff") {
		let maxPlayOffRoundNumberDetail =
			await FantasyLeagueHelper.findMaxPlayOffRoundNumber(
				leagueId,
				fantasyLeagueId
			);
		let maxPlayOffRoundNumber =
			maxPlayOffRoundNumberDetail[0].playOffRoundNumber;

		playOffRoundNumber = parseInt(maxPlayOffRoundNumber) + 1;
	} else {
		playOffRoundNumber = 0;
	}

	let i = 0;

	let previousRoundNumber;

	previousRoundNumber = parseInt(roundNumber) - 1;

	let randomNumber = await TournamentAndLeagueHelper.getRandomNmmber();
	let roundId = await TournamentAndLeagueHelper.getRandomRoundId();
	let nowDate = moment().format("MMDDhhmmss");
	let id = "" + nowDate + roundId;
	srNo = 1;

	await FantasyLeagueHelper.updateNextMatchId(
		leagueId,
		fantasyLeagueId,
		firstSlicedTeamArr[0],
		previousRoundNumber,
		id
	);

	await FantasyLeagueHelper.saveFantasyLeagueSchedule(
		roundNumber,
		srNo,
		id,
		randomNumber,
		scheduleType,
		leagueId,
		fantasyLeagueId,
		firstSlicedTeamArr[0],
		null,
		playOffRoundNumber
	);

	let randomNumberForSecond = await TournamentAndLeagueHelper.getRandomNmmber();
	let roundIdForSecond = await TournamentAndLeagueHelper.getRandomRoundId();
	let nowDateForSecond = moment().format("MMDDhhmmss");
	let idForSecond = "" + nowDateForSecond + roundIdForSecond;
	srNo = 2;
	await FantasyLeagueHelper.updateNextMatchId(
		leagueId,
		fantasyLeagueId,
		secondSlicedTeamArr[1],
		previousRoundNumber,
		idForSecond
	);

	await FantasyLeagueHelper.saveFantasyLeagueSchedule(
		roundNumber,
		srNo,
		idForSecond,
		randomNumberForSecond,
		scheduleType,
		leagueId,
		fantasyLeagueId,
		secondSlicedTeamArr[0],
		secondSlicedTeamArr[1],
		playOffRoundNumber
	);

	await FantasyLeagueHelper.updateWinner(
		leagueId,
		fantasyLeagueId,
		firstSlicedTeamArr[0]
	); //for update winner in qualify team
};

///get league schedule data
exports.fantasyLeagueScheduleData = async (fantasyLeagueId) => {
	let winnerTeamName;
	let leagueMatchArr = [];
	let roundCountArr = [];
	let finalLeagueMatchArr = [];
	let leagueRoundDataObject;
	let scheduleTypeForData;
	let totalTeams;
	let finalNextMatchId;
	let scheduleType;

	let m = 1; //for increament check (insert nextMatchId in two objects)
	let nextMatchValueForDummy = 1;

	let fantasyLeagueDetail =
		await FantasyLeagueHelper.findFantasyLeagueByIdWithDeleteWithPopulate(
			fantasyLeagueId
		);

	if (fantasyLeagueDetail != null) {
		totalTeams = fantasyLeagueDetail.totalTeams;
	} else {
		totalTeams = 0;
	}

	let leagueMatches = await FantasyLeagueHelper.checkLeagueSchedule(
		fantasyLeagueId
	);
	console.log("league matches count : ", leagueMatches.length);
	let matchCount = leagueMatches.length;
	console.log("f league match data");
	for (let a = 0; a < leagueMatches.length; a++) {
		roundCountArr.push(leagueMatches[a].roundNumber);
	}
	// console.log("round count array : ", roundCountArr);
	let maxRoundCount = Math.max(...roundCountArr);
	for (let k = 0; k < maxRoundCount; k++) {
		for (let l = 0; l < leagueMatches.length; l++) {
			if (leagueMatches[l].roundNumber == k + 1) {
				let teamOneName = await TournamentAndLeagueHelper.getFantasyTeamName(
					leagueMatches[l].teamOne
				);
				let teamTwoName = await TournamentAndLeagueHelper.getFantasyTeamName(
					leagueMatches[l].teamTwo
				);

				let teamOneProfileImage =
					await TournamentAndLeagueHelper.getFantasyTeamProfileImage(
						leagueMatches[l].teamOne
					);
				let teamTwoProfileImage =
					await TournamentAndLeagueHelper.getFantasyTeamProfileImage(
						leagueMatches[l].teamTwo
					);
				let winnerTeamId = leagueMatches[l].winner;
				let matchId = leagueMatches[l].randomMatchId;
				// let leagueResutlDetailByMatchId = await LeagueResultHelper.findPendingResultByMatchId(matchId)
				// let leagueTotalResultByMatchId = await LeagueResultHelper.findTotalResultBuMatchId(matchId)
				//  let totalSubmittedResult = leagueTotalResultByMatchId.length
				// if (leagueResutlDetailByMatchId.length == 0 && totalSubmittedResult == 2) {
				winnerTeamName = await TournamentAndLeagueHelper.getFantasyTeamName(
					winnerTeamId
				);
				// } else {
				//     winnerTeamName = ""
				// }

				let roundNumber = k + 1;
				scheduleType = leagueMatches[l].scheduleType;
				let name = "Match_Id : " + matchId;

				let resultTextOne;
				let resultTextTwo;
				let isWinnerOne;
				let isWinnerTwo;
				if (leagueMatches[l].winner != null) {
					if (
						leagueMatches[l].winner.toString() ==
						leagueMatches[l].teamOne.toString()
					) {
						resultTextOne = "win";
						resultTextTwo = "loss";
						isWinnerOne = true;
						isWinnerTwo = false;
					} else if (
						leagueMatches[l].winner.toString() ==
						leagueMatches[l].teamTwo.toString()
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

				if (leagueMatches[l].nextMatchId == 0) {
					if (m == 2) {
						finalNextMatchId = nextMatchValueForDummy++;
					} else {
						finalNextMatchId = nextMatchValueForDummy;
					}
				} else {
					finalNextMatchId = leagueMatches[l].nextMatchId;
				}
				if (m == 2) {
					m = 1;
				} else {
					m++;
				}
				if (leagueMatches[l].scheduleType == "final") {
					finalNextMatchId = 0;
				} else {
					finalNextMatchId = finalNextMatchId;
				}
				let leagueMatchObj;
				if (teamTwoName == "") {
					leagueMatchObj = {
						_id: leagueMatches[l]._id,
						id: leagueMatches[l].id,
						match: leagueMatches[l].rowNumber,
						name: "Qualify for Final",
						matchId: "",
						scheduleType: leagueMatches[l].scheduleType,
						winner: teamOneName,
						nextMatchId: finalNextMatchId,
						nextLooserMatchId: leagueMatches[l].nextLooserMatchId,
						tournamentRoundText: roundNumber,
						participants: [
							{
								id: leagueMatches[l]?.teamOne,
								name: teamOneName,
								resultText: resultTextOne,
								isWinner: isWinnerOne,
								status: null,
								picture: teamOneProfileImage,
							},
						],
					};
				} else {
					leagueMatchObj = {
						_id: leagueMatches[l]._id,
						id: leagueMatches[l].id,
						match: leagueMatches[l].rowNumber,
						name: name,
						matchId: leagueMatches[l].randomMatchId,
						scheduleType: leagueMatches[l].scheduleType,
						winner: winnerTeamName,
						nextMatchId: finalNextMatchId,
						nextLooserMatchId: leagueMatches[l].nextLooserMatchId,
						tournamentRoundText: roundNumber,
						participants: [
							{
								id: leagueMatches[l]?.teamOne,
								name: teamOneName,
								resultText: resultTextOne,
								isWinner: isWinnerOne,
								status: null,
								picture: teamOneProfileImage,
							},
							{
								id: leagueMatches[l]?.teamTwo,
								name: teamTwoName,
								resultText: resultTextTwo,
								isWinner: isWinnerTwo,
								status: null,
								picture: teamTwoProfileImage,
							},
						],
					};
				}

				leagueMatchArr.push(leagueMatchObj);
			}
		}
	}
	console.log("total teams : ", totalTeams);
	if (totalTeams == 32) {
		console.log("32 teams");
		if (matchCount == 16) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForSisteenTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 24) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForEightTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 28) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 30) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 32) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 33) {
			if (scheduleType != "final") {
				let dummyTeamArr =
					await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
				finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
			} else {
				finalLeagueMatchArr = leagueMatchArr;
			}
		} else {
			finalLeagueMatchArr = leagueMatchArr;
		}
	} else if (totalTeams == 16) {
		console.log("16 teams");
		if (matchCount == 8) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForEightTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 12) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 14) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 16) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 17) {
			if (scheduleType != "final") {
				let dummyTeamArr =
					await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
				finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
			} else {
				finalLeagueMatchArr = leagueMatchArr;
			}
		} else {
			finalLeagueMatchArr = leagueMatchArr;
		}
	} else if (totalTeams == 8) {
		console.log("8 teams");
		if (matchCount == 4) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForFourTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 6) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 8) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 9) {
			if (scheduleType != "final") {
				let dummyTeamArr =
					await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
				finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
			} else {
				finalLeagueMatchArr = leagueMatchArr;
			}
		} else {
			finalLeagueMatchArr = leagueMatchArr;
		}
	} else if (totalTeams == 4) {
		console.log("4 teams");

		if (matchCount == 2) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneTeams();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 4) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 6) {
			let dummyTeamArr =
				await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
			finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
		} else if (matchCount == 7) {
			if (scheduleType != "final") {
				let dummyTeamArr =
					await TournamentAndLeagueHelper.dummyTeamsStructureForOneFinalTeam();
				finalLeagueMatchArr = leagueMatchArr.concat(dummyTeamArr);
			} else {
				finalLeagueMatchArr = leagueMatchArr;
			}
		} else {
			finalLeagueMatchArr = leagueMatchArr;
		}
	}
	return finalLeagueMatchArr;
};

/////generate fantasy league schedule for 4 teams
exports.scheduleForFourTeams = async (
	teamArr,
	maxRoundNumber,
	fantasyLeagueId,
	leagueId
) => {
	let roundNumber = parseInt(maxRoundNumber) + 1;
	let checkFanatasyLeagueScheduleExist =
		await FantasyLeagueHelper.findFlScheduleByFantasyLeagueId(fantasyLeagueId);
	if (checkFanatasyLeagueScheduleExist.length > 0) {
		let checkFantasyLeagueCompleteAndWinnerByPlayoff =
			await FantasyLeagueHelper.checkAlreadyLeagueScheduleForPlayoff(
				fantasyLeagueId,
				roundNumber
			);
		if (checkFantasyLeagueCompleteAndWinnerByPlayoff.length > 0) {
			console.log("pending 4");
			return await this.fantasyLeagueScheduleData(fantasyLeagueId);
		}
		if (checkFantasyLeagueCompleteAndWinnerByPlayoff.length == 0) {
			let scheduleType = "playoff";
			let totalTeams = teamArr.length;
			await this.generateFantasyLeagueSchedule(
				roundNumber,
				totalTeams,
				teamArr,
				fantasyLeagueId,
				leagueId,
				scheduleType
			);
		}
	} else {
		let scheduleType = "playoff";
		let totalTeams = teamArr.length;
		await this.generateFantasyLeagueSchedule(
			roundNumber,
			totalTeams,
			teamArr,
			fantasyLeagueId,
			leagueId,
			scheduleType
		);
	}
	return await this.fantasyLeagueScheduleData(fantasyLeagueId);
};
//generate league schedule for 2 teams
exports.scheduleForTwoTeams = async (
	maxRoundNumber,
	fantasyLeagueId,
	leagueId
) => {
	console.log("2 schedule");

	let winnerTeam;
	let firstTeam;
	let secondTeam;
	let matchOneData =
		await FantasyLeagueHelper.getPlayOffMatchDataWithRoundNumber(
			fantasyLeagueId,
			maxRoundNumber,
			1
		); //1 is row number(match number)

	if (matchOneData.teamOne.toString() == matchOneData.winner.toString()) {
		firstTeam = matchOneData.teamTwo;
		winnerTeam = matchOneData.teamOne;
	} else {
		firstTeam = matchOneData.teamOne;
		winnerTeam = matchOneData.teamTwo;
	}

	let matchTwoData =
		await FantasyLeagueHelper.getPlayOffMatchDataWithRoundNumber(
			fantasyLeagueId,
			maxRoundNumber,
			2
		); //2 is row number(match number)
	secondTeam = matchTwoData.winner;
	let roundNumber = parseInt(maxRoundNumber) + 1;
	let teamArr = []; // empty array from previous value
	teamArr.push(winnerTeam); //for new (front-end) logic
	teamArr.push(firstTeam);
	teamArr.push(secondTeam);
	let scheduleType = "playoff";
	let totalTeams = teamArr.length;

	await this.generatePlayOffLeagueSchedule(
		totalTeams,
		teamArr,
		roundNumber,
		leagueId,
		scheduleType,
		fantasyLeagueId
	);
	return await this.fantasyLeagueScheduleData(fantasyLeagueId);
};
//generate one schedule
exports.scheduleForOneTeam = async (
	maxRoundNumber,
	previousRoundWinnerTeamsArr,
	fantasyLeagueId,
	leagueId
) => {
	let checkFinalScheduleRequired =
		await FantasyLeagueHelper.findLeagueScheduleDetailByRoundNumber(
			maxRoundNumber,
			fantasyLeagueId
		);
	if (checkFinalScheduleRequired.scheduleType != "final") {
		console.log("not final exist");
		let oldRoundNumber = parseInt(maxRoundNumber) - 1;
		let previousMatchDataToGetFirstQualifyTeam =
			await FantasyLeagueHelper.getPlayOffMatchDataWithRoundNumber(
				fantasyLeagueId,
				oldRoundNumber,
				1
			);
		let previousQualifyTeamId = previousMatchDataToGetFirstQualifyTeam.winner;
		let secondTeamIdForFinal = previousRoundWinnerTeamsArr[0].flTeamId; ////******
		let teamArr = []; //empty array from previous value
		teamArr.push(previousQualifyTeamId);
		teamArr.push(secondTeamIdForFinal);
		let roundNumber = parseInt(maxRoundNumber) + 1;
		let scheduleType = "final";
		let totalTeams = teamArr.length;
		await this.generateFantasyLeagueSchedule(
			roundNumber,
			totalTeams,
			teamArr,
			fantasyLeagueId,
			leagueId,
			scheduleType
		);
		return await this.fantasyLeagueScheduleData(fantasyLeagueId);
	} else {
		console.log("winner announced");
		return await this.fantasyLeagueScheduleData(fantasyLeagueId);
	}
};
exports.arrSum = async (arr) => {
	return arr.reduce((x, y) => x + y, 0);
};
exports.leaderboardDataDetail = async (fantasyLeagueId) => {
	let teamPointsArr = [];
	let sortedTeamPointsArr = [];
	let finalTeamPointsArr = [];
	let fantasyLeagueDetail =
		await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
	if (fantasyLeagueDetail != null) {
		let flTeams = fantasyLeagueDetail.flTeams;
		for (let i = 0; i < flTeams.length; i++) {
			let flTeamId = flTeams[i];
			let allFlTeamPointsArr = await FantasyLeagueHelper.getAllFlTeamPointsList(
				fantasyLeagueId,
				flTeamId
			);
			let pointsArr = [];
			for (let j = 0; j < allFlTeamPointsArr.length; j++) {
				pointsArr.push(allFlTeamPointsArr[j].points);
			}
			let teamSumPoints = await this.arrSum(pointsArr);
			teamPointsArr.push({
				flTeamId: flTeamId,
				teamTotalPoints: teamSumPoints,
			});
		}
		if (teamPointsArr.length > 0) {
			sortedTeamPointsArr = teamPointsArr.sort(
				(a, b) => b.teamTotalPoints - a.teamTotalPoints
			);
		}
		if (sortedTeamPointsArr.length > 0) {
			for (let k = 0; k < sortedTeamPointsArr.length; k++) {
				let flTeamIdForDetail = sortedTeamPointsArr[k].flTeamId;
				let newFlTeamDetail =
					await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
						flTeamIdForDetail
					);
				if (newFlTeamDetail != null) {
					let flTeamName = newFlTeamDetail.teamViewName;
					let leaderBoardObj = {
						rank: k + 1,
						_id: newFlTeamDetail._id,
						flTeamName: flTeamName,
						points: sortedTeamPointsArr[k].teamTotalPoints,
					};
					finalTeamPointsArr.push(leaderBoardObj);
				}
			}
		}
	}
	return finalTeamPointsArr;
};
exports.getLeaguePlayersList = async (leagueId) => {
	let leaguePlayerArr = [];
	let leagueDetail = await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
		leagueId
	);
	if (leagueDetail != null) {
		let leagueTeams = leagueDetail.participatingTeams;
		if (leagueTeams.length > 0) {
			for (let i = 0; i < leagueTeams.length; i++) {
				let teamId = leagueTeams[i];
				let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				if (teamDetail != null) {
					let teamMembersArr = teamDetail.teamMembers;
					if (teamMembersArr.length > 0) {
						for (let j = 0; j < teamMembersArr.length; j++) {
							let playerId = teamMembersArr[j].userId;
							leaguePlayerArr.push(playerId);
						}
					}
				}
			}
		}
	}
	return leaguePlayerArr;
};
exports.getFantasyLeaguePlayersList = async (fantasyLeagueId) => {
	let fantasyLeaguePlayerArr = [];
	let fantasyLeagueDetail =
		await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
			fantasyLeagueId
		);
	if (fantasyLeagueDetail != null) {
		let flTeams = fantasyLeagueDetail.flTeams;
		if (flTeams.length > 0) {
			for (let i = 0; i < flTeams.length; i++) {
				let flTeamId = flTeams[i];
				let fantasyTeamDetail =
					await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
						flTeamId
					);
				if (fantasyTeamDetail != null) {
					let teamMembersArr = fantasyTeamDetail.teamMembers;
					if (teamMembersArr.length > 0) {
						for (let j = 0; j < teamMembersArr.length; j++) {
							let playerId = teamMembersArr[j].userId;
							fantasyLeaguePlayerArr.push(playerId);
						}
					}
				}
			}
		}
	}
	return fantasyLeaguePlayerArr;
};
// use in flTeamsDetail and getFlTeamPlayerList
exports.teamDetailWithPoints = async (
	flTeamId,
	leagueId,
	fantasyLeagueId,
	maxRoundNumberFromFlSchedule
) => {
	let teamPlayerFinalArr = [];
	let finalTeamArr = [];
	let flTeamData = await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
		flTeamId
	);
	if (flTeamData != null) {
		let flTeamName = flTeamData.teamViewName;
		let flTeamMembers = flTeamData.teamMembers;
		if (flTeamMembers.length > 0) {
			let teamFinalPoints = 0;
			for (let i = 0; i < flTeamMembers.length; i++) {
				let playerId = flTeamMembers[i].userId;
				let blockTradeOff = flTeamMembers[i].blockTradeOff;
				let playerDetail = await UserHelper.foundUserById(playerId);
				let userName = playerDetail.userDetail.userName;
				let profileImage = playerDetail.profileImage;
				let playerWinDetail = await matchController.matchDataByUserId(playerId);
				let playerLeaguePointsArr =
					await FantasyLeagueHelper.getPlayerPointsByLeagueIdAndMaxRoundNumber(
						playerId,
						leagueId,
						fantasyLeagueId,
						maxRoundNumberFromFlSchedule
					);
				console.log("league player points Arr : ", playerLeaguePointsArr);
				let playeFinalPoints = 0;
				if (playerLeaguePointsArr.length > 0) {
					for (let j = 0; j < playerLeaguePointsArr.length; j++) {
						let playerPoints = playerLeaguePointsArr[j].points;
						playeFinalPoints =
							parseInt(playeFinalPoints) + parseInt(playerPoints);
					}
					teamPlayerFinalArr.push({
						playerId: playerId,
						blockTradeOff: blockTradeOff,
						userName: userName,
						profileImage: profileImage,
						points: playeFinalPoints,
						win: playerWinDetail.win,
						winPercentage: playerWinDetail.winPercentage,
					});
				} else {
					teamPlayerFinalArr.push({
						playerId: playerId,
						blockTradeOff: blockTradeOff,
						userName: userName,
						profileImage: profileImage,
						points: 0,
						win: playerWinDetail.win,
						winPercentage: playerWinDetail.winPercentage,
					});
				}
			}
			if (teamPlayerFinalArr.length > 0) {
				for (let k = 0; k < teamPlayerFinalArr.length; k++) {
					let playerPoints = teamPlayerFinalArr[k].points;
					teamFinalPoints = parseInt(teamFinalPoints) + playerPoints;
				}
			}
			finalTeamArr.push({
				teamId: flTeamId,
				flTeamName: flTeamName,
				teamPoints: teamFinalPoints,
				teamData: teamPlayerFinalArr,
			});
		} else {
			console.log("else push 1");
			teamPlayerFinalArr = [];
			finalTeamArr.push({
				teamId: flTeamId,
				flTeamName: flTeamName,
				teamPoints: 0,
				teamData: teamPlayerFinalArr,
			});
		}
	}
	return finalTeamArr;
};
exports.fantasyTeamDetail = async (userId, flTeamId) => {
	let teamOwner;
	let maxRoundNumberFromFlSchedule = 1;
	let leagueId;
	let teamData = [];
	let teamDataArr = [];
	let flTeamDetail =
		await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flTeamId);
	if (flTeamDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.TEAM_NOT_FOUND
		);
		return res.status(response.code).json(response);
	} else {
		let fantasyLeagueId = flTeamDetail.teamType;
		let maxRoundNumberFromFlScheduleDetail =
			await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(
				fantasyLeagueId
			);
		if (maxRoundNumberFromFlScheduleDetail.length > 0) {
			maxRoundNumberFromFlSchedule =
				maxRoundNumberFromFlScheduleDetail[0].roundNumber;
		}
		if (userId.toString().match(flTeamDetail.teamOwner.toString())) {
			teamOwner = true;
		} else {
			teamOwner = false;
		}
		let fantasyLeagueDetail =
			await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
				fantasyLeagueId
			);
		if (fantasyLeagueDetail == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.FANTASY_LEAGUE_NOT_EXIST
			);
			return res.status(response.code).json(response);
		} else {
			leagueId = fantasyLeagueDetail.league;
		}
		let finalTeamArr = await this.teamDetailWithPoints(
			flTeamId,
			leagueId,
			fantasyLeagueId,
			maxRoundNumberFromFlSchedule
		);
		if (finalTeamArr[0].teamData.length > 0) {
			let teamData = finalTeamArr[0].teamData; //team data array
			for (let i = 0; i < finalTeamArr[0].teamData.length; i++) {
				let tradeStatus;
				let playerIdForCheck = teamData[i].playerId;
				let givePlayerRequest =
					await TradeMoveHelper.findGivePlayerForThisPlayer(
						fantasyLeagueId,
						playerIdForCheck
					);
				let takePlayerRequest =
					await TradeMoveHelper.findTakePlayerForThisPlayer(
						fantasyLeagueId,
						playerIdForCheck
					);
				if (givePlayerRequest != null || takePlayerRequest != null) {
					tradeStatus = true;
				} else {
					tradeStatus = false;
				}
				let teamObj = {
					playerId: teamData[i].playerId,
					blockTradeOff: teamData[i].blockTradeOff,
					tradeStatus: tradeStatus,
					userName: teamData[i].userName,
					profileImage: teamData[i].profileImage,
					points: teamData[i].points,
					win: teamData[i].win,
					winPercentage: teamData[i].winPercentage,
				};
				teamDataArr.push(teamObj);
			}
		} else {
			teamData = [];
		}
		let teamObj = {
			teamId: finalTeamArr[0].teamId,
			flTeamName: finalTeamArr[0].flTeamName,
			teamPoints: finalTeamArr[0].teamPoints,
			teamOwner: teamOwner,
			teamData: teamDataArr,
		};
		return teamObj;
	}
};
exports.playerCardData = async (playerId, fantasyLeagueId) => {
	let teamPlayerFinalArr = [];
	let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithoutDelete(
		fantasyLeagueId
	);
	if (flDetail == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.FANTASY_LEAGUE_NOT_EXIST
		);
		return res.status(response.code).json(response);
	} else {
		leagueId = flDetail.league;
		fantasyTeamDetail = await FantasyTeamHelper.findFantasyTeamDetailByFlId(
			fantasyLeagueId,
			playerId
		);
	}
	if (fantasyTeamDetail != null) {
		let teamMembers = fantasyTeamDetail.teamMembers;
		if (teamMembers.length > 0) {
			for (let i = 0; i < teamMembers.length; i++) {
				let teamMemberId = teamMembers[i].userId;
				if (playerId.toString().match(teamMemberId.toString())) {
					blockTradeOff = teamMembers[i].blockTradeOff;
				}
			}
		}
	}
	let maxRoundNumberFromFlScheduleDetail =
		await FantasyLeagueHelper.getLeagueDetailForMaxRoundNumber(fantasyLeagueId);
	if (maxRoundNumberFromFlScheduleDetail.length > 0) {
		maxRoundNumberFromFlSchedule =
			maxRoundNumberFromFlScheduleDetail[0].roundNumber;
	}
	let playerDetail = await UserHelper.foundUserById(playerId);
	if (playerDetail != null) {
		let userName = playerDetail.userDetail.userName;
		let profileImage = playerDetail.profileImage;
		let playerWinDetail = await matchController.matchDataByUserId(playerId);
		let playerLeaguePointsArr =
			await FantasyLeagueHelper.getPlayerPointsByLeagueIdAndMaxRoundNumber(
				playerId,
				leagueId,
				maxRoundNumberFromFlSchedule
			);
		let playeFinalPoints = 0;
		if (playerLeaguePointsArr.length > 0) {
			for (let j = 0; j < playerLeaguePointsArr.length; j++) {
				let playerPoints = playerLeaguePointsArr[j].points;
				playeFinalPoints = parseInt(playeFinalPoints) + parseInt(playerPoints);
			}
			teamPlayerFinalArr.push({
				playerId: playerId,
				blockTradeOff: blockTradeOff,
				userName: userName,
				profileImage: profileImage,
				points: playeFinalPoints,
				win: playerWinDetail.win,
				winPercentage: playerWinDetail.winPercentage,
			});
		} else {
			teamPlayerFinalArr.push({
				playerId: playerId,
				blockTradeOff: blockTradeOff,
				userName: userName,
				profileImage: profileImage,
				points: 0,
				win: playerWinDetail.win,
				winPercentage: playerWinDetail.winPercentage,
			});
		}
		return teamPlayerFinalArr;
	}
};
exports.flStartAndPendingRegistrationDetail = async (fantasyLeagueId) => {
	let suspendedStatus = false
	let fantasyLeagueDetail =
		await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
			fantasyLeagueId
		);
	let fantasyLeagueRequiredTotalTeams = fantasyLeagueDetail.totalTeams;
	let totalRegisteredTeams = fantasyLeagueDetail.flTeams.length;

	let leagueId = fantasyLeagueDetail.league;

	let leagueDetail =
		await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(leagueId);
	let leagueStartingDate = leagueDetail.startingDate;
	let startDate = moment(leagueStartingDate).format("MMM DD YYYY");
	let nowDate = moment().format("MMM DD YYYY");
	let dateCheckResult = moment(startDate).isSameOrBefore(nowDate, "day");
	console.log("start date check : ", dateCheckResult);
	if (dateCheckResult == false) {
		suspendedStatus = false
	} else {

		if (totalRegisteredTeams < fantasyLeagueRequiredTotalTeams) {
			suspendedStatus = true
		}
		else {
			suspendedStatus = false
		}
	}
	return suspendedStatus
}

