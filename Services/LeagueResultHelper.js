// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const User = require("../Models/User");
const League = require("../Models/League")
const LeagueResult = require("../Models/LeagueResult")
const Team = require("../Models/Team");
const LeagueSchedule = require("../Models/LeagueSchedule");
const GeneralHelper = require("../Services/GeneralHelper");
const TournamentResult = require("../Models/TournamentResult");
const PlayerLeaguePoints = require("../Models/PlayersLeaguePoints")
//
exports.findAlreadySubmittedResult = async (franchiseTeamId, matchId) => {
    return await LeagueResult.findOne({
        teamId: mongoose.Types.ObjectId(franchiseTeamId),
        matchId: matchId
    })
}
exports.addLeagueResult = async (userId, leagueId, leagueName, franchiseTeamId,
                                 roundNumber, score, scheduleType, matchId, filePath, teamViewName, gameName) => {
    const leagueResult = new LeagueResult({
        _id: new mongoose.Types.ObjectId(),
        leagueId: leagueId,
        leagueName: leagueName,
        teamId: franchiseTeamId,
        score: score,
        roundNumber: roundNumber,
        submittedBy: userId,
        submissionDate: moment().utc(),
        scheduleType: scheduleType,
        matchId: matchId,
        resultVideo: filePath,
        teamViewName: teamViewName,
        gameName: gameName
    });
    await leagueResult.save();
    return leagueResult._id
}
exports.findAllLeagueResultsWithOutDeleteForFranchise = async (leagueIdArr) => {
    return await LeagueResult.find({leagueId: {$in: leagueIdArr}}).populate("teamId", "teamViewName");
}
exports.findLeagueResultWithLeagueNameOrMatchId = async (leagueIdArr, searchStr) => {
    return await LeagueResult.find({
        leagueId: {$in: leagueIdArr},
        $or: [{leagueName: {$regex: searchStr}}, {matchId: {$regex: searchStr}}]
    }).populate("teamId", "teamViewName");
}
exports.checkAlreadyLeagueScheduleResult = async (leagueId) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId)
    })
}
exports.checkAlreadyLeagueSchedulePendingResult = async (leagueId, roundNumber) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: roundNumber,
        result: "pending"
    })
}
exports.findLeagueResultByResultId = async (resultId) => {
    return await LeagueResult.findOne({_id: mongoose.Types.ObjectId(resultId), isDeleted: false})
}
exports.findAlreadyWinLossOfMatchId = async (matchId, resultStatus) => {
    return await LeagueResult.findOne({matchId: matchId, result: resultStatus})
}
exports.updateLeagueMatchResult = async (resultId, resultStatus, killPoints, placePoints) => {
    return await LeagueResult.updateOne({_id: mongoose.Types.ObjectId(resultId)}, {
        $set: {
            result: resultStatus,
            killPoints: killPoints,
            placePoints: placePoints
        }
    })
}
exports.updateLeagueMatchResultPlayerPoints = async (resultId, playerId, killPoints) => {
    return await LeagueResult.updateOne({_id: mongoose.Types.ObjectId(resultId)}, {
        $push: {playerResults: {userId: playerId, killPoints: killPoints}}
    })
}
exports.getPreviousRoundWinnerList = async (leagueId, roundNumber) => {
    return await LeagueResult.find({
            result: "win",
            leagueId: mongoose.Types.ObjectId(leagueId),
            roundNumber: roundNumber
        },
        {teamId: 1, _id: 0}).sort({killPoints: -1})
}
exports.getWinnerTeamsWithKillPoint = async (teamId, leagueId, maxRoundNumber) => {
    return await LeagueResult.find({
        teamId: mongoose.Types.ObjectId(teamId),
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: maxRoundNumber
    }, {_id: 0, teamId: 1, killPoints: 1})
}
exports.getPreviousRoundFourTeamList = async (leagueId, roundNumber) => {
    return await LeagueResult.find({
            leagueId: mongoose.Types.ObjectId(leagueId),
            roundNumber: roundNumber
        },
        {teamId: 1, _id: 0}).sort({killPoints: -1})
}
exports.findTeamWinDetail = async (leagueId, teamId) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        teamId: mongoose.Types.ObjectId(teamId),
        result: "win"
    })
}
exports.findTeamLossDetail = async (leagueId, teamId) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        teamId: mongoose.Types.ObjectId(teamId),
        result: "loss"
    })
}
exports.findTeamDetailInLeague = async (leagueId, teamId) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        teamId: mongoose.Types.ObjectId(teamId)
    })
}
exports.deleteLeagueResultById = async (resultId) => {
    return await LeagueResult.updateOne({_id: resultId}, {
        $set: {
            isDeleted: true,
            deletedAt: moment(),
            resultVideo: ""
        }
    })
}
exports.findAllLeagueResultsWithOutDelete = async (pageNo) => {
    return await LeagueResult.find().populate("teamId", "teamViewName")
}
exports.findLeagueResultWithLeagueNameOrMatchIdWithPagination = async (searchStr, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition //= [{leagueId: leagueId}];
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await LeagueResult.find({
        $or: [{leagueName: {$regex: searchStr}}, {matchId: {$regex: searchStr}},
            {gameName: {$regex: searchStr}}, {teamViewName: {$regex: searchStr}}]
    }).populate("teamId", "teamViewName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await LeagueResult.find({
        $or: [{leagueName: {$regex: searchStr}}, {matchId: {$regex: searchStr}},
            {gameName: {$regex: searchStr}}, {teamViewName: {$regex: searchStr}}]
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
exports.findAllLeagueResultsWithOutDeleteWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition //leagueId:{$in:leagueIdArr}
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await LeagueResult.find().populate("teamId", "teamViewName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await LeagueResult.find().countDocuments();
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
exports.findPendingResultByMatchId = async (matchId) => {
    return await LeagueResult.find({matchId: matchId, result: "pending"})
}
exports.findTotalResultByMatchId = async (matchId) => {
    return await LeagueResult.find({matchId: matchId})
}
exports.checkAlreadyPlayerResults = async (resultId) => {
    return await LeagueResult.findOne({_id: mongoose.Types.ObjectId(resultId)},
        {_id: 0, playerResults: 1})
}
exports.setPlayerResultArrEmpty = async (resultId) => {
    return await LeagueResult.updateOne({_id: mongoose.Types.ObjectId(resultId)},
        {$set: {playerResults: []}})
}
exports.addPlayerLeaguePoints = async (playerId, userKillPoints, leagueId, scheduleType, roundNumber) => {
    const userLeagueRoundKillPoints = new PlayerLeaguePoints({
        _id: new mongoose.Types.ObjectId(),
        playerId: playerId,
        points: userKillPoints,
        leagueId: leagueId,
        scheduleType: scheduleType,
        roundNumber: roundNumber
    });
    await userLeagueRoundKillPoints.save();
    return userLeagueRoundKillPoints._id
}
exports.deletePlayerLeaguePoints = async (playerId, leagueId, scheduleType, roundNumber) => {
    return await PlayerLeaguePoints.deleteOne({
        playerId: mongoose.Types.ObjectId(playerId),
        leagueId: mongoose.Types.ObjectId(leagueId),
        scheduleType: scheduleType,
        roundNumber: roundNumber
    })
}
exports.findPendingResultByLeagueIdAndRound = async (leagueId, maxRoundNumber) => {
    return await LeagueResult.find({leagueId: mongoose.Types.ObjectId(leagueId), roundNumber: maxRoundNumber})
}
exports.findPendingWinnerRoundByLeagueIdAndRound = async (leagueId, maxRoundNumber) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: maxRoundNumber,
        result: "pending"
    })
}
///////////////////////////////////////////////////////
///////////////////////////////////////////////////
/////// for developer /////////////////////////////
exports.findLeagueResultDetailByLeagueId = async (leagueId) => {
    return await LeagueResult.find({
        leagueId: mongoose.Types.ObjectId(leagueId)
    })
}
exports.deleteLeagueResultDetailByLeagueId = async (leagueId) => {
    return await LeagueResult.deleteMany({
        leagueId: mongoose.Types.ObjectId(leagueId)
    })
}
exports.deleteLeagueResultByResultId = async (resultId) => {
    return await LeagueResult.deleteOne({_id: mongoose.Types.ObjectId(resultId)})
}
exports.removeAllLeagueResult = async () => {
    await LeagueResult.remove()
    return true
}