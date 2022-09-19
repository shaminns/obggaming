const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const Ladder = require("../Models/Ladder");
const TotalWarLadder = require("../Models/TotalWarLadder")
const TotalWarLadderMatch = require("../Models/TotalWarLadderMatches")
const TotalWarLadderResult = require("../Models/TotalWarLadderResult")
// Helpers
const GeneralHelper = require("./GeneralHelper");
const LeagueResult = require("../Models/LeagueResult");
exports.createTotalWarLadder = async (ladderId, gameToPlay, gameName, participatingTeams) => {
    let twl = new TotalWarLadder({
        _id: new mongoose.Types.ObjectId(),
        ladder: ladderId,
        gameToPlay: gameToPlay,
        gameName: gameName,
        participatingTeams: participatingTeams
    })
    await twl.save()
    return await twl._id
}
exports.findTotalWarLadderByLadderIdWithoutDelete = async (ladderId) => {
    return await TotalWarLadder.findOne({ladder: mongoose.Types.ObjectId(ladderId), isDeleted: false})
}
exports.findTotalWarLadderByLadderIdWithDelete = async (ladderId) => {
    return await TotalWarLadder.findOne({ladder: mongoose.Types.ObjectId(ladderId)})
}
exports.findTotalWarLadderById = async (twlId) => {
    return await TotalWarLadder.findOne({_id: mongoose.Types.ObjectId(twlId)})
}
exports.createTotalWarLadderMatch = async (ladderId, totalWarLadderId, matchId, firstTeam, secondTeam) => {
    let twlMatch = new TotalWarLadderMatch({
        _id: new mongoose.Types.ObjectId(),
        ladder: ladderId,
        twlId: totalWarLadderId,
        matchId: matchId,
        teamOne: firstTeam,
        teamTwo: secondTeam
    })
    await twlMatch.save()
    return twlMatch._id
}
exports.findTotalWarLadderMatchByTwlId = async (totalWarLadderId) => {
    return await TotalWarLadderMatch.find({twlId: mongoose.Types.ObjectId(totalWarLadderId)})
}
exports.findAlreadyResultSubmittedByTeam = async (totalWarLadderId, teamId) => {
    return await TotalWarLadderResult.findOne({
        twlId: mongoose.Types.ObjectId(totalWarLadderId),
        teamId: mongoose.Types.ObjectId(teamId),
        isDeleted: false
    })
}
exports.submitResult = async (totalWarLadderId, teamId, score, ladderId, ladderName,
                              gameToPlay, gameName, teamName, matchId, userId, filePath) => {
    let twlResult = new TotalWarLadderResult({
        _id: new mongoose.Types.ObjectId(),
        twlId: totalWarLadderId,
        teamId: teamId,
        score: score,
        ladder: ladderId,
        ladderName: ladderName,
        gameToPlay: gameToPlay,
        gameName: gameName,
        teamName: teamName,
        matchId: matchId,
        submissionBy: userId,
        submissionDate: moment(),
        resultVideo: filePath
    })
    await twlResult.save()
    return twlResult._id
}
exports.findTeamMatchByTeamId = async (totalWarLadderId, teamId) => {
    return await TotalWarLadderMatch.findOne({
        twlId: mongoose.Types.ObjectId(totalWarLadderId),
        $or: [{teamOne: mongoose.Types.ObjectId(teamId)}, {teamTwo: mongoose.Types.ObjectId(teamId)}]
    })
}
exports.findTeamPariticipated = async (totalWarLadderId, teamId) => {
    return await TotalWarLadder.findOne({
        _id: mongoose.Types.ObjectId(totalWarLadderId),
        participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}
    })
}
exports.getAllTotalWarLadderResultWithoutDelete = async () => {
    return await TotalWarLadderResult.find({isDeleted: false})
}
//
exports.getAllTotalWarLadderResultWithoutDeleteWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition //= [{leagueId: leagueId}];
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await TotalWarLadderResult.find({isDeleted: false,})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TotalWarLadderResult.find({isDeleted: false,}).countDocuments();
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
exports.searchAllTotalWarLadderResultWithoutDeleteWithPagination = async (searchStr, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition //= [{leagueId: leagueId}];
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await TotalWarLadderResult.find({
        isDeleted: false,
        $or: [{ladderName: {$regex: searchStr}}, {gameName: {$regex: searchStr}},
            {teamName: {$regex: searchStr}}]
    })
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TotalWarLadderResult.find({
        isDeleted: false,
        $or: [{ladderName: {$regex: searchStr}}, {gameName: {$regex: searchStr}},
            {teamName: {$regex: searchStr}}]
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
exports.findTwlResultByResultId = async (resultId) => {
    return await TotalWarLadderResult.findOne({_id: mongoose.Types.ObjectId(resultId)})
}
exports.deleteTwlResultById = async (resultId) => {
    return await TotalWarLadderResult.updateOne({_id: mongoose.Types.ObjectId(resultId)}, {
        $set: {
            isDeleted: true,
            resultVideo: ""
        }
    })
}
exports.findAlreadyResultStatusByMatchId = async (matchId, resultStatus) => {
    return await TotalWarLadderResult.findOne({matchId: matchId, result: resultStatus})
}
exports.updateResultStatus = async (resultId, resultStatus) => {
    await TotalWarLadderResult.updateOne({_id: mongoose.Types.ObjectId(resultId)},
        {$set: {result: resultStatus}})
    return true
}
exports.getAllTotalWarLadderResultByTwlId = async (totalWarLadderId) => {
    return await TotalWarLadderResult.find({twlId: mongoose.Types.ObjectId(totalWarLadderId)})
}
exports.getAllTotalWarLadderResultByTwlIdWithoutDelete = async (totalWarLadderId) => {
    return await TotalWarLadderResult.find({twlId: mongoose.Types.ObjectId(totalWarLadderId), isDeleted: false})
}
exports.findResultById = async (totalWarLadderId, teamId) => {
    return await TotalWarLadderResult.findOne({
        twlId: mongoose.Types.ObjectId(totalWarLadderId),
        teamId: mongoose.Types.ObjectId(teamId)
    })
}