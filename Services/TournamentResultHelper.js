const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const TournamentResult = require("../Models/TournamentResult")
const {tournamentById} = require("../Controllers/TournamentController");
const GeneralHelper = require("../Services/GeneralHelper");
const LeagueSchedule = require("../Models/LeagueSchedule");
//
exports.submitResult = async (tournamentId, tournamentName, gameId, teamId, userId, score, tournamentType, filePath) => {
    const tournamentResult = new TournamentResult({
        _id: new mongoose.Types.ObjectId(),
        tournamentId: tournamentId,
        tournamentName: tournamentName,
        teamId: teamId,
        gameToPlay: gameId,
        score: score,
        resultVideo: filePath,
        submittedBy: userId,
        resultType: tournamentType,
        submissionDate: moment().utc()
    });
    await tournamentResult.save();
    return tournamentResult.tournamentId
}
exports.findSubmittedTournamentResult = async (tournamentId, teamId) => {
    return await TournamentResult.findOne({tournamentId: tournamentId, teamId: teamId})
}
exports.findTournamentForResult = async () => {
    return await TournamentResult.find({isDeleted: false}).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.findTournamentForResultWithoutFranchiseTournament = async () => {
    return await TournamentResult.find({
        isDeleted: false,
        resultType: null
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.findTournamentResultByIdForResult = async (tournamentResultById) => {
    return await TournamentResult.findOne({_id: tournamentResultById}).populate("teamId gameToPlay submittedBy", "teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.updateTournamentResult = async (tournamentResultId, resultStatus) => {
    return await TournamentResult.updateOne({_id: tournamentResultId}, {$set: {result: resultStatus}})
}
exports.findAlreadyWinTournamentResult = async (tournamentId) => {
    return await TournamentResult.findOne({tournamentId: tournamentId, result: "win"})
}
exports.findTournamentResultByTournamentName = async (tournamentName) => {
    return await TournamentResult.find({
        tournamentName: {$regex: tournamentName},
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.findTournamentResultWithouFranchiseTournamentByTournamentName = async (tournamentName) => {
    return await TournamentResult.find({
        tournamentName: {$regex: tournamentName},
        isDeleted: false,
        resultType: null
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.deleteTournamentResultById = async (resultId) => {
    return await TournamentResult.updateOne({_id: resultId}, {
        $set: {
            isDeleted: true,
            deletedAt: moment(),
            resultVideo: ""
        }
    })
}
////////////////////////////////////////////////////////franchise work //////////////////////////////////////////////////////////
exports.submitFranchiseResult = async (tournamentId, tournamentName, gameId, teamId, userId, score, tournamentType, filePath) => {
    const tournamentResult = new TournamentResult({
        _id: new mongoose.Types.ObjectId(),
        tournamentId: mongoose.Types.ObjectId(tournamentId),
        tournamentName: tournamentName,
        teamId: mongoose.Types.ObjectId(teamId),
        gameToPlay: mongoose.Types.ObjectId(gameId),
        score: score,
        resultVideo: filePath,
        submittedBy: mongoose.Types.ObjectId(userId),
        resultType: tournamentType,
        submissionDate: moment().utc()
    });
    await tournamentResult.save();
    return tournamentResult.tournamentId
}
exports.findFranchiseTournamentForResult = async (franchiseId) => {
    return await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.findFranchiseTournamentResultByTournamentName = async (franchiseId, tournamentName) => {
    return await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        tournamentName: {$regex: tournamentName},
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay  submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
}
exports.updateKillPoints = async (tournamentResultId, killPoints) => {
    return await TournamentResult.updateOne({_id: tournamentResultId}, {$set: {killPoints: killPoints}})
}
//
exports.findAdminTournamentForResultWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    //     resultType: null,
    let result = await TournamentResult.find({
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    //resultType: null,
    let total = await TournamentResult.find({
        isDeleted: false
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
exports.findAdminTournamentResultByTournamentNameWithPagination = async (tournamentName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    //resultType: null,
    let result = await TournamentResult.find({
        tournamentName: {$regex: tournamentName},
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay  submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    // resultType: null,
    let total = await TournamentResult.find({
        tournamentName: {$regex: tournamentName},
        isDeleted: false
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
//franchise
exports.findFranchiseTournamentForResultWithPagination = async (franchiseId, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        isDeleted: false
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
exports.findFranchiseTournamentResultByTournamentNameWithPagination = async (franchiseId, tournamentName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        tournamentName: {$regex: tournamentName},
        isDeleted: false
    }).populate("tournamentId teamId gameToPlay  submittedBy", "tournamentName teamViewName gameName userDetail.userName").sort({"_id": 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await TournamentResult.find({
        resultType: mongoose.Types.ObjectId(franchiseId),
        tournamentName: {$regex: tournamentName},
        isDeleted: false
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
exports.findPendingResult = async (tournamentId) => {
    return await TournamentResult.find({
        tournamentId: mongoose.Types.ObjectId(tournamentId),
        result: "pending",
        isDeleted: false
    })
}
exports.findTournamentResultExist = async (tournamentId) => {
    return await TournamentResult.find({
        tournamentId: mongoose.Types.ObjectId(tournamentId),
        isDeleted: false
    })
}
// exports.findTotalTournamentResultsExist = async (tournamentId) => {
//     return await TournamentResult.find({tournamentId: mongoose.Types.ObjectId(tournamentId), isDeleted: false})
// }