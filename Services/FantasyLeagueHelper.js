// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const FantasyLeague = require("../Models/FantasyLeague")
const FantasyTeamInvite = require("../Models/FantasyTeamInvite")
const FantasyLeagueSchedule = require("../Models/FantasyLeagueSchedule")
const PlayerLeaguePoints = require("../Models/PlayersLeaguePoints")
const FantasyLeagueTeamPoints = require("../Models/FantasyLeagueTeamPoints")
//Helpers
const GeneralHelper = require("./GeneralHelper");
const TeamInvite = require("../Models/TeamInvite");
const LeagueSchedule = require("../Models/LeagueSchedule");
const LeagueResult = require("../Models/LeagueResult");
const League = require("../Models/League");
//
exports.findFantasyLeagueByNameWithoutDelete = async (flName) => {
    return await FantasyLeague.findOne({flName: flName, isDeleted: false})
}
exports.findFantasyLeagueByIdWithoutDelete = async (fantasyLeagueId) => {
    return await FantasyLeague.findOne({_id: mongoose.Types.ObjectId(fantasyLeagueId), isDeleted: false})
}
exports.findFantasyLeagueByIdWithDelete = async (fantasyLeagueId) => {
    return await FantasyLeague.findOne({_id: mongoose.Types.ObjectId(fantasyLeagueId)})
}
exports.creatFantasyLeague = async (flName, totalTeams, teamSize, draftDateAndTime, leagueId,
                                    gameName, gameId, userId, flTitleImage, leagueRandomId,
                                    flType, leagueName) => {
    const fantasyLeague = new FantasyLeague({
        _id: new mongoose.Types.ObjectId(),
        flName: flName,
        totalTeams: totalTeams,
        teamSize: teamSize,
        draftDateAndTime: draftDateAndTime,
        league: leagueId,
        gameName: gameName,
        gameToPlay: gameId,
        createdBy: userId,
        flTitleImage: flTitleImage,
        leagueRandomId: leagueRandomId,
        flType: flType,
        leagueName: leagueName
    })
    await fantasyLeague.save()
    return fantasyLeague._id
}
exports.addFantasyTeam = async (fantasyLeagueId, userFantasyTeamId) => {
    return await FantasyLeague.updateOne({_id: mongoose.Types.ObjectId(fantasyLeagueId)},
        {$push: {flTeams: mongoose.Types.ObjectId(userFantasyTeamId)}})
}
exports.findAllPublicFantasyLeagues = async () => {
    return await FantasyLeague.find({isDeleted: false, flType: "public"})
}
exports.findAllPublicFantasyLeaguesWithPopulate = async () => {
    return await FantasyLeague.find({isDeleted: false, flType: "public"}).populate("league", "leagueName")
}
exports.findAllPrivateFantasyLeagues = async (userId) => {
    return await FantasyLeague.find({isDeleted: false, flType: "private", createdBy: mongoose.Types.ObjectId(userId)})
}
exports.findAllPublicFantasyLeaguesByGameName = async (gameName) => {
    return await FantasyLeague.find({isDeleted: false, flType: "public", gameName: gameName})
}
exports.findFantasyLeagueByFlTeam = async (flTeamId) => {
    return await FantasyLeague.findOne({flTeams: {$in: [mongoose.Types.ObjectId(flTeamId)]}, isDeleted: false})
}
exports.findAllPrivateFantasyLeaguesByGameName = async (userId, gameName) => {
    return await FantasyLeague.find({
        isDeleted: false,
        flType: "private",
        gameName: gameName,
        createdBy: mongoose.Types.ObjectId(userId)
    })
}
exports.searchFantasyLeagueByNameWithPagination = async (searchStr, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let result = await FantasyLeague.find({
        flType: "public",
        isDeleted: false,
        $or: [{flName: {$regex: searchStr}}, {leagueName: {$regex: searchStr}}]
    })
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await FantasyLeague.find({
        flType: "public",
        isDeleted: false,
        $or: [{flName: {$regex: searchStr}}, {leagueName: {$regex: searchStr}}]
    }).countDocuments();
    return {
        pagination: GeneralHelper.makePaginationObject(
            pg.pageNo,
            pg.pageSize,
            pg.skip,
            total,
            result.length
        ),
        data: result,
    };
}
exports.allFantasyLeaguesWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let result = await FantasyLeague.find({flType: "public", isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await FantasyLeague.find({flType: "public", isDeleted: false}).countDocuments();
    return {
        pagination: GeneralHelper.makePaginationObject(
            pg.pageNo,
            pg.pageSize,
            pg.skip,
            total,
            result.length
        ),
        data: result,
    };
}
exports.updateFantasyLeagueDetail = async (data) => {
    let flDetail = await FantasyLeague.findOne({_id: mongoose.Types.ObjectId(data._id)})
    flDetail.flName = data.flName || flDetail.flName
    flDetail.teamSize = data.teamSize || flDetail.teamSize
    flDetail.totalTeams = data.totalTeams || flDetail.totalTeams
    let fantasyLeague = new FantasyLeague(flDetail)
    await fantasyLeague.save()
    return flDetail._id
}
exports.deleteFantasyLeague = async (flId) => {
    return await FantasyLeague.updateOne({_id: mongoose.Types.ObjectId(flId)}, {
        $set: {
            isDeleted: true,
            deletedAt: moment()
        }
    })
}
exports.findInvite = async (fantasyLeagueId, userId, friendId) => {
    return await FantasyTeamInvite.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        to: mongoose.Types.ObjectId(friendId),
        from: mongoose.Types.ObjectId(userId),
        status: {$in: ["pending", "accepted"]},
        isDeleted: false
    })
}
exports.createFlInvite = async (fantasyLeagueId, userId, friendId) => {
    let flInvite = new FantasyTeamInvite({
        _id: new mongoose.Types.ObjectId(),
        fantasyLeagueId: fantasyLeagueId,
        from: userId,
        to: friendId
    })
    await flInvite.save()
    return await flInvite._id
}
exports.findAllReceivedFlRequest = async (userId) => {
    return await FantasyTeamInvite.find({to: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.findAllSendFlRequest = async (userId) => {
    return await FantasyTeamInvite.find({from: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.findRequestedInvite = async (fantasyLeagueId, userId, fromId) => {
    return await FantasyTeamInvite.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        from: mongoose.Types.ObjectId(fromId),
        to: mongoose.Types.ObjectId(userId),
        status: "pending",
        isDeleted: false
    }).populate("fantasyLeagueId from to", "flName userDetail.fullName userDetail.userName");
};
exports.updateInvitationStatus = async (fantasyLeagueId, userId, fromId, status) => {
    return await FantasyTeamInvite.updateOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        from: mongoose.Types.ObjectId(fromId),
        to: mongoose.Types.ObjectId(userId),
        status: "pending"
    }, {$set: {status: status}})
}
exports.checkAlreadyFlScheduleByFlId = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.find({fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)})
}
exports.saveFantasyLeagueSchedule = async (roundNumber, srNo, randomNumber, scheduleType, leagueId, fantasyLeagueId, teamOneId, teamTwoId) => {
    const flSchedule = new FantasyLeagueSchedule({
        _id: new mongoose.Types.ObjectId(),
        roundNumber: roundNumber,
        rowNumber: srNo,
        randomMatchId: randomNumber,
        scheduleType: scheduleType,
        leagueId: leagueId,
        fantasyLeagueId: fantasyLeagueId,
        teamOne: teamOneId,
        teamTwo: teamTwoId,
    });
    await flSchedule.save();
    return flSchedule._id
}
exports.checkLeagueSchedule = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.find({fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)})
}
exports.getLeagueDetailForMaxRoundNumber = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.find({fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)}).sort({roundNumber: -1}).limit(1)
}
exports.checkPendingFantasyLeagueScheduleWinner = async (fantasyLeagueId, roundNumber) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: roundNumber,
        winner: null
    })
}
exports.getPlayerLeaguePointByRoundNumber = async (leaguePlayerId, leagueId, maxRoundNumber) => {
    return await PlayerLeaguePoints.findOne({
        playerId: mongoose.Types.ObjectId(leaguePlayerId),
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: maxRoundNumber
    })
}
exports.findSchedulePendingResult = async (fantasyLeagueId, maxRoundNumber) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumber,
        winner: null
    })
}
// exports.findScheduleOfRound = async (fantasyLeagueId, leagueId, maxRoundNumber) => {
//     return await FantasyLeagueSchedule.find({
//         leagueId: fantasyLeagueId,
//         leagueId: mongoose.Types.ObjectId(leagueId),
//         roundNumber: maxRoundNumber
//     })
// }
exports.findScheduleOfRound = async (fantasyLeagueId, maxRoundNumber) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumber
    })
}
exports.updateFantasyLeagueScheduleResult = async (roundNumber, fantasyLeagueId, teamOneId) => {
    return await FantasyLeagueSchedule.updateOne({
        roundNumber: roundNumber,
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        $or: [{teamOne: mongoose.Types.ObjectId(teamOneId)}, {teamTwo: mongoose.Types.ObjectId(teamOneId)}]
    }, {$set: {winner: teamOneId}})
}
exports.addFantasyTeamPoint = async (maxRoundNumber, teamFinalPoints, flTeamId, leagueId, fantasyLeagueId) => {
    const fantasyLeagueTeamPoints = new FantasyLeagueTeamPoints({
        _id: new mongoose.Types.ObjectId(),
        roundNumber: maxRoundNumber,
        flTeamId: flTeamId,
        leagueId: leagueId,
        fantasyLeagueId: fantasyLeagueId,
        points: teamFinalPoints
    })
    await fantasyLeagueTeamPoints.save()
    return await fantasyLeagueTeamPoints._id
}
exports.getPreviousRoundFourTeamList = async (fantasyLeagueId, leagueId, maxRoundNumber) => {
    return await FantasyLeagueTeamPoints.find({
            fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
            leagueId: mongoose.Types.ObjectId(leagueId),
            roundNumber: maxRoundNumber
        },
        {flTeamId: 1, points: 1, _id: 0}).sort({points: -1})
}
exports.getPreviousRoundWinnerList = async (fantasyLeagueId, leagueId, maxRoundNumber) => {
    return await FantasyLeagueTeamPoints.find({
            fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
            leagueId: mongoose.Types.ObjectId(leagueId),
            roundNumber: maxRoundNumber,
            result: "win"
        },
        {flTeamId: 1, points: 1, _id: 0}).sort({points: -1})
}
exports.maxRoundNumberFromFlScheduleWinner = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        winner: {$ne: null}
    }).sort({roundNumber: -1}).limit(1)
}
exports.maxRoundNumberFromFlScheduleWinnerNull = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        winner: null
    }).sort({roundNumber: -1}).limit(1)
}
// exports.getPreviousRoundWinnerList = async (fantasyLeagueId, leagueId, maxRoundNumber) => {
//     return await F
// }
exports.findFlScheduleByFantasyLeagueId = async (fantasyLeagueId) => {
    return await LeagueSchedule.find({fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)}
    )
}
exports.checkAlreadyLeagueScheduleForPlayoff = async (fantasyLeagueId, roundNumber) => {
    return await LeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: roundNumber,
        scheduleType: "playoff",
        winner: null
    })
}
// exports.findPendingWinnerList = async (fantasyLeagueId, maxRoundNumber, teamId) => {
//     return await FantasyLeagueSchedule.find({
//         fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
//         roundNumber: maxRoundNumber,
//         flTeamId: mongoose.Types.ObjectId(teamId),
//         winner: null
//     })
// }
exports.findPendingWinnerList = async (fantasyLeagueId, maxRoundNumber) => {
    return await FantasyLeagueSchedule.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumber,
        winner: null
    })
}
exports.findAlreadyTeamPointsExistForScheduleRound = async (fantasyLeagueId, maxRoundNumberFromFlScheduleWinner, flTeamId) => {
    return await FantasyLeagueTeamPoints.find({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumberFromFlScheduleWinner,
        flTeamId: mongoose.Types.ObjectId(flTeamId)
    })
}
exports.updateTeamPointWinner = async (fantasyLeagueId, maxRoundNumber, teamId) => {
    return await FantasyLeagueTeamPoints.updateOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumber,
        flTeamId: mongoose.Types.ObjectId(teamId)
    }, {$set: {result: "win"}})
}
exports.updateTeamPointLooser = async (fantasyLeagueId, maxRoundNumber, teamId) => {
    return await FantasyLeagueTeamPoints.updateOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        roundNumber: maxRoundNumber,
        flTeamId: mongoose.Types.ObjectId(teamId)
    }, {$set: {result: "loss"}})
}
exports.getPlayOffMatchDataWithRoundNumber = async (fantasyLeagueId, roundNumber, rowNumber) => {
    return await FantasyLeagueSchedule.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        scheduleType: "playoff",
        roundNumber: roundNumber,
        rowNumber: rowNumber
    })
}
exports.checkLeagueFinalExist = async (fantasyLeagueId) => {
    return await FantasyLeagueSchedule.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        scheduleType: "final"
    })
}
exports.findLeagueScheduleDetailByRoundNumber = async (roundNumber, fantasyLeagueId) => {
    return await FantasyLeagueSchedule.findOne({
        roundNumber: roundNumber,
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)
    })
}
exports.updateWinnerTeam = async (fantasyLeagueId, teamId) => {
    return await FantasyLeague.updateOne({_id: mongoose.Types.ObjectId(fantasyLeagueId)}, {$set: {winner: mongoose.Types.ObjectId(teamId)}})
}
exports.getAllFlTeamPointsList = async (fantasyLeagueId, flTeamId) => {
    return await FantasyLeagueTeamPoints.find({
        flTeamId: mongoose.Types.ObjectId(flTeamId),
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId)
    }, {points: 1, _id: 0})
}
exports.flTeamsDetailFromScheduel = async (recordId) => {
    return await FantasyLeagueSchedule.findOne({_id: mongoose.Types.ObjectId(recordId)})
}
exports.getPlayerPointsByLeagueIdAndMaxRoundNumber = async (playerId, leagueId, roundNumber) => {
    return await PlayerLeaguePoints.find({
        playerId: mongoose.Types.ObjectId(playerId),
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: {$lte: roundNumber}
    })
}
////////only for developer /////////////////////////////////////
exports.removeAllRecord = async () => {
    await FantasyLeague.remove()
    return true
}
exports.removeAllSchedule = async () => {
    await FantasyLeagueSchedule.remove()
    return true
}
// /for developer ////////////////////////////////////////////////
exports.deleteAllFlTeamInvite = async () => {
    await FantasyTeamInvite.remove()
    return true
}