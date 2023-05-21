const atob = require("atob");
const exceljs = require("exceljs");
const moment = require("moment");
const xlsx = require("xlsx");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
// Controllers
const MatchController = require("../Controllers/MatchController");
const FranchiseController = require("../Controllers/FranchiseController");
const TournamentController = require("../Controllers/TournamentController");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const UserListHelper = require("../Services/UserListHelper");
const LeagueHelper = require("../Services/LeagueHelper");
const LeagueResultHelper = require("../Services/LeagueResultHelper");
const LeagueScheduleHelper = require("../Services/LeagueScheduleHelper");
const FantasyLeagueHelper = require("../Services/FantasyLeagueHelper");
const GameHelper = require("../Services/GameHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const LadderHelper = require("../Services/LadderHelper");
const TournamentResultHelper = require("../Services/TournamentResultHelper");
const LadderResultHelper = require("../Services/LadderResultHelper");
const TeamHelper = require("../Services/TeamHelper");
const FantasyTeamHelper = require("../Services/FantasyTeamHelper");
const ExportToExcelHelper = require("../Services/ExportToExcelService");
const MatchHelper = require("../Services/MatchHelper");
const ChatMessageHelper = require("../Services/ChatMessageHelper");
const ConversationHelper = require("../Services/ConversationHelper");
const TotalWarLadderHelper = require("../Services/TotalWarLadderHelper");
const TournamentScheduleHelper = require("../Services/TournamentScheduleHelper");
const TradeMovesHelper = require("../Services/TradeMovesHelper");
const TryoutHelper = require("../Services/TryoutHelper");
const WithdrawHelper = require("../Services/WithdrawHelper");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
//
exports.dashboardDetail = async (req, res) => {
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
		let totalUsers;
		let loggedInUser = 0;
		let loggedOutUser = 0;
		let allUser = await UserHelper.alUsersListForDashboard();
		if (allUser.length > 0) {
			totalUsers = allUser.length;
		} else {
			totalUsers = 0;
		}
		if (allUser.length > 0) {
			for (let i = 0; i < allUser.length; i++) {
				if (allUser[i].userToken != null) {
					////
					let userToken = allUser[i].userToken;
					const tokenParts = userToken.split(".");
					const encodedToken = tokenParts[1];
					const rawToken = atob(encodedToken);
					const tokenDetails = JSON.parse(rawToken);
					let tokenDate = moment(tokenDetails.exp * 1000).format("MMM DD YYYY");
					let nowDate = moment().format("MMM DD YYYY");
					let tokenTime = moment(tokenDetails.exp * 1000).format("HH:mm:a");
					let nowTime = moment().format("HH:mm:a");
					if (nowDate > tokenDate || nowDate === tokenDate) {
						console.log("check");
						if (nowTime < tokenTime) {
							loggedInUser = parseInt(loggedInUser) + 1;
						} else {
							loggedOutUser = parseInt(loggedOutUser) + 1;
						}
					} else {
						loggedInUser = parseInt(loggedInUser) + 1;
					}
					////
				}
			}
		} else {
			loggedInUser = 0;
			loggedOutUser = 0;
		}
		let allGamesDetail = await GameHelper.allGamesWithFranchiseGame();
		let allGames;
		if (allGamesDetail.length > 0) {
			allGames = allGamesDetail.length;
		} else {
			allGames = 0;
		}
		let dashboardData = {
			totalUsers: totalUsers,
			loggedInUser: loggedInUser,
			totalGames: allGames,
		};
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.dashboardData = dashboardData;
		return res.status(response.code).json(response);
	}
};
exports.listAllUser = async (req, res) => {
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
	let userRole = await tokenExtractor.getRoleFromToken(token);
	if (userRole != "Admin") {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.AUTHENTICATION_FAILED
		);
		return res.status(response.code).json(response);
	}
	if (userRole == "Admin") {
		let userObjArr = [];
		let userList;
		let pageNo;
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!request.pageNo) {
			pageNo = 1;
		}

		let paramUserName = req.query.query
		userList = await UserListHelper.usersListWithPagination(pageNo, paramUserName);

		if (userList.data.length > 0) {
			for (let i = 0; i < userList.data.length; i++) {
				let matchData = await MatchController.matchDataByUserId(
					userList.data[i]._id
				);
				let userObj = {
					profileImage: userList.data[i].profileImage,
					backgroundImage: userList.data[i].backgroundImage,
					userDetail: userList.data[i].userDetail,
					role: userList.data[i].role,
					isDeleted: userList.data[i].isDeleted,
					deletedAt: userList.data[i].deletedAt,
					_id: userList.data[i]._id,
					isOnline: userList.data[i].isOnline,
					createdAt: userList.data[i].createdAt,
					updatedAt: userList.data[i].updatedAt,
					matches: matchData.matches,
					win: matchData.win,
					loss: matchData.loss,
					winPercentage: matchData.winPercentage,
				};
				userObjArr.push(userObj);
			}
		}
		let pagination = userList.pagination;
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.userData = { ...pagination, data: userObjArr };
		return res.status(response.code).json(response);
	}
};
exports.editUser = async (req, res, next) => {
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
	let userRole = await tokenExtractor.getRoleFromToken(token);
	if (userRole != "Admin") {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.AUTHENTICATION_FAILED
		);
		return res.status(response.code).json(response);
	}
	if (userRole == "Admin") {
		let user = await UserHelper.foundUserById(request.id);
		if (user == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_NOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (user != null) {
			// let credits = parseInt(request.credits.replace(/[^0-9\.]/g, ''), 10)
			// let ss = credits.toString()
			// let format = /^[0-9]+$/g;
			// if (!ss.match(format)) {
			//     response = ResponseHelper.setResponse(
			//         ResponseCode.NOT_SUCCESS,
			//         Message.CREDIT_AMOUNT_NOT_CORRECT
			//     );
			//     return res.status(response.code).json(response);
			// }

			// if (request.credits) {
			// 	let credit = Number(request.credits.replace(/[^0-9\.]+/g, ""));
			// 	let checkCredit = isNaN(credit);
			// 	if (checkCredit == true) {
			// 		response = ResponseHelper.setResponse(
			// 			ResponseCode.NOT_SUCCESS,
			// 			Message.CREDIT_AMOUNT_NOT_CORRECT
			// 		);
			// 		return res.status(response.code).json(response);
			// 	}
			// }
			await UserHelper.updateUser(request);
			let userData = await UserHelper.foundUserById(request.id);

			let userMatchData = await MatchController.matchDataByUserId(request.id);

			///////////////
			let userFinalObj = {
				profileImage: userData.profileImage,
				backgroundImage: userData.backgroundImage,
				userDetail: {
					userName: userData.userDetail.userName,
					fullName: userData.userDetail.fullName,
					email: userData.userDetail.email,
					matches: userMatchData.matches,
					wins: userMatchData.win,
					losses: userMatchData.loss,
					winPercentage: userMatchData.winPercentage,
					friends: userData.userDetail.friends,
					credits: userData.userDetail.credits,
					tags: userData.userDetail.tags,
					resetPasswordToken: userData.userDetail.resetPasswordToken,
					resetPasswordExpires: userData.userDetail.resetPasswordExpires,
					about: userData.userDetail.about,
				},
				role: userData.role,
				userToken: userData.userToken,
				userPoints: userData.userPoints,
				isOnline: userData.isOnline,
				isDeleted: userData.isDeleted,
				deletedAt: userData.deletedAt,
				_id: userData._id,
				password: userData.password,
				createdAt: userData.createdAt,
				updatedAt: userData.updatedAt,
			};
			////////////////
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.user = userFinalObj;
			return res.status(response.code).json(response);
		}
	}
};
exports.deleteUsers = async (req, res, next) => {
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
	let userRole = await tokenExtractor.getRoleFromToken(token);
	if (userRole != "Admin") {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.AUTHENTICATION_FAILED
		);
		return res.status(response.code).json(response);
	}
	if (userRole == "Admin") {
		let idArr = [];
		let emailArr = request.email;
		for (let i = 0; i < emailArr.length; i++) {
			let user = await UserHelper.foundUserByEmail(emailArr[i]);
			idArr.push(user._id);
		}
		await UserHelper.deleteUsers(idArr);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.users = emailArr;
		return res.status(response.code).json(response);
	}
};
exports.showAllGames = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let result;
	let pageNo;
	if (request.pageNo) {
		pageNo = request.pageNo;
	}
	if (!request.pageNo) {
		pageNo = 1;
	}
	result = await GameHelper.gamesWithGameNameWithPagination(
		pageNo, req.query.query
	);

	let pagination = result.pagination;
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.allGame = { ...pagination, data: result.data };
	return res.status(response.code).json(response);
};
///
// export data
exports.exportUserData = async (req, res) => {
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
		let allUsers = await UserHelper.alUsersList();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Users", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "I1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "I2");
		worksheet.getCell("A2").value = "All Users Record";
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(3).values = [
			"Sr no.",
			"Name",
			"Username",
			"Email",
			"Credits",
			"Matches",
			"Wins",
			"Losses",
			"Win Percentage",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "name", width: "10" },
			{ key: "username", width: "10" },
			{ key: "email", width: "10" },
			{ key: "credits", width: "10" },
			{ key: "matches", width: "10" },
			{ key: "wins", width: "10" },
			{ key: "losses", width: "10" },
			{ key: "winPercentage", width: "10" },
		];
		if (allUsers.length > 0) {
			for (let i = 0; i < allUsers.length; i++) {
				let userId = allUsers[i]._id;
				let userMatchObj = await MatchController.matchDataByUserId(userId);
				allUsers[i].sr_no = i + 1;
				allUsers[i].name = allUsers[i].userDetail.fullName;
				allUsers[i].username = allUsers[i].userDetail.userName;
				allUsers[i].email = allUsers[i].userDetail.email;
				allUsers[i].credits = allUsers[i].userDetail.credits;
				allUsers[i].matches = userMatchObj.matches;
				allUsers[i].wins = userMatchObj.win;
				allUsers[i].losses = userMatchObj.loss;
				allUsers[i].winPercentage = userMatchObj.winPercentage;
				worksheet.addRow(allUsers[i]);
			}
		} else {
			worksheet.addRow("");
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/User/all_users_data.xlsx"
		); //"D:\\Excel node js\\userlist.xlsx"
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath = "Uploads\\Excel\\User\\all_users_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportTournamentData = async (req, res) => {
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
		let tournamentData =
			await TournamentHelper.allTournamentListForExportWithoutDeleted();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Tournaments", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "H1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "H2");
		worksheet.getCell("A2").value = "All Tournaments Record";
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(3).values = [
			"Sr no.",
			"Tournament Name",
			"Game",
			"Entry Fee",
			"Prize",
			"Team Size",
			"Total Teams",
			"Start Date Time",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "tournamentName", width: "10" },
			{ key: "game", width: "10" },
			{ key: "entryFee", width: "10" },
			{ key: "prize", width: "10" },
			{ key: "teamSize", width: "10" },
			{ key: "totalTeams", width: "10" },
			{ key: "startingDateAndTime", width: "10" },
		];
		if (tournamentData.length > 0) {
			for (let i = 0; i < tournamentData.length; i++) {
				let gameName;
				let gameId = tournamentData[i].gameToPlay;
				let gameDetail = await GameHelper.findGameById(gameId);
				if (gameDetail != null) {
					gameName = gameDetail.gameName;
				} else {
					gameName = "game_not_found";
				}
				let startingDateAndTime = moment(
					tournamentData[i].startingDateAndTime
				).format("Do MMM YYYY, hh:mm a");
				tournamentData[i].sr_no = i + 1;
				tournamentData[i].tounamentName = tournamentData[i].tournamentName;
				tournamentData[i].game = gameName;
				tournamentData[i].entryFee = tournamentData[i].entryFee;
				tournamentData[i].prize = tournamentData[i].prize;
				tournamentData[i].teamSize = tournamentData[i].teamSize;
				tournamentData[i].totalTeams = tournamentData[i].totalTeams;
				tournamentData[i].startingDateAndTime = startingDateAndTime;
				worksheet.addRow(tournamentData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/Tournament/all_tournament_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath =
			"Uploads\\Excel\\Tournament\\all_tournament_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportLadderData = async (req, res) => {
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
		let ladderData = await LadderHelper.allLaddersListWithoutDeleted();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Ladders", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "I1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "I2");
		worksheet.getCell("A2").value = "All Ladders Record";
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(3).values = [
			"Sr no.",
			"Ladder Name",
			"Game",
			"Entry Fee",
			"Prize",
			"Team Size",
			"Total Teams",
			"Start Date Time",
			"End Date Time",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "ladderName", width: "10" },
			{ key: "game", width: "10" },
			{ key: "entryFee", width: "10" },
			{ key: "prize", width: "10" },
			{ key: "teamSize", width: "10" },
			{ key: "totalTeams", width: "10" },
			{ key: "startingDateAndTime", width: "10" },
			{ key: "endingDateAndTime", width: "10" },
		];
		if (ladderData.length > 0) {
			for (let i = 0; i < ladderData.length; i++) {
				let gameName;
				let gameId = ladderData[i].gameToPlay;
				let gameDetail = await GameHelper.findGameById(gameId);
				if (gameDetail != null) {
					gameName = gameDetail.gameName;
				} else {
					gameName = "game_not_found";
				}
				let startingDateAndTime = moment(
					ladderData[i].startingDateAndTime
				).format("Do MMM YYYY, hh:mm a");
				let endingDateAndTime = moment(ladderData[i].endingDateAndTime).format(
					"Do MMM YYYY, hh:mm a"
				);
				ladderData[i].sr_no = i + 1;
				ladderData[i].ladderName = ladderData[i].ladderName;
				ladderData[i].game = gameName;
				ladderData[i].entryFee = ladderData[i].entryFee;
				ladderData[i].prize = ladderData[i].prize;
				ladderData[i].teamSize = ladderData[i].teamSize;
				ladderData[i].totalTeams = ladderData[i].totalTeams;
				ladderData[i].startingDateAndTime = startingDateAndTime;
				ladderData[i].endingDateAndTime = endingDateAndTime;
				worksheet.addRow(ladderData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/Ladder/all_ladder_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath = "Uploads\\Excel\\Ladder\\all_ladder_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportTournamentResultData = async (req, res) => {
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
		let tournamentResult =
			await TournamentResultHelper.findTournamentForResult();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Tournament Results", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "F1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "F2");
		worksheet.getCell("A2").value = "All Tournament Results";
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(3).values = [
			"Sr no.",
			"User/Team",
			"Tournament Name",
			"Game",
			"Score",
			"Result",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "team", width: "10" },
			{ key: "tournamentName", width: "10" },
			{ key: "game", width: "10" },
			{ key: "score", widht: "10" },
			{ key: "result", width: "10" },
		];
		if (tournamentResult.length > 0) {
			for (let i = 0; i < tournamentResult.length; i++) {
				let teamName;
				let teamId = tournamentResult[i].teamId;
				let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				if (teamDetail != null) {
					teamName = teamDetail.teamViewName;
				} else {
					teamName = "team not found";
				}
				tournamentResult[i].sr_no = i + 1;
				tournamentResult[i].team = teamName;
				tournamentResult[i].tounamentName = tournamentResult[i].tounamentName;
				tournamentResult[i].game = tournamentResult[i].gameToPlay.gameName;
				tournamentResult[i].score = tournamentResult[i].score;
				tournamentResult[i].result = tournamentResult[i].result;
				worksheet.addRow(tournamentResult[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/Tournament/all_tournament_results_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath =
			"Uploads\\Excel\\Tournament\\all_tournament_results_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportLadderResultData = async (req, res) => {
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
		let ladderResultData = await LadderResultHelper.showAllLadderRecord();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Ladder Results", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "F1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "F2");
		worksheet.getCell("A2").value = "All Ladder Results";
		///
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		///
		worksheet.getRow(3).values = [
			"Sr no.",
			"User/Team",
			"Ladder Name",
			"Game",
			"Score",
			"Result",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "team", width: "10" },
			{ key: "ladderName", width: "10" },
			{ key: "game", width: "10" },
			{ key: "score", widht: "10" },
			{ key: "result", width: "10" },
		];
		if (ladderResultData.length > 0) {
			for (let i = 0; i < ladderResultData.length; i++) {
				let teamName;
				let teamId = ladderResultData[i].teamId;
				let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				if (teamDetail != null) {
					teamName = teamDetail.teamViewName;
				} else {
					teamName = "team not found";
				}
				ladderResultData[i].sr_no = i + 1;
				ladderResultData[i].team = teamName;
				ladderResultData[i].ladderName = ladderResultData[i].ladderName;
				ladderResultData[i].game = ladderResultData[i].gameToPlay.gameName;
				ladderResultData[i].score = ladderResultData[i].score;
				ladderResultData[i].result = ladderResultData[i].result;
				worksheet.addRow(ladderResultData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/Ladder/all_ladder_results_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath =
			"Uploads\\Excel\\Ladder\\all_ladder_results_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportGrandPrixData = async (req, res) => {
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
		let gpData = await FranchiseHelper.showAllFranchiseWithoutDelete();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Grand Prix Data", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "I1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "I2");
		worksheet.getCell("A2").value = "Grand Prix Record";
		///
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		///
		worksheet.getRow(3).values = [
			"Sr no.",
			"GP Name",
			"Total Teams",
			"Owner",
			"Owner Occupation",
			"Owner Icome(yearly)",
			"Owner Address",
			"Block/Unblock",
			"Approved Status",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "franchiseName", width: "10" },
			{ key: "totalTeams", width: "10" },
			{ key: "ownerName", width: "10" },
			{ key: "occupation", width: "10" },
			{ key: "ownerIncome", widht: "10" },
			{ key: "ownerAddress", width: "10" },
			{ key: "isBlockStatus", width: "10" },
			{ key: "approvedStatus", width: "10" },
		];
		if (gpData.length > 0) {
			for (let i = 0; i < gpData.length; i++) {
				let blockStatus;
				if (gpData[i].isBlock == false) {
					blockStatus = "Unblock";
				} else {
					blockStatus = "Block";
				}
				gpData[i].sr_no = i + 1;
				gpData[i].franchiseName = gpData[i].franchiseName;
				gpData[i].totalTeams = gpData[i].franchiseTeams.length;
				gpData[i].ownerName = gpData[i].createdByName;
				gpData[i].occupation = gpData[i].occupation;
				gpData[i].ownerIncome = gpData[i].yearlyIncome;
				gpData[i].ownerAddress = gpData[i].address;
				gpData[i].isBlockStatus = blockStatus;
				gpData[i].approvedStatus = gpData[i].approvedStatus;
				worksheet.addRow(gpData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/GrandPrix/all_grand_prix_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath =
			"Uploads\\Excel\\GrandPrix\\all_grand_prix_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportGpLeagueData = async (req, res) => {
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
		let gpLeagueData = await LeagueHelper.allLeaguesWithoutDelete();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Grand Prix Leagues Data", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "J1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "J2");
		worksheet.getCell("A2").value = "Grand Prix Leagues Record";
		///
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		///
		worksheet.getRow(3).values = [
			"Sr no.",
			"League Name",
			"Year",
			"Entry Fee",
			"Prize",
			"Team Size",
			"Total Teams",
			"Starting Date",
			"Ending Date",
			"Winner",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "leagueName", width: "10" },
			{ key: "year", width: "10" },
			{ key: "entryFee", width: "10" },
			{ key: "prize", width: "10" },
			{ key: "teamSize", width: "10" },
			{ key: "totalTeams", width: "10" },
			{ key: "startingDate", width: "10" },
			{ key: "endingDate", width: "10" },
			{ key: "winner", width: "10" },
		];
		if (gpLeagueData.length > 0) {
			for (let i = 0; i < gpLeagueData.length; i++) {
				let gameName;
				let gameId = gpLeagueData[i].gameToPlay;
				let gameDetail = await GameHelper.findGameById(gameId);
				if (gameDetail != null) {
					gameName = gameDetail.gameName;
				} else {
					gameName = "game_not_found";
				}
				let winningTeam;
				if (gpLeagueData[i].winningTeam == null) {
					winningTeam = "pending";
				} else {
					let winningTeamDetail = await TeamHelper.findTeamDeatilByTeamId(
						gpLeagueData[i].winningTeam
					);
					if (winningTeamDetail != null) {
						winningTeam = winningTeamDetail.teamViewName;
					} else {
						winningTeam = "not found";
					}
				}
				let leagueYear = moment(gpLeagueData[i].startingDate).format("YYYY");
				let startDate = moment(gpLeagueData[i].startingDate).format(
					"Do MMM YYYY"
				);
				let endDate = moment(gpLeagueData[i].endingDate).format("Do MMM YYYY");
				gpLeagueData[i].sr_no = i + 1;
				gpLeagueData[i].leagueName = gpLeagueData[i].leagueName;
				gpLeagueData[i].year = leagueYear;
				gpLeagueData[i].entryFee = gpLeagueData[i].entryFee;
				gpLeagueData[i].prize = gpLeagueData[i].prize;
				gpLeagueData[i].teamSize = gpLeagueData[i].teamSize;
				gpLeagueData[i].totalTeams = gpLeagueData[i].totalTeams;
				gpLeagueData[i].startingDate = startDate;
				gpLeagueData[i].endingDate = endDate;
				gpLeagueData[i].winner = winningTeam;
				worksheet.addRow(gpLeagueData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/League/all_league_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath = "Uploads\\Excel\\League\\all_league_data.xlsx";
		return res.status(response.code).json(response);
	}
};
exports.exportFantasyLeagueData = async (req, res) => {
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
		let flData = await FantasyLeagueHelper.findAllPublicFantasyLeagues();
		let workbook = new exceljs.Workbook();
		let worksheet = workbook.addWorksheet("All Public Fantasy League Data", {
			pageSetup: { paperSize: 9, orientation: "landscape" },
		});
		// worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
		worksheet.mergeCells("A1", "H1");
		worksheet.getCell("A1").value = "Online Battle Ground";
		worksheet.mergeCells("A2", "H2");
		worksheet.getCell("A2").value = "Public Fantasy Leagues Record";
		///
		worksheet.getRow(1).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		worksheet.getRow(2).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "a6a3a3" },
			};
			cell.font = { bold: true, color: { argb: "00000000" } };
		});
		///
		worksheet.getRow(3).values = [
			"Sr no.",
			"FL Name",
			"Year",
			"Team Size",
			"Total Teams",
			"League Name",
			"Draft Date and Time",
			"Winner",
		];
		worksheet.columns = [
			{ key: "sr_no", width: "10" },
			{ key: "flName", width: "10" },
			{ key: "year", width: "10" },
			{ key: "teamSize", width: "10" },
			{ key: "totalTeams", width: "10" },
			{ key: "gpLeague", width: "10" },
			{ key: "draftDateTime", width: "10" },
			{ key: "flWinner", width: "10" },
		];
		if (flData.length > 0) {
			for (let i = 0; i < flData.length; i++) {
				let gpLeagueName;
				let gpLeagueDetail =
					await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(
						flData[i].league
					);
				if (gpLeagueDetail != null) {
					gpLeagueName = gpLeagueDetail.leagueName;
				} else {
					gpLeagueName = "not found";
				}
				let winner;
				if (flData[i].winner == null) {
					winner = "pending";
				} else {
					let winningTeamDetail =
						await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(
							flData[i].winner
						);
					if (winningTeamDetail != null) {
						winner = winningTeamDetail.teamViewName;
					} else {
						winner = "not found";
					}
				}
				let leagueYear = moment(flData[i].draftDateAndTime).format("YYYY");
				let startDateAndTime = moment(flData[i].draftDateAndTime).format(
					"Do MMM YYYY, hh:mm a"
				);
				flData[i].sr_no = i + 1;
				flData[i].flName = flData[i].leagueName;
				flData[i].year = leagueYear;
				flData[i].teamSize = flData[i].teamSize;
				flData[i].totalTeams = flData[i].totalTeams;
				flData[i].gpLeague = gpLeagueName;
				flData[i].draftDateTime = startDateAndTime;
				flData[i].flWinner = winner;
				worksheet.addRow(flData[i]);
			}
		} else {
		}
		worksheet.getRow(3).eachCell((cell) => {
			cell.fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "e14f05" },
			};
			cell.font = { bold: true, color: { argb: "00ffffff" } };
		});
		let borderStyles = {
			top: { style: "thin" },
			left: { style: "thin" },
			bottom: { style: "thin" },
			right: { style: "thin" },
		};
		worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
			row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
				cell.border = borderStyles;
				cell.alignment = { vertical: "middle", horizontal: "left" };
			});
		});
		//  worksheet.mergeCells('A1:H1');
		worksheet.headerFooter.oddHeader =
			'&C&KCCCCCC&"Aril"&LOnline Battle Ground&C&A &R&D &T';
		worksheet.headerFooter.oddFooter = "&RPage &P of &N";
		let data = await workbook.xlsx.writeFile(
			"Uploads/Excel/FantasyLeague/all_public_fantasy_league_data.xlsx"
		);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.downloadPath =
			"Uploads\\Excel\\FantasyLeague\\all_public_fantasy_league_data.xlsx";
		return res.status(response.code).json(response);
	}
};
//////////// Admin new working
exports.userInfoForAdmin = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let userInfo = await this.userInfoData(userId);
				console.log(userInfo);
				if (Object.keys(userInfo).length === 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					// console.log("user data : ", userInfo);
					let profileImage = userInfo.profileImage;
					let fullName = userInfo.fullName;
					let userName = userInfo.userName;
					let credits = userInfo.credits;
					let friends = userInfo.friends;
					let registerAt = userInfo.createdAt;
					//
					let userGeneralTeams = await TeamHelper.showTeams(userId);
					let userFranchiseTeam = await TeamHelper.findUserAllFranchiseTeams(
						userId
					);
					// let userTeamsData = await TeamController.myTeamsData(userGeneralTeams);
					let generalTeams = userGeneralTeams.length;
					let franchiseTeams = userFranchiseTeam.length;
					let totalTeams = parseInt(generalTeams) + parseInt(franchiseTeams);
					let userFranchiseData =
						await FranchiseController.getUserFranchiseModeAndFranchiseId(
							userId
						);
					let franchiseMode = userFranchiseData.mode;
					let franchiseId = userFranchiseData.franchiseId;
					let franchiseName = "";
					let franchiseOwnerName = "";
					if (franchiseId != null) {
						let franchiseDetail =
							await FranchiseHelper.findFranchiseByIdWithoutDeleteWithBlock(
								franchiseId
							);

						franchiseName = franchiseDetail?.franchiseName;
						franchiseOwnerName = franchiseDetail?.createdByName;
					}
					let userObj = {
						profileImage,
						fullName,
						userName,
						credits,
						friends,
						registerAt,
						generalTeams,
						franchiseTeams,
						totalTeams,
						franchiseMode,
						franchiseName,
						franchiseOwnerName,
					};
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL,
						userObj
					);
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
////match info
exports.matchInfoForAdmin = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let matchFinalArr = [];
	let matchResult;
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
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let userData = await this.userInfoData(userId);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let matchDetailsArr = await MatchHelper.findUserAllMatches(userId);
					// console.log(matchDetailsArr);
					if (matchDetailsArr.length > 0) {
						for (let i = 0; i < matchDetailsArr.length; i++) {
							let winningUserName;

							let winningUser = matchDetailsArr[i].winningUser;
							if (winningUser != null) {
								winningUserName = winningUser.userDetail.userName;
							} else {
								winningUserName = "";
							}
							if (winningUser != null) {
								if (
									matchDetailsArr[i].winningUser._id.toString() ==
									userId.toString()
								) {
									matchResult = "Won";
								} else {
									matchResult = "Lost";
								}
							} else {
								matchResult = "Pending";
							}
							if (matchDetailsArr[i].challengeTo != null) {
								if (
									matchDetailsArr[i].challengeBy._id.toString() ==
									userId.toString()
								) {
									challengeTo =
										matchDetailsArr[i].challengeTo.userDetail.userName;
								} else if (
									matchDetailsArr[i].challengeTo._id.toString() ==
									userId.toString()
								) {
									challengeTo =
										matchDetailsArr[i].challengeBy.userDetail.userName;
								} else {
									challengeTo = "";
								}
							} else {
								challengeTo = "";
							}
							let matchObj = {
								matchTitleImage: matchDetailsArr[i].matchTitleImage,
								status: matchDetailsArr[i].status,
								winningUser: winningUserName,
								_id: matchDetailsArr[i]._id,
								matchName: matchDetailsArr[i].matchName,
								gameToPlay: matchDetailsArr[i]?.gameToPlay?.gameName,
								challengeTo: challengeTo,
								prize: matchDetailsArr[i].prize,
								updatedAt: matchDetailsArr[i].updatedAt,
								matchResult: matchResult,
							};
							matchFinalArr.push(matchObj);
						}
					}
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.matchInfoData = {
						userData: userData,
						matchesDetail: matchFinalArr,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
///// tournament info
exports.tournamentInfoForAdmin = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let userData = await this.userInfoData(userId);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let tournamentDetailArr = [];
					let generalTeamsDetail = await TeamHelper.findUserAllTeam(userId);
					// console.log("teams : ", generalTeamsDetail);
					if (generalTeamsDetail.length > 0) {
						for (let i = 0; i < generalTeamsDetail.length; i++) {
							let teamId = generalTeamsDetail[i]._id;
							let teamViewName = generalTeamsDetail[i].teamViewName;
							let tournamentDetails =
								await TournamentHelper.teamTournamentsDetailWithPopulate(
									teamId
								);
							if (tournamentDetails.length > 0) {
								await this.tournamentObjData(
									tournamentDetails,
									teamId,
									teamViewName,
									tournamentDetailArr
								);
							}
						}
					}
					let franchiseTeamsDetail = await TeamHelper.findUserAllFranchiseTeams(
						userId
					);
					// console.log("franchise teams : ", franchiseTeamsDetail);
					if (franchiseTeamsDetail.length > 0) {
						for (let i = 0; i < franchiseTeamsDetail.length; i++) {
							let teamId = franchiseTeamsDetail[i]._id;
							let teamViewName = franchiseTeamsDetail[i].teamViewName;
							let tournamentDetails =
								await TournamentHelper.teamTournamentsDetailWithPopulate(
									teamId
								);
							if (tournamentDetails.length > 0) {
								await this.tournamentObjData(
									tournamentDetails,
									teamId,
									teamViewName,
									tournamentDetailArr
								);
							}
						}
					}
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.tournamentInfoData = {
						userData: userData,
						tournamentsDetail: tournamentDetailArr,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
///// ladder info
exports.ladderInfoForAdmin = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let ladderDetailArr = [];
				let userData = await this.userInfoData(userId);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let generalTeamsDetail = await TeamHelper.findUserAllTeam(userId);

					if (generalTeamsDetail.length > 0) {
						for (let i = 0; i < generalTeamsDetail.length; i++) {
							let teamId = generalTeamsDetail[i]._id;
							let teamViewName = generalTeamsDetail[i].teamViewName;
							let ladderDetail =
								await LadderHelper.findMyLaddersWithGamePopulate(teamId);
							if (ladderDetail.length > 0) {
								for (let k = 0; k < ladderDetail.length; k++) {
									let ladderObj = {
										ladderTitleImage: ladderDetail[k].ladderTitleImage,
										_id: ladderDetail[k]._id,
										ladderName: ladderDetail[k].ladderName,
										gameToPlay: ladderDetail[k].gameToPlay?.gameName,
										prize: ladderDetail[k].prize,
										ladderType: ladderDetail[k].ladderType || "",
										startingDateAndTime: ladderDetail[k].startingDateAndTime,
										endingDateAndTime: ladderDetail[k].endingDateAndTime,
										teamViewName: teamViewName,
									};
									ladderDetailArr.push(ladderObj);
								}
							}
						}
					}
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.ladderInfoData = {
						userData: userData,
						laddersDetail: ladderDetailArr,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
///////gp league info
exports.gpLeagueInfoForAdmin = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let responseMessage;
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
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let leagueDetailArr = [];
				let leagueResult;
				let userData = await this.userInfoData(userId);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let userFranchiseData =
						await FranchiseController.getUserFranchiseModeAndFranchiseId(
							userId
						);

					if (userFranchiseData.mode == "fMember") {
						console.log("fMember");
						let franchiseTeamsDetail =
							await TeamHelper.findUserAllFranchiseTeams(userId);
						if (franchiseTeamsDetail.length > 0) {
							for (let i = 0; i < franchiseTeamsDetail.length; i++) {
								let teamId = franchiseTeamsDetail[i]._id;
								let teamViewName = franchiseTeamsDetail[i].teamViewName;

								let teamLeagueDetail =
									await LeagueHelper.findLeaguesByParticipatingTeamIdwithPopulate(
										teamId
									);
								if (teamLeagueDetail.length > 0) {
									for (let k = 0; k < teamLeagueDetail.length; k++) {
										if (teamLeagueDetail[k].winningTeam != null) {
											if (
												teamLeagueDetail[k].winningTeam._id.toString() ==
												teamId.toString()
											) {
												leagueResult = "Won";
											} else {
												leagueResult = "Lost";
											}
										} else {
											leagueResult = "Pending";
										}
										let leagueObj = {
											ladderTitleImage: teamLeagueDetail[k].leagueTitleImage,
											_id: teamLeagueDetail[k]._id,
											leagueName: teamLeagueDetail[k].leagueName,
											gameToPlay: teamLeagueDetail[k].gameToPlay?.gameName,
											prize: teamLeagueDetail[k].prize,
											startingDateAndTime: teamLeagueDetail[k].startingDate,
											endingDateAndTime: teamLeagueDetail[k].endingDate,
											teamViewName: teamViewName,
											teamId: teamId,
											leagueResult: leagueResult,
										};
										leagueDetailArr.push(leagueObj);
									}
								}
							}
						}
						responseMessage = Message.USER_IS_FRANCHISE_MEMBER;
					} else if (userFranchiseData.mode == "fOwner") {
						console.log("fOwner");
						responseMessage =
							Message.USER_IS_FRANCHISE_OWNER_AND_CANNOT_PARTCIPATED;
					} else {
						console.log("not franchise member");
						responseMessage = Message.USER_IS_NOT_FRANCHISE_MEMBER;
					}

					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						responseMessage
					);
					response.gpLeagueInfoData = {
						userData: userData,
						gpLeaguesDetail: leagueDetailArr,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
///////fantasy league info
exports.fantasyLeagueInfoForAdmin = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	let flWinner;
	let winnerId;
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
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let userId = request._id;
				let fantasyLeagueDetailArr = [];
				let flResult;
				let userData = await this.userInfoData(userId);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let userFlTeams = await FantasyTeamHelper.findAllFantasyTeamByUserId(
						userId
					);
					if (userFlTeams.length > 0) {
						for (let i = 0; i < userFlTeams.length; i++) {
							let flTeamId = userFlTeams[i]._id;
							let flTeamName = userFlTeams[i].teamViewName;
							let flId = userFlTeams[i].teamType;
							let flDetail =
								await FantasyLeagueHelper.findFantasyLeagueByIdWithDeleteWithWinnerPopulate(
									flId
								);
							// console.log(flDetail);
							if (flDetail != null) {
								if (flDetail.winner != null) {
									flWinner = flDetail.winner.teamViewName;
									winnerId = flDetail.winner._id;
									if (flDetail.winner.toString() == flTeamId.toString()) {
										flResult = "Won";
									} else {
										flResult = "Lost";
									}
								} else {
									flWinner = "";
									winnerId = "";
									flResult = "Pending";
								}
								let flObj = {
									flTitleImage: flDetail.flTitleImage,
									flType: flDetail.flType,
									leagueName: flDetail.leagueName,
									winnerId: winnerId,
									winner: flWinner,
									_id: flDetail._id,
									flName: flDetail.flName,
									draftDateAndTime: flDetail.draftDateAndTime,
									gameName: flDetail.gameName,
									flTeamName: flTeamName,
									flTeamId: flTeamId,
									flResult: flResult,
								};
								fantasyLeagueDetailArr.push(flObj);
							}
						}
					}
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.flLeagueInfoData = {
						userData: userData,
						flLeaguesDetail: fantasyLeagueDetailArr,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
///////transaction info
exports.transactionInfoForAdmin = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role !== "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.ADMIN_REQUIRED
			);
			return res.status(response.code).json(response);
		} else {
			if (!request._id) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.MISSING_PARAMETER
				);
				return res.status(response.code).json(response);
			} else {
				let user = request._id;
				let transactionDetailArr = [];
				let userData = await this.userInfoData(user);
				if (Object.keys(userData).length == 0) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.USER_NOT_EXIST
					);
					return res.status(response.code).json(response);
				} else {
					let transactionDetail = await WithdrawHelper.getUserWithdrawHistory(
						user
					);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.transactionInfoData = {
						userData: userData,
						transactionDetail: transactionDetail,
					};
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
/////only for dev//////////////////
exports.deleteUser = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	await UserHelper.deleteUser(request.email);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.deleteUserById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	await UserHelper.deleteUserById(request.userId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.uploadAsset = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	console.log(req.file.path);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.path = req.file.path;
	return res.status(response.code).json(response);
};
exports.updateGameType = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let gameId = request.gameId;
	let gameType = request.gameType;
	await GameHelper.updateGameType(gameId, gameType);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.permanentDeleteFranchise = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let franchiseId = request.franchiseId;
	await FranchiseHelper.deleteFranchisePermanentForDev(franchiseId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.permanentDeleteGame = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let gameId = request.gameId;
	await GameHelper.permanentDeleteGame(gameId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.leagueResultDetail = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueId = request.leagueId;
	let leagueResultDetail =
		await LeagueResultHelper.findLeagueResultDetailByLeagueId(leagueId);
	console.log("league result detail : ", leagueResultDetail);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.leagueDetail = leagueResultDetail;
	return res.status(response.code).json(response);
};
exports.deleteLeagueResultDetail = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueId = request.leagueId;
	let leagueResultDetail =
		await LeagueResultHelper.findLeagueResultDetailByLeagueId(leagueId);
	console.log("league result detail : ", leagueResultDetail);
	await LeagueResultHelper.deleteLeagueResultDetailByLeagueId(leagueId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.setWinnerToNullForLeagueSchedule = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let leagueId = request.leagueId;
	let leagueScheduleDetail =
		await LeagueScheduleHelper.findLeagueScheduleByLeagueId(leagueId);
	// console.log("league schedule detail : ", leagueScheduleDetail);
	await LeagueScheduleHelper.setWinnerToNullForLeagueSchedule(leagueId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.deleteLeagueResultByResultId = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let resultId = request.resultId;
	let leagueResultDetail = await LeagueResultHelper.findLeagueResultByResultId(
		resultId
	);
	// console.log("League Result Detail: ", leagueResultDetail);
	await LeagueResultHelper.deleteLeagueResultByResultId(resultId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.deleteAllLeagues = async (req, res) => {
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
			await LeagueHelper.removeAllRecord();
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
exports.deleteAllLeagueSchedule = async (req, res) => {
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
			await LeagueScheduleHelper.removeAllLeagueSchedule();
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
exports.deleteAllLeagueResult = async (req, res) => {
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
			await LeagueResultHelper.removeAllLeagueResult();
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
exports.deleteAllFantasyLeagues = async (req, res) => {
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
			await FantasyLeagueHelper.removeAllRecord();
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
exports.deleteAllFantasyLeaguesSchedule = async (req, res) => {
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
			await FantasyLeagueHelper.removeAllSchedule();
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
exports.deleteAllFlTeamInvite = async (req, res) => {
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
			await FantasyLeagueHelper.deleteAllFlTeamInvite();
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
exports.deleteLeagueById = async (req, res) => {
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
			await LeagueHelper.deleteLeagueById(request.flId);
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

exports.deleteFantasyTeam = async (req, res) => {
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
		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await FantasyTeamHelper.deleteFantasyTeam(flTeamId);
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

exports.deleteFlTeamFromFl = async (req, res) => {
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
		let flid = request.fantasyLeagueId;
		let flTeamId = request.flTeamId;

		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await FantasyLeagueHelper.deleteFlTeamFromFl(flid, flTeamId);
			let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				flid
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

exports.changeTournamentType = async (req, res) => {
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
		let tournamentId = request.tournamentId;
		let tournamentType = request.tournamentType;

		let deleted;
		let userData = await UserHelper.foundUserById(userId);
		let role = userData.role;
		if (role === "Admin") {
			await TournamentHelper.changeTournamentType(tournamentId, tournamentType);

			deleted = "change";
		} else {
			deleted = "not change";
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.deleted = deleted;
		return res.status(response.code).json(response);
	}
};

exports.deleteAllTradeMove = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse()
	let request = req.body
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
			await TradeMovesHelper.hardDeleteAllTradeMoves()
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
}
///////////////////////////////////////////////////////////////////////////////////
///////////  use with in admin controller  ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
exports.userInfoData = async (userId) => {
	let response = ResponseHelper.getDefaultResponse();
	let _id = userId;
	let userDataObj = {};
	let userData = await UserHelper.foundUserById(_id);
	if (userData == null) {
		userDataObj = {};
	} else {
		let profileImage = userData.profileImage;
		let fullName = userData.userDetail.fullName;
		let userName = userData.userDetail.userName;
		let credits = userData.userDetail.credits;
		let friends = userData.userDetail.friends.length;
		let registerAt = userData.createdAt;
		userDataObj = {
			profileImage,
			fullName,
			userName,
			credits,
			friends,
			registerAt,
		};
	}
	return userDataObj;
};
exports.tournamentObjData = async (
	tournamentDetails,
	teamId,
	teamViewName,
	tournamentDetailArr
) => {
	let tournamentResult;
	for (let k = 0; k < tournamentDetails.length; k++) {
		let winningTeam;
		if (tournamentDetails[k].winningTeam != null) {
			winningTeam = tournamentDetails[k].winningTeam.teamViewName;
			if (
				tournamentDetails[k].winningTeam._id.toString() == teamId.toString()
			) {
				tournamentResult = "Won";
			} else {
				tournamentResult = "Lost";
			}
		} else {
			winningTeam = "";
			tournamentResult = "Pending";
		}
		let tournamentObjWithId = {
			tournamentTitleImage: tournamentDetails[k].tournamentTitleImage,
			tournamentType: tournamentDetails[k].tournamentType,
			winningTeam: winningTeam,
			_id: tournamentDetails[k]._id,
			tournamentName: tournamentDetails[k].tournamentName,
			gameToPlay: tournamentDetails[k]?.gameToPlay?.gameName,
			entryFee: tournamentDetails[k].entryFee,
			prize: tournamentDetails[k].prize,
			startingDateAndTime: tournamentDetails[k].startingDateAndTime,
			teamViewName: teamViewName,
			tournamentResult: tournamentResult,
		};
		tournamentDetailArr.push(tournamentObjWithId);
	}
	return tournamentDetailArr;
};

exports.deleteAllDataWithoutGames = async (req, res) => {
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
		let role = userData.role;
		if (role === "Admin") {
			await ChatMessageHelper.hardDeleteAllChatMessages();
			await ConversationHelper.hardDeleteAllConversations();
			await FantasyLeagueHelper.hardDeleteAllFantasyLeagues();
			await FantasyLeagueHelper.hardDeleteAllFantasyLeaguesSechedules();
			await FantasyLeagueHelper.hardDeleteAllFantasyLeagueTeamPoints();
			await FantasyLeagueHelper.hardDeleteAllFantasyYeamInvites();
			await FantasyTeamHelper.hardDeleteAllFantasyTeams();
			await FranchiseHelper.hardDeleteAllFranchises();
			await UserHelper.hardDeleteAllFriendRequests();
			await LadderResultHelper.hardDeleteAllLadderResults();
			await LadderHelper.hardDeleteAllLadders();
			await LeagueResultHelper.hardDeleteAllLeagueResults();
			await LeagueHelper.hardDeleteAllLeagues();
			await LeagueScheduleHelper.hardDeleteAllLeagueSchedules();
			await MatchHelper.hardDeleteAllMatches();
			await MatchHelper.hardDeleteAllMatchResults();
			await LeagueResultHelper.hardDeletePlayerLeaguePoints();
			await TournamentResultHelper.hardDeleteAllPlayerTournamentPoints();
			await TeamHelper.hardDeleteAllTeamInvites();
			await TeamHelper.hardDeleteAllTeams();
			await TotalWarLadderHelper.hardDeleteAllTotalWarLadders();
			await TotalWarLadderHelper.hardDeleteAllTotalWarLadderMatches();
			await TotalWarLadderHelper.hardDeleteAllTotalWarLadderResult();
			await TournamentHelper.hardDeleteAllTournaments();
			await TournamentResultHelper.hardDeleteAllTournamentResults();
			await TournamentScheduleHelper.hardDeleteAllTournamentSchedules();
			await TradeMovesHelper.hardDeleteAllTradeMoves();
			await TryoutHelper.hardDeleteAllTryouts();
			await UserHelper.hardDeleteAllUserWithoutAdmin();
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		return res.status(response.code).json(response);
	}
};
