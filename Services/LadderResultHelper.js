const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const LadderResult = require("../Models/LadderResult")
const GeneralHelper = require("./GeneralHelper");
const Ladder = require("../Models/Ladder");
exports.submitResult = async (ladderId, ladderName, gameId, teamId, userId, score, filePath) => {
    const ladderResult = new LadderResult({
        _id: new mongoose.Types.ObjectId(),
        ladderId: ladderId,
        ladderName: ladderName,
        teamId: teamId,
        gameToPlay: gameId,
        score: score,
        resultVideo: filePath,
        submittedBy: userId,
        submissionDate: moment()
    });
    await ladderResult.save();
    return ladderResult.ladderId
}
exports.showAllLadderRecord = async () => {
    return await LadderResult.find({isDeleted: false}).populate("teamId gameToPlay ladderId submittedBy", "teamViewName gameName ladderName userDetail.userName")
}
exports.findLadderResultByIdForResult = async (ladderResultId) => {
    return await LadderResult.findOne({_id: mongoose.Types.ObjectId(ladderResultId)})//, result: "pending"
}
exports.findLadderResultById = async (ladderResultById) => {
    return await LadderResult.findOne({_id: ladderResultById}).populate("teamId gameToPlay ladderId submittedBy", "teamViewName gameName ladderName userDetail.userName")
}
exports.updateLadderResult = async (ladderResultId, resultStatus) => {
    return await LadderResult.updateOne({_id: ladderResultId}, {$set: {result: resultStatus}})
}
exports.findResultByLadderName = async (ladderName) => {
    let lowerLadderName = ladderName.toLowerCase()
    return await LadderResult.find({
        ladderName: {$regex: lowerLadderName},
        isDeleted: false
    }).populate("teamId gameToPlay ladderId submittedBy", "teamViewName gameName ladderName userDetail.userName")
}
exports.findAlreadySubmitResult = async (ladderId, teamId) => {
    return await LadderResult.findOne({
        ladderId: mongoose.Types.ObjectId(ladderId),
        teamId: mongoose.Types.ObjectId(teamId)
    })
}
exports.findPendingResultByLadderId = async (ladderId) => {
    return await LadderResult.find({ladderId: mongoose.Types.ObjectId(ladderId), result: "pending", isDeleted: false})
}
exports.findLadderResultExist = async (ladderId) => {
    return await LadderResult.find({ladderId: mongoose.Types.ObjectId(ladderId), isDeleted: false})
}
// ladder result
exports.laddersResultByNameWithPagination = async (ladderName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await LadderResult.find({ladderName: {$regex: ladderName}, isDeleted: false})
        .populate("teamId gameToPlay ladderId submittedBy", "teamViewName gameName ladderName userDetail.userName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await LadderResult.find({ladderName: {$regex: ladderName}, isDeleted: false}).countDocuments();
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
exports.laddersResultWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await LadderResult.find({isDeleted: false})
        .populate("teamId gameToPlay ladderId submittedBy", "teamViewName gameName ladderName userDetail.userName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await LadderResult.find({isDeleted: false}).countDocuments();
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
//
///
// for developer
exports.deleteLadderResultById = async (resultId) => {
    return await LadderResult.updateOne({_id: resultId}, {
        $set: {
            isDeleted: true,
            deletedAt: moment(),
            resultVideo: ""
        }
    })
}