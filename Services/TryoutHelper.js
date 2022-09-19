const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
//Models
const User = require("../Models/User");
const Tryout = require("../Models/Tryout")
const GeneralHelper = require("../Services/GeneralHelper");
const LeagueResult = require("../Models/LeagueResult");
//
exports.findTryoutRequestById = async (id) => {
    return await Tryout.findOne({_id: id})
}
exports.findSentRequest = async (franchiseId, userId) => {
    return await Tryout.findOne({
        userId: mongoose.Types.ObjectId(userId),
        franchiseId: mongoose.Types.ObjectId(franchiseId),
        status: {$in: ["pending", "accepted"]}
    })
}
exports.findTeamSentRequest = async (franchiseId, userId, teamId) => {
    return await Tryout.findOne({
        userId: mongoose.Types.ObjectId(userId),
        franchiseId: mongoose.Types.ObjectId(franchiseId),
        franchiseTeamId: mongoose.Types.ObjectId(teamId),
    })
}
exports.createTryoutRequest = async (teamId, dateAndTime, userId, franchiseId, franchiseOwnerId) => {
    const tryout = new Tryout({
        _id: new mongoose.Types.ObjectId(),
        franchiseTeamId: teamId,
        dateAndTime: dateAndTime,
        userId: userId,
        franchiseId: franchiseId,
        franchiseOwnerId: franchiseOwnerId
    })
    await tryout.save()
}
exports.findTryoutByFranchiseIdWithoutDelete = async (franchiseId) => {
    return await Tryout.find({franchiseId: franchiseId, isDeleted: false})
}
exports.updateRequestStatus = async (id, status) => {
    return await Tryout.updateOne({_id: id, status: "pending"}, {$set: {status: status}})
}
exports.findAllReceivedTryoutRequest = async (userId) => {
    return await Tryout.find({franchiseOwnerId: mongoose.Types.ObjectId(userId)})
}
exports.findAllSendTryoutRequest = async (userId) => {
    return await Tryout.find({userId: mongoose.Types.ObjectId(userId)})
}
exports.updateIsAddedToTeam = async (teamId, userId) => {
    return await Tryout.updateOne({
        franchiseTeamId: mongoose.Types.ObjectId(teamId),
        userId: mongoose.Types.ObjectId(userId)
    }, {$set: {isAddedToTeam: true}})
}
exports.findTryoutByFranchiseIdWithoutDeleteWithPagination = async (franchiseId, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Tryout.find({franchiseId: mongoose.Types.ObjectId(franchiseId), isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Tryout.find({
        franchiseId: mongoose.Types.ObjectId(franchiseId),
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