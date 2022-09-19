const moment = require('moment');
const fs = require("fs")
// Controllers
const TeamController = require("../Controllers/TeamController")
const FranchiseController = require("../Controllers/FranchiseController")
// Helpers
const UserHelper = require("../Services/UserHelper")
const TournamentHelper = require("../Services/TournamentHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const GameHelper = require("../Services/GameHelper")
const GeneralHelper = require("../Services/GeneralHelper")
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js")
const TeamHelper = require("../Services/TeamHelper");
const tokenExtractor = require("../Middleware/TokenExtracter");
const TournamentResultHelper = require("../Services/TournamentResultHelper")
const FranchiseHelper = require("../Services/FranchiseHelper");
const {tournaments} = require("./TournamentController");
const Tournament = require("../Models/Tournament");
exports.createTournament = async (req, res, next) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.body;
    let imagePath
    let jpgImage
    let pngImage
    if (!req.file) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.IMAGE_NOT_READ);
        return res.status(response.code).json(response);
    }
    if (req.file) {
        if (req.file.mimetype != "image/jpeg") {
            jpgImage = false
        } else {
            jpgImage = true
        }
        if (req.file.mimetype != "image/png") {
            pngImage = false
        } else {
            pngImage = true
        }
        imagePath = req.file.path;
        if (jpgImage == false && pngImage == false) {
            fs.unlinkSync(imagePath)
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.IMAGE_TYPE_ERROR);
            return res.status(response.code).json(response);
        }
    }
    if (!request.tournamentName || !request.gameToPlay || !request.teamSize || !request.totalTeams
        || !request.entryFee || !request.prize || !request.startingDateAndTime
    ) {
        fs.unlinkSync(imagePath)
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MISSING_PARAMETER);
        return res.status(response.code).json(response);
    }
    let startDateAndTime = await GeneralHelper.dateTimeToUtc(request.startingDateAndTime)
    let tournamentNameCheck = await TournamentHelper.findActiveTournament(request)
    if (tournamentNameCheck != null) {
        fs.unlinkSync(imagePath)
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_EXIST);
        return res.status(response.code).json(response);
    }
    let newTournamentId = await TournamentHelper.createTournament(request, imagePath, startDateAndTime);
    let tournament = await TournamentHelper.findTournamentById(newTournamentId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.tournament = tournament
    return res.status(response.code).json(response);
}
exports.listTournaments = async (req, res, next) => {
    let paramTournamentName = req.query.query
    let request = req.query;
    let result
    let pageNo
    if (request.pageNo) {
        pageNo = request.pageNo
    }
    if (!request.pageNo) {
        pageNo = 1
    }
    let response = ResponseHelper.getDefaultResponse();
    if (req.query.query) {
        result = await TournamentHelper.tournamentsByNameWithPagination(req.query.query.toLowerCase(), pageNo);
    }
    if (!req.query.query) {
        result = await TournamentHelper.tournamentsWithPagination(pageNo);
    }
    let finalArr = []
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
            updatedAt: result.data[i].updatedAt
        }
        finalArr.push(tournamentObj)
    }
    let pagination = result.pagination
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.tournamentData = {...pagination, data: finalArr}
    return res.status(response.code).json(response);
};
exports.getTournamentInfo = async (req, res, next) => {
    let request = req.body;
    let response = ResponseHelper.getDefaultResponse();
    if (!request.tournamentId) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MISSING_PARAMETER);
        return res.status(response.code).json(response);
    }
    let result = await TournamentHelper.findTournamentById(
        request.tournamentId,
    );
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result
    );
    return res.status(response.code).json(response);
};
exports.updateTournament = async (req, res, next) => {
    let request = req.body;
    let response = ResponseHelper.getDefaultResponse();
    let id = request._id
    let imagePath
    let jpgImage
    let pngImage
    let tournament = await TournamentHelper.findTournamentById(id);
    if (tournament == null) {
        if (req.file) {
            imagePath = req.file.path;
            fs.unlinkSync(imagePath)
        }
        let response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TOURNAMENT_DOES_NOT_EXISTS);
        return res.status(response.code).json(response);
    }
    if (tournament != null) {
        if (!req.file) {
            imagePath = tournament.tournamentTitleImage
        }
        if (req.file) {
            if (req.file.mimetype != "image/jpeg") {
                jpgImage = false
            } else {
                jpgImage = true
            }
            if (req.file.mimetype != "image/png") {
                pngImage = false
            } else {
                pngImage = true
            }
            imagePath = req.file.path;
            if (jpgImage == false && pngImage == false) {
                fs.unlinkSync(imagePath)
                response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.IMAGE_TYPE_ERROR);
                return res.status(response.code).json(response);
            }
            fs.unlinkSync(tournament.tournamentTitleImage)
        }
    }
    let tournamentId = request._id
    let tournamentDetail = await TournamentHelper.findTournamentById(tournamentId)
    if (tournamentDetail == null) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TOURNAMENT_DOES_NOT_EXISTS);
        return res.status(response.code).json(response);
    } else {
        let participatingTeams = tournamentDetail.participatingTeams
        if (participatingTeams.length > 0) {
            fs.unlinkSync(imagePath)
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.CAN_NOT_UPDATE);
            return res.status(response.code).json(response);
        } else {
            await TournamentHelper.updateTournament(tournament, request, id, imagePath);
            let result = await TournamentHelper.findTournamentByIdWithGamePopulate(id);
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
            response.tournamentData = result
            return res.status(response.code).json(response);
        }
    }
};
exports.deleteTournament = async (req, res, next) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.body;
    let deletedId = []
    let notDeletedIds = []
    for (let i = 0; i < request.tournamentId.length; i++) {
        let tournamentId = request.tournamentId[i]
        let tournamentDetail = await TournamentHelper.findTournamentById(tournamentId)
        if (tournamentDetail == null) {
            notDeletedIds.push(tournamentId)
        } else {
            let participatingTeams = tournamentDetail.participatingTeams
            if (participatingTeams.length > 0) {
                let checkResultExist = await TournamentResultHelper.findTournamentResultExist(tournamentId)
                if (checkResultExist.length == 0) {
                    response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.CAN_NOT_DELETE_RESULT_WAITING);
                    return res.status(response.code).json(response);
                } else {
                    let checkPendingTournamentResults = await TournamentResultHelper.findPendingResult(tournamentId)
                    if (checkPendingTournamentResults.length > 0) {
                        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.CAN_NOT_DELETE_PENDING_RESULT);
                        return res.status(response.code).json(response);
                    } else {
                        // let checkTotalTournamentResultExist = await TournamentResultHelper.findTotalTournamentResultsExist(tournamentId)
                        if (checkResultExist.length != participatingTeams.length) {
                            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.CAN_NOT_DELETE_SOME_PENDING_RESULT);
                            return res.status(response.code).json(response);
                        } else {
                            await TournamentHelper.deleteTournament(tournamentId);
                            deletedId.push(tournamentId)
                        }
                    }
                }
            } else {
                let tournamentImg = tournamentDetail.tournamentTitleImage
                fs.unlinkSync(tournamentImg)
                await TournamentHelper.deleteTournamentPermanent(tournamentId);
                deletedId.push(tournamentId)
            }
        }
    }
    if (notDeletedIds.length != 0) {
        console.log("Records of these ID/s not found : " + notDeletedIds)
    }
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.tournamentId = deletedId
    return res.status(response.code).json(response);
};
exports.joinTournament = async (req, res) => {
    let request = req.body;
    let response = ResponseHelper.getDefaultResponse();
    let teamId = request.teamId
    let tournamentTeamSizeRequired
    let teamSizeOfUser
    let totalTeamLimit
    let tournamentTotalTeamRequired
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
        if (!request.teamId && !request.tournamentId) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MISSING_PARAMETER);
            return res.status(response.code).json(response);
        }
        let teamDetail = await TeamHelper.findTeamById(request);
        if (teamDetail == null) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_DOESNOT_EXIST);
            return res.status(response.code).json(response);
        }
        if (teamDetail.teamLeader == null) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.NO_TEAM_LEADER_FOUND)
            return res.status(response.code).json(response);
        }
        let findTournament = await TournamentHelper.findTournamentById(request.tournamentId);
        if (findTournament == null) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TOURNAMENT_DOES_NOT_EXISTS);
            return res.status(response.code).json(response);
        }
        if (findTournament != null) {
            tournamentTeamSizeRequired = findTournament.teamSize
        }
        teamSizeOfUser = teamDetail.teamMembers.length
        if (tournamentTeamSizeRequired != teamSizeOfUser) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_SIZE_NOT_MATCH)
            return res.status(response.code).json(response);
        }
        totalTeamLimit = findTournament.participatingTeams.length
        tournamentTotalTeamRequired = findTournament.totalTeams
        if (totalTeamLimit == tournamentTotalTeamRequired) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_SIZE_EXCEED)
            return res.status(response.code).json(response);
        }
        let userData = await UserHelper.foundUserById(userId)
        let userCredit = userData.userDetail.credits
        let tournamentEntryFee = findTournament.entryFee
        let finalCredit = 0
        if (userCredit < tournamentEntryFee) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.NOT_ENOUGH_CREDIT)
            return res.status(response.code).json(response);
        } else {
            finalCredit = userCredit - tournamentEntryFee
        }
        let tournamentArr = []
        let teamMemberArr = []
        let participatingMemberArr = findTournament.participatingTeams
        for (let i = 0; i < participatingMemberArr.length; i++) {
            let teamId = participatingMemberArr[i]
            let participatingTeamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId)
            for (let j = 0; j < participatingTeamDetail.teamMembers.length; j++) {
                let teamMemberId = participatingTeamDetail.teamMembers[j].userId
                teamMemberArr.push(teamMemberId.toString())
            }
            for (let k = 0; k < teamDetail.teamMembers.length; k++) {
                let teamMemberCheck = teamMemberArr.includes(teamDetail.teamMembers[k].userId.toString())
                if (teamMemberCheck == true) {
                    response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MEMBER_ALREADY_PARTICIPATED)
                    return res.status(response.code).json(response);
                }
                tournamentArr.push(teamId.toString())
            }
        }
        let teamIdForCheck = teamDetail._id.toString()
        if (tournamentArr.includes(teamIdForCheck)) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_ALREADY_PARTICIPATING)
            return res.status(response.code).json(response);
        } else {
            let tournamentId = findTournament._id
            let gameToPlay = findTournament.gameToPlay
            await TournamentHelper.addTeam(tournamentId, teamDetail._id)
            await TeamHelper.updateTournamentDetail(request.teamId, tournamentId)
            await TeamHelper.updateTournamentGameDetail(request.teamId, gameToPlay)
            await UserHelper.updateCredit(userId, finalCredit)
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
            response.tournamentData = await this.tournamentDetailData(request.tournamentId, userId)
            return res.status(response.code).json(response);
        }
    }
}
exports.tournamentById = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let tournamentId = req.query.id
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
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentData = await this.tournamentDetailData(tournamentId, userId)
        return res.status(response.code).json(response);
    }
}
exports.teamCurrentTournament = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let teamId = request.teamId
    let tournamentArr = []
    let status
    let currentTournamentData = await TournamentHelper.teamTournamentsDetail(teamId)
    for (let i = 0; i < currentTournamentData.length; i++) {
        let startingDateAndTime = currentTournamentData[i].startingDateAndTime
        let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
        let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
        if (currentTournamentData[i].winningTeam == teamId) {
            status = "win"
        } else {
            status = "loss"
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
            status: status
        }
        let string = (moment(startingDateAndTime).fromNow()).toString();
        let match = "ago";
        let regex = new RegExp('\\b(' + match + ')\\b');
        let matchResult = (string.match(regex) == null)
        if (matchResult == true) {
            tournamentArr.push(tournamentDetail)
        }
    }
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.tournamentData = tournamentArr
    return res.status(response.code).json(response);
}
exports.teamPastTournament = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let teamId = request.teamId
    let tournamentArr = []
    let currentTournamentData = await TournamentHelper.teamTournamentsDetail(teamId)
    for (let i = 0; i < currentTournamentData.length; i++) {
        let status
        let startingDateAndTime = currentTournamentData[i].startingDateAndTime
        let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
        let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
        if (currentTournamentData[i].winningTeam == teamId) {
            status = "win"
        } else {
            status = "loss"
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
            status: status
        }
        let string = (moment(startingDateAndTime).fromNow()).toString();
        let match = "ago";
        let regex = new RegExp('\\b(' + match + ')\\b');
        let matchResult = (string.match(regex) == null)
        if (matchResult == false) {
            tournamentArr.push(tournamentDetail)
        }
    }
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.tournamentData = tournamentArr
    return res.status(response.code).json(response);
}
exports.tournaments = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let tournamentFinalArr = []
    let tournamentList = await TournamentHelper.allTournamentListWithoutDeleted()
    if (req.query.platform) {
        let platform = req.query.platform.toLowerCase();
        if (platform != 'all') {
            if (platform == 'mobile') {
                for (let i = 0; i < tournamentList.length; i++) {
                    let gameId = tournamentList[i].gameToPlay
                    let gameDetail = await GameHelper.findGameById(gameId)
                    if (gameDetail != null) {
                        let gamePlateformArr = gameDetail.platforms
                        let androidPlatformResult = gamePlateformArr.includes("android")
                        let iosPlatformResult = gamePlateformArr.includes("ios")
                        if (androidPlatformResult == true || iosPlatformResult == true) {
                            let startingDateAndTime = tournamentList[i].startingDateAndTime
                            let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
                            let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
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
                                tournamentTime: tournamentTime
                            }
                            tournamentFinalArr.push(tournamentDetail)
                        }
                    }
                }
            }
            if (platform != 'mobile') {
                for (let i = 0; i < tournamentList.length; i++) {
                    let gameId = tournamentList[i].gameToPlay
                    let gameDetail = await GameHelper.findGameById(gameId)
                    let gamePlateformArr = gameDetail.platforms
                    let platformResult = gamePlateformArr.includes(platform.toString())
                    if (platformResult == true) {
                        let startingDateAndTime = tournamentList[i].startingDateAndTime
                        let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
                        let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
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
                            tournamentTime: tournamentTime
                        }
                        tournamentFinalArr.push(tournamentDetail)
                    }
                }
            }
        }
        if (platform == 'all') {
            for (let i = 0; i < tournamentList.length; i++) {
                let startingDateAndTime = tournamentList[i].startingDateAndTime
                let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
                let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
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
                    tournamentTime: tournamentTime
                }
                tournamentFinalArr.push(tournamentDetail)
            }
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentData = tournamentFinalArr
        return res.status(response.code).json(response);
    }
}
exports.addTournamentResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    // console.log("request : ", request)
    let tournamentId = request.tournamentId
    let teamId = request.teamId
    let score = request.score
    let participatingTeamArr = []
    let filePath
    let mp4Video
    let jpgImage
    let pngImage
    if (!req.file) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.VIDEO_IMAGE_NOT_READ);
        return res.status(response.code).json(response);
    }
    if (req.file) {
        filePath = req.file.path;
        if (req.file.mimetype != "video/mp4") {
            mp4Video = false
        } else {
            mp4Video = true
        }
        if (req.file.mimetype != "image/jpeg") {
            jpgImage = false
        } else {
            jpgImage = true
        }
        if (req.file.mimetype != "image/png") {
            pngImage = false
        } else {
            pngImage = true
        }
        if (mp4Video == false && jpgImage == false && pngImage == false) {
            fs.unlinkSync(filePath);
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.VIDEO_IMAGE_TYPE_ERROR);
            return res.status(response.code).json(response);
        }
    }
    if (!req.headers.authorization) {
        fs.unlinkSync(filePath);
        response = ResponseHelper.setResponse(ResponseCode.NOT_FOUND, Message.TOKEN_NOT_FOUND);
        return res.status(response.code).json(response);
    }
    let token = req.headers.authorization;
    let userId = await tokenExtractor.getInfoFromToken(token);
    if (userId == null) {
        fs.unlinkSync(filePath);
        response = ResponseHelper.setResponse(ResponseCode.NOT_AUTHORIZE, Message.INVALID_TOKEN);
        return res.status(response.code).json(response);
    }
    if (userId != null) {
        let tournamentDetail = await TournamentHelper.findTournamentById(tournamentId)
        let tournamentType = tournamentDetail.tournamentType
        let tournamentName = tournamentDetail.tournamentName
        let tournamentStartDateAndTime = tournamentDetail.startingDateAndTime
        let nowDate = moment().utc().format("MMM DD YYYY")
        let startDate = moment(tournamentStartDateAndTime).format("MMM DD YYYY")
        let startDateCHeckResult = moment(startDate).isSameOrBefore(nowDate, 'days')
        if (!startDateCHeckResult) {
            fs.unlinkSync(filePath)
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.CAN_NOT_SUBMIT_RESULT_BEFORE_START)
            return res.status(response.code).json(response);
        } else {
            let tournamentResultData = await TournamentResultHelper.findSubmittedTournamentResult(tournamentId, teamId)
            if (tournamentResultData != null) {
                fs.unlinkSync(filePath)
                response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_SUBMITTED)
                return res.status(response.code).json(response);
            }
            if (tournamentResultData == null) {
                let gameId = tournamentDetail.gameToPlay._id
                for (let i = 0; i < tournamentDetail.participatingTeams.length; i++) {
                    let teamId = tournamentDetail.participatingTeams[i].toString()
                    participatingTeamArr.push(teamId)
                }
                let teamCheck = participatingTeamArr.includes(teamId.toString())
                if (teamCheck == false) {
                    fs.unlinkSync(filePath)
                    response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_NOT_PARTICIPATING)
                    return res.status(response.code).json(response);
                }
                if (teamCheck == true) {
                    let resultTournamentId = await TournamentResultHelper.submitResult(
                        tournamentId,
                        tournamentName,
                        gameId,
                        teamId,
                        userId,
                        score,
                        tournamentType,
                        filePath)
                    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
                    response.tournamentData = await this.tournamentDetailData(resultTournamentId, userId)
                    return res.status(response.code).json(response);
                }
            }
        }
    }
}
exports.showTournamentsForResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let tournamentForResult
    let category
    let tournamentFinalArr = []
    let request = req.query;
    let result
    let pageNo
    if (request.pageNo) {
        pageNo = request.pageNo
    }
    if (!request.pageNo) {
        pageNo = 1
    }
    if (!req.query.query) {
        tournamentForResult = await TournamentResultHelper.findAdminTournamentForResultWithPagination(pageNo)
    }
    if (req.query.query) {
        let tournamentName = req.query.query
        tournamentForResult = await TournamentResultHelper.findAdminTournamentResultByTournamentNameWithPagination(tournamentName.toLowerCase(), pageNo)
    }
    for (let i = 0; i < tournamentForResult.data.length; i++) {
        // if (tournamentForResult.data[i].resultType == null) {
        //     category = ""
        // } else {
        //     category = "franchise"
        // }
        let tournamentResultObj = {
            result: tournamentForResult.data[i].result,
            killPoints: tournamentForResult.data[i].killPoints,
            category: tournamentForResult.data[i].resultType,
            isDeleted: tournamentForResult.data[i].isDeleted,
            deletedAt: tournamentForResult.data[i].deletedAt,
            _id: tournamentForResult.data[i]._id,
            tournamentId: {
                _id: tournamentForResult.data[i].tournamentId._id,
                tournamentName: tournamentForResult.data[i].tournamentId.tournamentName
            },
            tournamentName: tournamentForResult.data[i].tournamentName,
            teamId: {
                _id: tournamentForResult.data[i].teamId._id,
                teamViewName: tournamentForResult.data[i].teamId.teamViewName
            },
            gameToPlay: {
                _id: tournamentForResult.data[i].gameToPlay._id,
                gameName: tournamentForResult.data[i].gameToPlay.gameName
            },
            score: tournamentForResult.data[i].score,
            resultVideo: tournamentForResult.data[i].resultVideo,
            submittedBy: {
                _id: tournamentForResult.data[i].submittedBy._id,
                userDetail: {
                    userName: tournamentForResult.data[i].submittedBy.userDetail.userName
                }
            },
            submissionDate: tournamentForResult.data[i].submissionDate,
            createdAt: tournamentForResult.data[i].createdAt,
            updatedAt: tournamentForResult.data[i].updatedAt,
        }
        tournamentFinalArr.push(tournamentResultObj)
    }
    let pagination = tournamentForResult.pagination
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.tournamentData = {...pagination, data: tournamentFinalArr}
    return res.status(response.code).json(response);
}
exports.updateResultForTournament = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let tournamentResultId = request.resultId
    let resultStatus = request.resultStatus.toLowerCase()
    let tournamentResultDetail = await TournamentResultHelper.findTournamentResultByIdForResult(tournamentResultId)
    if (tournamentResultDetail == null) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.NOT_REQUESTED)
        return res.status(response.code).json(response);
    }
    if (tournamentResultDetail != null) {
        let teamId = tournamentResultDetail.teamId._id.toString()
        let tournamentId = tournamentResultDetail.tournamentId
        if (resultStatus == "loss") {
            let checkAlreadyTournamentWinningTeam = await TournamentHelper.findAlreadyWinningTeam(tournamentId, teamId)
            if (checkAlreadyTournamentWinningTeam != null) {
                await TournamentHelper.updateTournamentWinningTeam(tournamentId, teamId)
            }
            await TournamentResultHelper.updateTournamentResult(tournamentResultId, resultStatus)
        }
        if (resultStatus == "win") {
            let findWinningResult = await TournamentResultHelper.findAlreadyWinTournamentResult(tournamentId)
            if (findWinningResult != null) {
                response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_WIN_TOURNAMENT_RESULT)
                return res.status(response.code).json(response);
            }
            if (findWinningResult == null) {
                await TournamentResultHelper.updateTournamentResult(tournamentResultId, resultStatus)
                await TournamentHelper.updateTournamentTeamResult(tournamentId, teamId)
            }
        }
        let tournamentForResult = await TournamentResultHelper.findTournamentResultByIdForResult(tournamentResultId)
        let tournamentRecord = {
            result: tournamentForResult.result,
            isDeleted: tournamentForResult.isDeleted,
            deletedAt: tournamentForResult.deletedAt,
            _id: tournamentForResult._id,
            tournamentId: {
                _id: tournamentForResult.tournamentId,
                tournamentName: tournamentForResult.tournamentName
            },
            teamId: tournamentForResult.teamId,
            gameToPlay: tournamentForResult.gameToPlay,
            category: tournamentForResult.category,
            score: tournamentForResult.score,
            resultVideo: tournamentForResult.resultVideo,
            submittedBy: tournamentForResult.submittedBy,
            submissionDate: tournamentForResult.submissionDate,
            createdAt: tournamentForResult.createdAt,
            updatedAt: tournamentForResult.updatedAt,
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentsData = tournamentRecord
        return res.status(response.code).json(response);
    }
}
exports.deleteTournamentResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let resultId
    let notResultId = []
    let deletedResultId = []
    let pendingResultId = []
    let resultIdArr = request.resultId
    for (let i = 0; i < resultIdArr.length; i++) {
        resultId = resultIdArr[i]
        let tournamentResultDetailById = await TournamentResultHelper.findTournamentResultByIdForResult(resultId)
        if (tournamentResultDetailById == null) {
            notResultId.push(resultId)
        }
        if (tournamentResultDetailById != null) {
            if (tournamentResultDetailById.result == "pending") {
                pendingResultId.push(resultId)
            } else {
                let resultVideoPath = tournamentResultDetailById.resultVideo
                fs.unlinkSync(resultVideoPath)
                await TournamentResultHelper.deleteTournamentResultById(resultId)
                deletedResultId.push(resultId)
            }
        }
    }
    if (notResultId.length != 0) {
        console.log("Records of these ID/s not found : ", notResultId)
    }
    if (pendingResultId.length > 0) {
        console.log("Pending result records : ", pendingResultId)
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.SOME_RESULT_NOT_DELETE)
        response.resultId = deletedResultId
        return res.status(response.code).json(response);
    } else {
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.resultId = deletedResultId
        return res.status(response.code).json(response);
    }
}
exports.myTournaments = async (req, res) => {
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
        let teamData = await TeamHelper.findMyTeams(userId)
        let tournamentArr = []
        let tournamentObj
        for (let i = 0; i < teamData.length; i++) {
            let teamId = teamData[i]._id
            let tournamentData = await TournamentHelper.findMyExternalTournamentWithOutDelete(teamId)
            if (tournamentData.length > 0) {
                for (let j = 0; j < tournamentData.length; j++) {
                    let tournamentDate = moment(tournamentData[j].startingDateAndTime).format('MMM DD yyyy');
                    let tournamentTime = moment(tournamentData[j].startingDateAndTime).format('hh:mm A');
                    tournamentObj = {
                        tournamentTitleImage: tournamentData [j].tournamentTitleImage,
                        totalTeams: tournamentData [j].totalTeams,
                        _id: tournamentData [j]._id,
                        tournamentName: tournamentData [j].tournamentName,
                        teamSize: tournamentData [j].teamSize,
                        entryFee: tournamentData [j].entryFee,
                        prize: tournamentData[j].prize,
                        tournamentDate: tournamentDate,
                        tournamentTime: tournamentTime
                    }
                    tournamentArr.push(tournamentObj)
                }
            }
        }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentData = tournamentArr
        return res.status(response.code).json(response);
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////// Franchise Work ////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.createFranchiseTournament = async (req, res, next) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.body;
    let imagePath
    let jpgImage
    let pngImage
    if (!req.file) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.IMAGE_NOT_READ);
        return res.status(response.code).json(response);
    }
    if (req.file) {
        if (req.file.mimetype != "image/jpeg") {
            jpgImage = false
        } else {
            jpgImage = true
        }
        if (req.file.mimetype != "image/png") {
            pngImage = false
        } else {
            pngImage = true
        }
        imagePath = req.file.path;
        if (jpgImage == false && pngImage == false) {
            fs.unlinkSync(imagePath)
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.IMAGE_TYPE_ERROR);
            return res.status(response.code).json(response);
        }
    }
    if (!request.tournamentName || !request.gameToPlay || !request.teamSize || !request.totalTeams
        || !request.entryFee || !request.prize || !request.startingDateAndTime
    ) {
        fs.unlinkSync(imagePath)
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MISSING_PARAMETER);
        return res.status(response.code).json(response);
    }
    let startDate = await GeneralHelper.dateTimeToUtc(request.startingDateAndTime)
    let tournamentNameCheck = await TournamentHelper.findActiveFranchiseTournament(request)
    if (tournamentNameCheck != null) {
        fs.unlinkSync(imagePath)
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_EXIST);
        return res.status(response.code).json(response);
    }
    let newTournamentId = await TournamentHelper.createFranchiseTournament(request, imagePath, startDate);
    let tournament = await TournamentHelper.findTournamentByIdWithPopulate(newTournamentId)
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
    response.tournament = tournament
    return res.status(response.code).json(response);
}
exports.addFranchiseTournamentResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let tournamentId = request.tournamentId
    let teamId = request.teamId
    let score = request.score
    let participatingTeamArr = []
    let filePath
    let mp4Video
    let jpgImage
    let pngImage
    if (!req.file) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.VIDEO_IMAGE_NOT_READ);
        return res.status(response.code).json(response);
    }
    if (req.file) {
        filePath = req.file.path;
        if (req.file.mimetype != "video/mp4") {
            mp4Video = false
        } else {
            mp4Video = true
        }
        if (req.file.mimetype != "image/jpeg") {
            jpgImage = false
        } else {
            jpgImage = true
        }
        if (req.file.mimetype != "image/png") {
            pngImage = false
        } else {
            pngImage = true
        }
        if (mp4Video == false && jpgImage == false && pngImage == false) {
            fs.unlinkSync(filePath);
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.VIDEO_IMAGE_TYPE_ERROR);
            return res.status(response.code).json(response);
        }
    }
    if (!req.headers.authorization) {
        fs.unlinkSync(filePath);
        response = ResponseHelper.setResponse(ResponseCode.NOT_FOUND, Message.TOKEN_NOT_FOUND);
        return res.status(response.code).json(response);
    }
    let token = req.headers.authorization;
    let userId = await tokenExtractor.getInfoFromToken(token);
    if (userId == null) {
        fs.unlinkSync(filePath);
        response = ResponseHelper.setResponse(ResponseCode.NOT_AUTHORIZE, Message.INVALID_TOKEN);
        return res.status(response.code).json(response);
    }
    if (userId != null) {
        if (!request.teamId) {
            fs.unlinkSync(filePath);
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.MISSING_PARAMETER)
            return res.status(response.code).json(response);
        }
        let tournamentDetail = await TournamentHelper.findTournamentById(tournamentId)
        let franchiseId = tournamentDetail.tournamentType
        let tournamentName = tournamentDetail.tournamentName
        let tournamentResultData = await TournamentResultHelper.findSubmittedTournamentResult(tournamentId, teamId)
        if (tournamentResultData != null) {
            fs.unlinkSync(filePath)
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_SUBMITTED)
            return res.status(response.code).json(response);
        }
        if (tournamentResultData == null) {
            let gameId = tournamentDetail.gameToPlay._id
            let tournamentType = tournamentDetail.tournamentType
            for (let i = 0; i < tournamentDetail.participatingTeams.length; i++) {
                let teamId = tournamentDetail.participatingTeams[i].toString()
                participatingTeamArr.push(teamId)
            }
            let teamCheck = participatingTeamArr.includes(teamId.toString())
            if (teamCheck == false) {
                fs.unlinkSync(filePath)
                response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.TEAM_NOT_PARTICIPATING)
                return res.status(response.code).json(response);
            }
            if (teamCheck == true) {
                let resultTournamentId = await TournamentResultHelper.submitFranchiseResult(
                    tournamentId,
                    tournamentName,
                    gameId,
                    teamId,
                    userId,
                    score,
                    tournamentType,
                    filePath)
                response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
                response.tournamentData = await this.tournamentDetailData(resultTournamentId, userId)
                return res.status(response.code).json(response);
            }
        }
    }
}
exports.showFranchiseTournamentsForResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.query
    let tournamentForResult
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
        let userFranchiseDetail = await FranchiseController.franchiseDetailData(userId)
        let franchiseId = userFranchiseDetail._id
        let pageNo
        if (request.pageNo) {
            pageNo = request.pageNo
        }
        if (!request.pageNo) {
            pageNo = 1
        }
        if (!req.query.query) {
            tournamentForResult = await TournamentResultHelper.findFranchiseTournamentForResultWithPagination(franchiseId, pageNo)
        }
        if (req.query.query) {
            let tournamentName = req.query.query
            tournamentForResult = await TournamentResultHelper.findFranchiseTournamentResultByTournamentNameWithPagination(franchiseId, tournamentName.toLowerCase(), pageNo)
        }
        let tournamentsData = await this.tournamentForResultData(tournamentForResult)
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentsData = tournamentsData
        return res.status(response.code).json(response);
    }
}
// for franchise owner
exports.updateResultForFranchiseTournament = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let updatedTournamentId
    let tournamentResultId = request.resultId
    let resultStatus = request.resultStatus.toLowerCase()
    let tournamentResultArr = []
    let tournamentResultDetail = await TournamentResultHelper.findTournamentResultByIdForResult(tournamentResultId)
    if (tournamentResultDetail == null) {
        response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.NOT_REQUESTED)
        return res.status(response.code).json(response);
    }
    if (tournamentResultDetail != null) {
        let teamId = tournamentResultDetail.teamId._id.toString()
        let tournamentId = tournamentResultDetail.tournamentId
        let userId = tournamentResultDetail.submittedBy._id
        let franchiseId = tournamentResultDetail.resultType
        if (resultStatus == "loss") {
            let checkAlreadyTournamentWinningTeam = await TournamentHelper.findAlreadyWinningTeam(tournamentId, teamId)
            if (checkAlreadyTournamentWinningTeam != null) {
                await TournamentHelper.updateTournamentWinningTeam(tournamentId, teamId)
            }
            updatedTournamentId = await TournamentResultHelper.updateTournamentResult(tournamentResultId, resultStatus)
        }
        if (resultStatus == "win") {
            let findWinningResult = await TournamentResultHelper.findAlreadyWinTournamentResult(tournamentId)
            if (findWinningResult != null) {
                response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ALREADY_WIN_TOURNAMENT_RESULT)
                return res.status(response.code).json(response);
            }
            if (findWinningResult == null) {
                updatedTournamentId = await TournamentResultHelper.updateTournamentResult(tournamentResultId, resultStatus)
                await TournamentHelper.updateTournamentTeamResult(tournamentId, teamId)
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
        let tournamentResultData = await TournamentResultHelper.findTournamentResultByIdForResult(tournamentResultId)
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
            updatedAt: tournamentResultData.updatedAt
        }
        // tournamentResultArr.push(tournamentResultObj)
        // }
        response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
        response.tournamentData = tournamentResultObj
        return res.status(response.code).json(response);
        //  }
        //
    }
}
exports.franchiseTournaments = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.query
    let tournamentFinalArr = []
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
        let tournamentList = await TournamentHelper.allFranchiseTournamentListWithoutDeleted()
        if (tournamentList.length > 0) {
            for (let i = 0; i < tournamentList.length; i++) {
                let tournamentDetailData = await this.tournamentDetailData(tournamentList[i]._id, userId)
                let tournamentJoined = tournamentDetailData.tournamentJoined
                let startingDateAndTime = tournamentList[i].startingDateAndTime
                let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
                let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
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
                    tournamentJoined: tournamentJoined
                }
                tournamentFinalArr.push(tournamentDetail)
            }
        }
    }
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.tournamentData = tournamentFinalArr
    return res.status(response.code).json(response);
}
exports.deleteFranchiseTournament = async (req, res) => {
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
        if (!request) {
            response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.ID_NOT_FOUND);
            return res.status(response.code).json(response);
        }
        if (request) {
            await TournamentHelper.deleteTournament(request);
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL);
            response.tournamentId = request.tournamentId
            return res.status(response.code).json(response);
        }
    }
}
exports.deleteFranchiseTournamentResult = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let resultId
    let notResultId = []
    let deletedResultId = []
    let resultIdArr = request.resultId
    for (let i = 0; i < resultIdArr.length; i++) {
        resultId = resultIdArr[i]
        let tournamentResultDetailById = await TournamentResultHelper.findTournamentResultByIdForResult(resultId)
        if (tournamentResultDetailById == null) {
            notResultId.push(resultId)
        }
        if (tournamentResultDetailById != null) {
            let resultVideoPath = tournamentResultDetailById.resultVideo
            fs.unlinkSync(resultVideoPath)
            await TournamentResultHelper.deleteTournamentResultById(resultId)
            deletedResultId.push(resultId)
        }
    }
    if (notResultId.length != 0) {
        console.log("Records of these ID/s not found : " + notResultId)
    }
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.resultId = deletedResultId
    return res.status(response.code).json(response);
}
exports.findTournamentByGame = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.query
    let tournamentList
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
        let tournamentData
        if ("game" in req.query && request.game.length > 0) {
            let gameName = request.game.toLowerCase()
            let gameDetail = await GameHelper.findGameByNameWithoutDelete(gameName)
            if (gameDetail != null) {
                let gameId = gameDetail._id
                tournamentList = await TournamentHelper.allTournamentListByGameNameIdWithoutDeleted(gameId)
                tournamentData = await this.tournamentListToObj(tournamentList)
            } else {
                tournamentData = []
            }
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
            response.tournamentData = tournamentData
            return res.status(response.code).json(response);
        }
        if ("game" in req.query && request.game.length == 0) {
            tournamentData = []
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
            response.tournamentData = tournamentData
            return res.status(response.code).json(response);
        }
        if (!request.game) {
            tournamentList = await TournamentHelper.allTournamentListWithoutDeleted()
            tournamentData = await this.tournamentListToObj(tournamentList)
            response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
            response.tournamentData = tournamentData
            return res.status(response.code).json(response);
        }
    }
}
//for home
exports.getAllTournamentForHome = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let allTournaments = await TournamentHelper.getAllTournamentForHome()
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
    response.tournamentData = allTournaments
    return res.status(response.code).json(response);
}
///////////////////////// Use with in tournament controller ///////////////////////////////////////////////
exports.tournamentDetailData = async (tournamentId, userId) => {
    let myTeamsArr = []
    let teamDataArr = []
    let tournamentJoined
    let tournamentData
    let hostedBy
    let leaderName
    let teamId
    let userTeams = await TeamHelper.getUserAllTeams(userId)
    for (let i = 0; i < userTeams.length; i++) {
        let myTeamsId = userTeams[i]._id
        myTeamsArr.push(myTeamsId.toString())
    }
    let participatingTeamsInTournamentArr = []
    let tournamentDetail = await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(tournamentId)
    if (tournamentDetail != null) {
        // if (tournamentDetail.tournamentType != null) {
        //     let franchiseDetail = await FranchiseHelper.findFranchiseByIdWithDelete(tournamentDetail.tournamentType)
        //     hostedBy = franchiseDetail.createdByName
        // }
        // if (tournamentDetail.tournamentType == null) {
        //     hostedBy = ""
        // }
        for (let i = 0; i < tournamentDetail.participatingTeams.length; i++) {
            let teamId = tournamentDetail.participatingTeams[i]._id
            participatingTeamsInTournamentArr.push(teamId.toString())
        }
        const intersection = participatingTeamsInTournamentArr.filter(element => myTeamsArr.includes(element));
        if (intersection.length == 0) {
            console.log("not your team")
            tournamentJoined = false
            teamId = ""
        }
        if (intersection.length > 0) {
            console.log("your team")
            let teamId = intersection[0]
            let participatingResult = myTeamsArr.includes(teamId)
            if (participatingResult == true) {
                tournamentJoined = true
                teamId = teamId
            }
            if (participatingResult == false) {
                tournamentJoined = false
                teamId = ""
            }
        }
        let result = await TournamentHelper.findTournamentByIdWithDeletedWithPopulate(tournamentId)
        if (result != null) {
            for (let i = 0; i < result.participatingTeams.length; i++) {
                let leaderId = result.participatingTeams[i].teamLeader
                let teamId = result.participatingTeams[i]._id
                let leaderDetail = await UserHelper.foundUserById(leaderId)
                if (leaderDetail != null) {
                    leaderId = leaderDetail._id
                    leaderName = leaderDetail.userDetail.userName
                }
                if (leaderDetail == null) {
                    leaderId = ""
                    leaderName = ""
                }
                let teamWinLossDetail = await TeamController.teamWinLossDetail(teamId)
                let winsCount = teamWinLossDetail.wins
                let lossCount = teamWinLossDetail.loss
                let totalCount = winsCount + lossCount
                if (totalCount == 0) {
                    totalCount = 1
                }
                let winPercentage = (winsCount / totalCount) * 100
                let totalTeamMembers
                if (result.participatingTeams[i].teamMembers.length > 0) {
                    totalTeamMembers = result.participatingTeams[i].teamMembers.length
                } else {
                    totalTeamMembers = 0
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
                    participatingInTournaments: result.participatingTeams[i].participatingInTournaments.length,
                }
                teamDataArr.push(teamDetail)
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
                gameToPlay: result.gameToPlay.gameName,
                platforms: result.gameToPlay.platforms,
                tournamentJoined: tournamentJoined,
                teamId: teamId,
                winningTeam: result.winningTeam
            }
        }
    } else {
        tournamentData = {}
        teamDataArr = []
    }
    return {...tournamentData, tournamentTeamRecord: [...teamDataArr]}
}
exports.tournamentForResultData = async (tournamentForResult) => {
    let tournamentResultArr = []
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
                submittedByUserName: tournamentForResult.data[i].submittedBy.userDetail.userName,
                submissionDate: tournamentForResult.data[i].submissionDate,
                createdAt: tournamentForResult.data[i].createdAt,
                updatedAt: tournamentForResult.data[i].updatedAt
            }
            tournamentResultArr.push(tournamentResultObj)
        }
    }
    let pagination = tournamentForResult.pagination
    return {...pagination, data: tournamentResultArr}
}
exports.tournamentListToObj = async (tournamentList) => {
    let tournamentArr = []
    if (tournamentList.length > 0) {
        for (let i = 0; i < tournamentList.length; i++) {
            let startingDateAndTime = tournamentList[i].startingDateAndTime
            let tournamentDate = moment(startingDateAndTime).format('MMM DD yyyy');
            let tournamentTime = moment(startingDateAndTime).format('hh:mm A');
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
                tournamentTime: tournamentTime
            }
            tournamentArr.push(tournamentDetail)
        }
    }
    return tournamentArr
}