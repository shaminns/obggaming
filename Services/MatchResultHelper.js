const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const MatchResult = require("../Models/MatchResult")
const GeneralHelper = require("./GeneralHelper");
const LadderResult = require("../Models/LadderResult");
exports.addNewResult = async (matchId, matchName, gameToPlay, results) => {
    let matchResult = new MatchResult({
            _id: new mongoose.Types.ObjectId(),
            matchId: matchId,
            matchName: matchName,
            gameToPlay: gameToPlay,
            results: results
        }
    )
    await matchResult.save()
    return matchResult._id
}
exports.addResult = async (matchId, results) => {
    await MatchResult.updateOne({matchId: matchId}, {$push: {results: results}})
    let matchResult = await MatchResult.findOne({matchId: matchId})
    return matchResult._id
}
exports.findMatchByIdWithoutDel = async (matchResultId) => {
    return await MatchResult.findOne({_id: matchResultId, isDeleted: false})
}
exports.findMatchResultByIdWithDel = async (matchResultId) => {
    return await MatchResult.findOne({_id: matchResultId}).populate("winner gameToPlay", "userDetail.userName gameName")
}
exports.findMatchByIdPopulatedWithoutDel = async (matchResultId) => {
    return await MatchResult.findOne({
        _id: matchResultId,
        isDeleted: false
    }).populate("userId gameToPlay", "userDetail.userName userDetail.fullName gameName")
}
exports.findMatchByIdPopulatedWithDel = async (matchResultId) => {
    return await MatchResult.findOne({
        _id: matchResultId
    }).populate("matchId userId gameToPlay", "matchName userDetail.userName userDetail.fullName gameName")
}
exports.allMatchPopulatedWithoutDel = async () => {
    return await MatchResult.find({isDeleted: false}).populate("matchId userId gameToPlay", "matchName userDetail.userName userDetail.fullName gameName")
}
exports.allMatchWithoutDel = async () => {
    return await MatchResult.find({isDeleted: false}).populate("winner gameToPlay", "userDetail.userName gameName")
}
exports.findMatchByMatchNameWithoutDel = async (matchName) => {
    return await MatchResult.find({
        matchName: {$regex: matchName}, isDeleted: false
    })
}
exports.findMatchByMatchNameWithPaginationWithoutDel = async (matchName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await MatchResult.find({matchName: {$regex: matchName}, isDeleted: false})
        .populate("winner gameToPlay", "userDetail.userName gameName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await MatchResult.find({matchName: {$regex: matchName}, isDeleted: false}).countDocuments();
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
exports.allMatchWithPaginationWithoutDel = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await MatchResult.find({isDeleted: false})
        .populate("winner gameToPlay", "userDetail.userName gameName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await MatchResult.find({isDeleted: false}).countDocuments();
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
exports.findMatchByMatchNamePopulatedWithoutDel = async (matchName) => {
    return await MatchResult.find({
        matchName: {$regex: matchName}, isDeleted: false
    }).populate("matchId gameToPlay", "matchName gameName")
}
exports.checkAlreadySubmitMatchResult = async (matchId, userId) => {
    return await MatchResult.findOne({
        matchId: matchId,
        results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
    })
}
exports.updateMatchResult = async (matchResultId, userId, resultStatus) => {
    //findOneAndUpdate
    await MatchResult.updateOne(
        {
            _id: mongoose.Types.ObjectId(matchResultId),
            results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
        },
        {$set: {'results.$.result': resultStatus}})
    return true
}
exports.findAlreadyWinMatchResult = async (matchId) => {
    return await MatchResult.findOne({matchId: matchId, result: "win", isDeleted: false})
}
exports.findMatchResultByIdWithoutPopulate = async (matchResultId) => {
    return await MatchResult.findOne({_id: matchResultId})
}
exports.deleteMatchResultById = async (resultId) => {
    return await MatchResult.updateOne({_id: resultId}, {
        $set: {
            isDeleted: true,
            deletedAt: moment(),
            resultVideo: ""
        }
    })
}
exports.findUserMatchResult = async (userId) => {
    return await MatchResult.find({results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}})
}
exports.findUserMatchResultByMatchId = async (userId, matchId) => {
    return await MatchResult.findOne({
        matchId: mongoose.Types.ObjectId(matchId),
        results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
    })
}
exports.findMatchResultByMatchId = async (matchId) => {
    return await MatchResult.findOne({matchId: matchId})
}
exports.updateVideoFileLink = async (resultId, userId) => {
    //findOneAndUpdate
    await MatchResult.updateOne(
        {
            _id: mongoose.Types.ObjectId(resultId),
            results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
        },
        {$set: {'results.$.resultVideo': ""}})
    return true
}
exports.updateWinnerUser = async (resultId, userId) => {
    //findOneAndUpdate
    await MatchResult.updateOne(
        {
            _id: mongoose.Types.ObjectId(resultId),
        },
        {$set: {winner: mongoose.Types.ObjectId(userId)}})
    return true
}
exports.checkAlreadyWinLossMatchResult = async (matchId, userId) => {
    return await MatchResult.findOne({
        matchId: mongoose.Types.ObjectId(matchId),
        results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
    }, {'results.result': 1})
}
exports.updateMatchResultWinnerToNull = async (matchId) => {
    return await MatchResult.updateOne({matchId: mongoose.Types.ObjectId(matchId)}, {$set: {winner: null}})
}
exports.checkPendingForMatchResult = async (matchId, userId) => {
    return await MatchResult.findOne({
        matchId: mongoose.Types.ObjectId(matchId),
        results: {$elemMatch: {playerId: mongoose.Types.ObjectId(userId)}}
    }, {'results.result': 1, 'results.playerId': 1})
}
exports.checkPendingResultExist = async (resultId) => {
    return await MatchResult.findOne({_id: mongoose.Types.ObjectId(resultId), 'results.result': {$in: ["pending"]}})
}