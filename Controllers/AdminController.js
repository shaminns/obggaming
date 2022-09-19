const atob = require("atob");
const exceljs = require("exceljs")
const moment = require("moment");
const xlsx = require("xlsx")
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
// Controllers
const MatchController = require("../Controllers/MatchController")
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const FranchiseHelper = require("../Services/FranchiseHelper")
const UserListHelper = require("../Services/UserListHelper")
const LeagueHelper = require("../Services/LeagueHelper")
const LeagueResultHelper = require("../Services/LeagueResultHelper")
const LeagueScheduleHelper = require("../Services/LeagueScheduleHelper")
const FantasyLeagueHelper = require("../Services/FantasyLeagueHelper")
const GameHelper = require("../Services/GameHelper");
const TournamentHelper = require("../Services/TournamentHelper")
const LadderHelper = require("../Services/LadderHelper")
const TournamentResultHelper = require("../Services/TournamentResultHelper")
const LadderResultHelper = require("../Services/LadderResultHelper")
const TeamHelper = require("../Services/TeamHelper")
const FantasyTeamHelper = require("../Services/FantasyTeamHelper")
const ExportToExcelHelper = require("../Services/ExportToExcelService")
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
//
exports.dashboardDetail = async (req, res) => {
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
        let totalUsers
        let loggedInUser = 0
        let loggedOutUser = 0
        let allUser = await UserHelper.alUsersListForDashboard()
        if (allUser.length > 0) {
            totalUsers = allUser.length
        } else {
            totalUsers = 0
        }
        if (allUser.length > 0) {
            for (let i = 0; i < allUser.length; i++) {
                if (allUser[i].userToken != null) {
                    ////
                    let userToken = allUser[i].userToken
                    const tokenParts = userToken.split(".");
                    const encodedToken = tokenParts[1];
                    const rawToken = atob(encodedToken);
                    const tokenDetails = JSON.parse(rawToken);
                    let tokenDate = moment(tokenDetails.exp * 1000).format("MMM DD YYYY")
                    let nowDate = moment().format("MMM DD YYYY")
                    let tokenTime = moment(tokenDetails.exp * 1000).format("HH:mm:a")
                    let nowTime = moment().format("HH:mm:a")
                    if (nowDate > tokenDate || nowDate === tokenDate) {
                        console.log("check")
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
            loggedInUser = 0
            loggedOutUser = 0
        }
        let allGamesDetail = await GameHelper.allGamesWithFranchiseGame()
        let allGames
        if (allGamesDetail.length > 0) {
            allGames = allGamesDetail.length
        } else {
            allGames = 0
        }
        let dashboardData = {
            totalUsers: totalUsers,
            loggedInUser: loggedInUser,
            totalGames: allGames
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.dashboardData = dashboardData
        return res.status(response.code).json(response);
    }
}
exports.listAllUser = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.query
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
        let userObjArr = []
        let userList
        let pageNo
        if (request.pageNo) {
            pageNo = request.pageNo
        }
        if (!request.pageNo) {
            pageNo = 1
        }
        if (!req.query.query) {
            userList = await UserListHelper.allActiveUsersListWithPagination(pageNo);
        }
        if (req.query.query) {
            let paramUserName = req.query.query.toLowerCase();
            userList = await UserListHelper.usersListByUserNameWithPagination(paramUserName, pageNo);
        }
        if (userList.data.length > 0) {
            for (let i = 0; i < userList.data.length; i++) {
                let matchData = await MatchController.matchDataByUserId(userList.data[i]._id)
                let userObj = {
                    profileImage: userList.data[i].profileImage,
                    backgroundImage: userList.data[i].backgroundImage,
                    userDetail: userList.data[i].userDetail,
                    role: userList.data[i].role,
                    isDeleted: userList.data[i].isDeleted,
                    deletedAt: userList.data[i].deletedAt,
                    _id: userList.data[i]._id,
                    createdAt: userList.data[i].createdAt,
                    updatedAt: userList.data[i].updatedAt,
                    matches: matchData.matches,
                    win: matchData.win,
                    loss: matchData.loss,
                    winPercentage: matchData.winPercentage
                }
                userObjArr.push(userObj)
            }
        }
        let pagination = userList.pagination
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
        response.userData = {...pagination, data: userObjArr}
        return res.status(response.code).json(response);
    }
}
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
        let user = await UserHelper.foundUserById(request.id)
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
            let credit = Number(request.credits.replace(/[^0-9\.]+/g, ''));
            let checkCredit = isNaN(credit)
            if (checkCredit == true) {
                response = ResponseHelper.setResponse(
                    ResponseCode.NOT_SUCCESS,
                    Message.CREDIT_AMOUNT_NOT_CORRECT
                );
                return res.status(response.code).json(response);
            }
            await UserHelper.updateUser(request);
            let userData = await UserHelper.foundUserById(request.id)
            response = ResponseHelper.setResponse(
                ResponseCode.SUCCESS,
                Message.REQUEST_SUCCESSFUL
            );
            response.user = userData
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
        let idArr = []
        let emailArr = request.email
        for (let i = 0; i < emailArr.length; i++) {
            let user = await UserHelper.foundUserByEmail(emailArr[i])
            idArr.push(user._id)
        }
        await UserHelper.deleteUsers(idArr);
        response = ResponseHelper.setResponse(
            ResponseCode.SUCCESS,
            Message.REQUEST_SUCCESSFUL,
        );
        response.users = emailArr
        return res.status(response.code).json(response);
    }
};
exports.showAllGames = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.query
    let result
    let pageNo
    if (request.pageNo) {
        pageNo = request.pageNo
    }
    if (!request.pageNo) {
        pageNo = 1
    }
    if (req.query.query) {
        let gameName = req.query.query;
        result = await GameHelper.findGameWithGAmeNameWithPaginationWithoutDel(gameName.toLowerCase(), pageNo)
    }
    if (!req.query.query) {
        result = await GameHelper.allGameWithPaginationWithoutDel(pageNo)
    }
    let pagination = result.pagination
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.allGame = {...pagination, data: result.data}
    return res.status(response.code).json(response);
}
///
// export data
exports.exportUserData = async (req, res) => {
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
        let allUsers = await UserHelper.alUsersList()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Users", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'I1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'I2')
        worksheet.getCell('A2').value = "All Users Record"
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(3).values = ['Sr no.', 'Name', 'Username', 'Email', 'Credits', 'Matches', 'Wins',
            'Losses', 'Win Percentage'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: "name", width: "10"},
            {key: "username", width: "10"},
            {key: "email", width: "10"},
            {key: "credits", width: "10"},
            {key: "matches", width: "10"},
            {key: "wins", width: "10"},
            {key: "losses", width: "10"},
            {key: "winPercentage", width: "10"}
        ]
        if (allUsers.length > 0) {
            for (let i = 0; i < allUsers.length; i++) {
                let userId = allUsers[i]._id
                let userMatchObj = await MatchController.matchDataByUserId(userId)
                allUsers[i].sr_no = i + 1
                allUsers[i].name = allUsers[i].userDetail.fullName
                allUsers[i].username = allUsers[i].userDetail.userName
                allUsers[i].email = allUsers[i].userDetail.email
                allUsers[i].credits = allUsers[i].userDetail.credits
                allUsers[i].matches = userMatchObj.matches
                allUsers[i].wins = userMatchObj.win
                allUsers[i].losses = userMatchObj.loss
                allUsers[i].winPercentage = userMatchObj.winPercentage
                worksheet.addRow(allUsers[i])
            }
        } else {
            worksheet.addRow("")
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/User/all_users_data.xlsx")//"D:\\Excel node js\\userlist.xlsx"
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\User\\all_users_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportTournamentData = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    if (!req.headers.authorization) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_FOUND, Message.TOKEN_NOT_FOUND);
        return res.status(response.code).json(response);
    }
    let token = req.headers.authorization;
    let userId = await tokenExtractor.getInfoFromToken(token);
    if (userId == null) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_AUTHORIZE, Message.INVALID_TOKEN);
        return res.status(response.code).json(response);
    }
    if (userId != null) {
        let tournamentData = await TournamentHelper.allTournamentListForExportWithoutDeleted()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Tournaments", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'H1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'H2')
        worksheet.getCell('A2').value = "All Tournaments Record"
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(3).values = ['Sr no.', 'Tournament Name', 'Game', 'Entry Fee', 'Prize',
            'Team Size', 'Total Teams', 'Start Date Time'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: "tournamentName", width: "10"},
            {key: "game", width: "10"},
            {key: "entryFee", width: "10"},
            {key: "prize", width: "10"},
            {key: "teamSize", width: "10"},
            {key: "totalTeams", width: "10"},
            {key: "startingDateAndTime", width: "10"},
        ]
        if (tournamentData.length > 0) {
            for (let i = 0; i < tournamentData.length; i++) {
                let gameName
                let gameId = tournamentData[i].gameToPlay
                let gameDetail = await GameHelper.findGameById(gameId)
                if (gameDetail != null) {
                    gameName = gameDetail.gameName
                } else {
                    gameName = "game_not_found"
                }
                let startingDateAndTime = moment(tournamentData[i].startingDateAndTime).format("Do MMM YYYY, hh:mm a")
                tournamentData[i].sr_no = i + 1
                tournamentData[i].tounamentName = tournamentData[i].tournamentName
                tournamentData[i].game = gameName
                tournamentData[i].entryFee = tournamentData[i].entryFee
                tournamentData[i].prize = tournamentData[i].prize
                tournamentData[i].teamSize = tournamentData[i].teamSize
                tournamentData[i].totalTeams = tournamentData[i].totalTeams
                tournamentData[i].startingDateAndTime = startingDateAndTime
                worksheet.addRow(tournamentData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/Tournament/all_tournament_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\Tournament\\all_tournament_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportLadderData = async (req, res) => {
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
        let ladderData = await LadderHelper.allLaddersListWithoutDeleted()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Ladders", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'I1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'I2')
        worksheet.getCell('A2').value = "All Ladders Record"
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(3).values = ['Sr no.', 'Ladder Name', 'Game', 'Entry Fee', 'Prize', 'Team Size',
            'Total Teams', 'Start Date Time', 'End Date Time'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: "ladderName", width: "10"},
            {key: "game", width: "10"},
            {key: "entryFee", width: "10"},
            {key: "prize", width: "10"},
            {key: "teamSize", width: "10"},
            {key: "totalTeams", width: "10"},
            {key: "startingDateAndTime", width: "10"},
            {key: "endingDateAndTime", width: "10"}
        ]
        if (ladderData.length > 0) {
            for (let i = 0; i < ladderData.length; i++) {
                let gameName
                let gameId = ladderData[i].gameToPlay
                let gameDetail = await GameHelper.findGameById(gameId)
                if (gameDetail != null) {
                    gameName = gameDetail.gameName
                } else {
                    gameName = "game_not_found"
                }
                let startingDateAndTime = moment(ladderData[i].startingDateAndTime).format("Do MMM YYYY, hh:mm a")
                let endingDateAndTime = moment(ladderData[i].endingDateAndTime).format("Do MMM YYYY, hh:mm a")
                ladderData[i].sr_no = i + 1
                ladderData[i].ladderName = ladderData[i].ladderName
                ladderData[i].game = gameName
                ladderData[i].entryFee = ladderData[i].entryFee
                ladderData[i].prize = ladderData[i].prize
                ladderData[i].teamSize = ladderData[i].teamSize
                ladderData[i].totalTeams = ladderData[i].totalTeams
                ladderData[i].startingDateAndTime = startingDateAndTime
                ladderData[i].endingDateAndTime = endingDateAndTime
                worksheet.addRow(ladderData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/Ladder/all_ladder_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\Ladder\\all_ladder_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportTournamentResultData = async (req, res) => {
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
        let tournamentResult = await TournamentResultHelper.findTournamentForResult()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Tournament Results", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'F1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'F2')
        worksheet.getCell('A2').value = "All Tournament Results"
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(3).values = ['Sr no.', 'User/Team', 'Tournament Name', 'Game', 'Score', 'Result'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: 'team', width: "10"},
            {key: "tournamentName", width: "10"},
            {key: "game", width: "10"},
            {key: "score", widht: "10"},
            {key: "result", width: "10"}
        ]
        if (tournamentResult.length > 0) {
            for (let i = 0; i < tournamentResult.length; i++) {
                let teamName
                let teamId = tournamentResult[i].teamId
                let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId)
                if (teamDetail != null) {
                    teamName = teamDetail.teamViewName
                } else {
                    teamName = "team not found"
                }
                tournamentResult[i].sr_no = i + 1
                tournamentResult[i].team = teamName
                tournamentResult[i].tounamentName = tournamentResult[i].tounamentName
                tournamentResult[i].game = tournamentResult[i].gameToPlay.gameName
                tournamentResult[i].score = tournamentResult[i].score
                tournamentResult[i].result = tournamentResult[i].result
                worksheet.addRow(tournamentResult[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/Tournament/all_tournament_results_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\Tournament\\all_tournament_results_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportLadderResultData = async (req, res) => {
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
        let ladderResultData = await LadderResultHelper.showAllLadderRecord()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Ladder Results", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'F1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'F2')
        worksheet.getCell('A2').value = "All Ladder Results"
        ///
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        ///
        worksheet.getRow(3).values = ['Sr no.', 'User/Team', 'Ladder Name', 'Game', 'Score', 'Result'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: 'team', width: "10"},
            {key: "ladderName", width: "10"},
            {key: "game", width: "10"},
            {key: "score", widht: "10"},
            {key: "result", width: "10"}
        ]
        if (ladderResultData.length > 0) {
            for (let i = 0; i < ladderResultData.length; i++) {
                let teamName
                let teamId = ladderResultData[i].teamId
                let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId)
                if (teamDetail != null) {
                    teamName = teamDetail.teamViewName
                } else {
                    teamName = "team not found"
                }
                ladderResultData[i].sr_no = i + 1
                ladderResultData[i].team = teamName
                ladderResultData[i].ladderName = ladderResultData[i].ladderName
                ladderResultData[i].game = ladderResultData[i].gameToPlay.gameName
                ladderResultData[i].score = ladderResultData[i].score
                ladderResultData[i].result = ladderResultData[i].result
                worksheet.addRow(ladderResultData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/Ladder/all_ladder_results_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\Ladder\\all_ladder_results_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportGrandPrixData = async (req, res) => {
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
        let gpData = await FranchiseHelper.showAllFranchiseWithoutDelete()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Grand Prix Data", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'I1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'I2')
        worksheet.getCell('A2').value = "Grand Prix Record"
        ///
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        ///
        worksheet.getRow(3).values = ['Sr no.', 'GP Name', 'Total Teams', 'Owner', 'Owner Occupation',
            'Owner Icome(yearly)',
            'Owner Address', 'Block/Unblock', 'Approved Status'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: 'franchiseName', width: "10"},
            {key: "totalTeams", width: "10"},
            {key: "ownerName", width: "10"},
            {key: "occupation", width: "10"},
            {key: "ownerIncome", widht: "10"},
            {key: "ownerAddress", width: "10"},
            {key: "isBlockStatus", width: "10"},
            {key: "approvedStatus", width: "10"}
        ]
        if (gpData.length > 0) {
            for (let i = 0; i < gpData.length; i++) {
                let blockStatus
                if (gpData[i].isBlock == false) {
                    blockStatus = "Unblock"
                } else {
                    blockStatus = "Block"
                }
                gpData[i].sr_no = i + 1
                gpData[i].franchiseName = gpData[i].franchiseName
                gpData[i].totalTeams = gpData[i].franchiseTeams.length
                gpData[i].ownerName = gpData[i].createdByName
                gpData[i].occupation = gpData[i].occupation
                gpData[i].ownerIncome = gpData[i].yearlyIncome
                gpData[i].ownerAddress = gpData[i].address
                gpData[i].isBlockStatus = blockStatus
                gpData[i].approvedStatus = gpData[i].approvedStatus
                worksheet.addRow(gpData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/GrandPrix/all_grand_prix_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\GrandPrix\\all_grand_prix_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportGpLeagueData = async (req, res) => {
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
        let gpLeagueData = await LeagueHelper.allLeaguesWithoutDelete()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Grand Prix Leagues Data", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'J1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'J2')
        worksheet.getCell('A2').value = "Grand Prix Leagues Record"
        ///
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        ///
        worksheet.getRow(3).values = ['Sr no.', 'League Name', 'Year', 'Entry Fee', 'Prize', 'Team Size',
            'Total Teams', 'Starting Date', 'Ending Date', 'Winner'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: 'leagueName', width: "10"},
            {key: "year", width: "10"},
            {key: "entryFee", width: "10"},
            {key: "prize", width: "10"},
            {key: "teamSize", width: "10"},
            {key: "totalTeams", width: "10"},
            {key: "startingDate", width: "10"},
            {key: "endingDate", width: "10"},
            {key: "winner", width: "10"}
        ]
        if (gpLeagueData.length > 0) {
            for (let i = 0; i < gpLeagueData.length; i++) {
                let gameName
                let gameId = gpLeagueData[i].gameToPlay
                let gameDetail = await GameHelper.findGameById(gameId)
                if (gameDetail != null) {
                    gameName = gameDetail.gameName
                } else {
                    gameName = "game_not_found"
                }
                let winningTeam
                if (gpLeagueData[i].winningTeam == null) {
                    winningTeam = "pending"
                } else {
                    let winningTeamDetail = await TeamHelper.findTeamDeatilByTeamId(gpLeagueData[i].winningTeam)
                    if (winningTeamDetail != null) {
                        winningTeam = winningTeamDetail.teamViewName
                    } else {
                        winningTeam = "not found"
                    }
                }
                let leagueYear = moment(gpLeagueData[i].startingDate).format("YYYY")
                let startDate = moment(gpLeagueData[i].startingDate).format("Do MMM YYYY")
                let endDate = moment(gpLeagueData[i].endingDate).format("Do MMM YYYY")
                gpLeagueData[i].sr_no = i + 1
                gpLeagueData[i].leagueName = gpLeagueData[i].leagueName
                gpLeagueData[i].year = leagueYear
                gpLeagueData[i].entryFee = gpLeagueData[i].entryFee
                gpLeagueData[i].prize = gpLeagueData[i].prize
                gpLeagueData[i].teamSize = gpLeagueData[i].teamSize
                gpLeagueData[i].totalTeams = gpLeagueData[i].totalTeams
                gpLeagueData[i].startingDate = startDate
                gpLeagueData[i].endingDate = endDate
                gpLeagueData[i].winner = winningTeam
                worksheet.addRow(gpLeagueData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/League/all_league_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\League\\all_league_data.xlsx"
        return res.status(response.code).json(response);
    }
}
exports.exportFantasyLeagueData = async (req, res) => {
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
        let flData = await FantasyLeagueHelper.findAllPublicFantasyLeagues()
        let workbook = new exceljs.Workbook()
        let worksheet = workbook.addWorksheet("All Public Fantasy League Data", {
            pageSetup: {paperSize: 9, orientation: 'landscape'}
        })
        // worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
        worksheet.mergeCells('A1', 'H1');
        worksheet.getCell('A1').value = 'Online Battle Ground'
        worksheet.mergeCells('A2', 'H2')
        worksheet.getCell('A2').value = "Public Fantasy Leagues Record"
        ///
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        worksheet.getRow(2).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'a6a3a3'}
            }
            cell.font = {bold: true, color: {argb: "00000000"}};
        })
        ///
        worksheet.getRow(3).values = ['Sr no.', 'FL Name', 'Year', 'Team Size', 'Total Teams', 'League Name',
            'Draft Date and Time', 'Winner'];
        worksheet.columns = [
            {key: "sr_no", width: "10"},
            {key: 'flName', width: "10"},
            {key: "year", width: "10"},
            {key: "teamSize", width: "10"},
            {key: "totalTeams", width: "10"},
            {key: "gpLeague", width: "10"},
            {key: "draftDateTime", width: "10"},
            {key: "flWinner", width: "10"}
        ]
        if (flData.length > 0) {
            for (let i = 0; i < flData.length; i++) {
                let gpLeagueName
                let gpLeagueDetail = await LeagueHelper.findLeagueByIdWithoutDeleteWithPopulate(flData[i].league)
                if (gpLeagueDetail != null) {
                    gpLeagueName = gpLeagueDetail.leagueName
                } else {
                    gpLeagueName = "not found"
                }
                let winner
                if (flData[i].winner == null) {
                    winner = "pending"
                } else {
                    let winningTeamDetail = await FantasyTeamHelper.findFantasyTeamDetailByFantasyTeamId(flData[i].winner)
                    if (winningTeamDetail != null) {
                        winner = winningTeamDetail.teamViewName
                    } else {
                        winner = "not found"
                    }
                }
                let leagueYear = moment(flData[i].draftDateAndTime).format("YYYY")
                let startDateAndTime = moment(flData[i].draftDateAndTime).format("Do MMM YYYY, hh:mm a")
                flData[i].sr_no = i + 1
                flData[i].flName = flData[i].leagueName
                flData[i].year = leagueYear
                flData[i].teamSize = flData[i].teamSize
                flData[i].totalTeams = flData[i].totalTeams
                flData[i].gpLeague = gpLeagueName
                flData[i].draftDateTime = startDateAndTime
                flData[i].flWinner = winner
                worksheet.addRow(flData[i])
            }
        } else {
        }
        worksheet.getRow(3).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'e14f05'}
            }
            cell.font = {bold: true, color: {argb: "00ffffff"}};
        })
        let borderStyles = {
            top: {style: "thin"},
            left: {style: "thin"},
            bottom: {style: "thin"},
            right: {style: "thin"}
        };
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            row.eachCell({includeEmpty: true}, function (cell, colNumber) {
                cell.border = borderStyles;
                cell.alignment = {vertical: "middle", horizontal: "left"}
            });
        });
        //  worksheet.mergeCells('A1:H1');
        worksheet.headerFooter.oddHeader = "&C&KCCCCCC&\"Aril\"&LOnline Battle Ground&C&A &R&D &T";
        worksheet.headerFooter.oddFooter = "&RPage &P of &N";
        let data = await workbook.xlsx.writeFile("Uploads/Excel/FantasyLeague/all_public_fantasy_league_data.xlsx")
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.downloadPath = "Uploads\\Excel\\FantasyLeague\\all_public_fantasy_league_data.xlsx"
        return res.status(response.code).json(response);
    }
}
/////only for dev//////////////////
exports.deleteUser = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    await UserHelper.deleteUser(request.email)
    response = ResponseHelper.setResponse(
        ResponseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
    )
    return res.status(response.code).json(response);
}
exports.deleteUserById = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    await UserHelper.deleteUserById(request.userId)
    response = ResponseHelper.setResponse(
        ResponseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
    )
    return res.status(response.code).json(response);
}
exports.uploadAsset = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    console.log(req.file.path)
    response = ResponseHelper.setResponse(
        ResponseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
    )
    response.path = req.file.path
    return res.status(response.code).json(response);
}
exports.updateGameType = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let gameId = request.gameId
    let gameType = request.gameType
    await GameHelper.updateGameType(gameId, gameType)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.permanentDeleteFranchise = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let franchiseId = request.franchiseId
    await FranchiseHelper.deleteFranchisePermanentForDev(franchiseId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.permanentDeleteGame = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let gameId = request.gameId
    await GameHelper.permanentDeleteGame(gameId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.leagueResultDetail = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let leagueId = request.leagueId
    let leagueResultDetail = await LeagueResultHelper.findLeagueResultDetailByLeagueId(leagueId)
    console.log("league result detail : ", leagueResultDetail)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.leagueDetail = leagueResultDetail
    return res.status(response.code).json(response);
}
exports.deleteLeagueResultDetail = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let leagueId = request.leagueId
    let leagueResultDetail = await LeagueResultHelper.findLeagueResultDetailByLeagueId(leagueId)
    console.log("league result detail : ", leagueResultDetail)
    await LeagueResultHelper.deleteLeagueResultDetailByLeagueId(leagueId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.setWinnerToNullForLeagueSchedule = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let leagueId = request.leagueId
    let leagueScheduleDetail = await LeagueScheduleHelper.findLeagueScheduleByLeagueId(leagueId)
    console.log("league schedule detail : ", leagueScheduleDetail)
    await LeagueScheduleHelper.setWinnerToNullForLeagueSchedule(leagueId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.deleteLeagueResultByResultId = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let resultId = request.resultId
    let leagueResultDetail = await LeagueResultHelper.findLeagueResultByResultId(resultId)
    console.log("League Result Detail: ", leagueResultDetail)
    await LeagueResultHelper.deleteLeagueResultByResultId(resultId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    return res.status(response.code).json(response);
}
exports.deleteAllLeagues = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await LeagueHelper.removeAllRecord()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteAllLeagueSchedule = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await LeagueScheduleHelper.removeAllLeagueSchedule()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteAllLeagueResult = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await LeagueResultHelper.removeAllLeagueResult()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteAllFantasyLeagues = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await FantasyLeagueHelper.removeAllRecord()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteAllFantasyLeaguesSchedule = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await FantasyLeagueHelper.removeAllSchedule()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteAllFlTeamInvite = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await FantasyLeagueHelper.deleteAllFlTeamInvite()
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
exports.deleteLeagueById = async (req, res) => {
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
        let deleted
        let userData = await UserHelper.foundUserById(userId)
        let role = userData.role
        if (role === "Admin") {
            await LeagueHelper.deleteLeagueById(request.flId)
            deleted = "delete"
        } else {
            deleted = "not delete"
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.deleted = deleted
        return res.status(response.code).json(response);
    }
}
