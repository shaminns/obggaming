// Mongoose
const mongoose = require("mongoose");
// Moment
const moment = require("moment");
// Models
const Franchise = require("../Models/Franchise");
const {franchiseByStatus} = require("./FranchiseHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const Tryout = require("../Models/Tryout");
//
exports.findFranchiseByIdWithoutDelete = async (franchiseId) => {
    return await Franchise.findOne({_id: mongoose.Types.ObjectId(franchiseId), isDeleted: false, isBlock: false})
}
exports.findFranchiseByIdWithDelete = async (franchiseId) => {
    return await Franchise.findOne({_id: mongoose.Types.ObjectId(franchiseId), isBlock: false})
}
exports.findFranchiseByIdWithoutDeleteWithBlock = async (franchiseId) => {
    return await Franchise.findOne({_id: mongoose.Types.ObjectId(franchiseId), isDeleted: false})
}
exports.findFranchiseByNameWithoutDelete = async (franchiseName) => {
    return await Franchise.findOne({franchiseName: franchiseName, isDeleted: false})
}
exports.saveFranchise = async (franchiseName, userId, userName, userEmail, yearlyIncome, address, occupation, imagePath) => {
    const franchise = new Franchise({
        _id: new mongoose.Types.ObjectId(),
        franchiseName: franchiseName,
        createdBy: userId,
        createdByName: userName,
        email: userEmail,
        yearlyIncome: yearlyIncome,
        address: address,
        occupation: occupation,
        franchiseTitleImage: imagePath
    })
    await franchise.save()
    return userId
}
exports.userFranchise = async (userId) => {
    return Franchise.findOne({createdBy: mongoose.Types.ObjectId(userId)})//, isDeleted: false
}
exports.addTeamToFranchise = async (franchiseId, franchiseTeamId) => {
    return Franchise.updateOne({_id: mongoose.Types.ObjectId(franchiseId)}, {$push: {franchiseTeams: mongoose.Types.ObjectId(franchiseTeamId)}})
}
exports.showAllFranchiseWithoutDelete = async () => {
    return await Franchise.find({isDeleted: false})
}
exports.searchFranchiseByNameWithoutDelete = async (franchiseName) => {
    return await Franchise.find({isDeleted: false, franchiseName: {$regex: franchiseName}})
}
exports.updateApproveStatusByFranchiseId = async (franchiseId, status) => {
    return await Franchise.updateOne({_id: mongoose.Types.ObjectId(franchiseId)}, {$set: {approvedStatus: status}})
}
exports.updateBlockStatusByFranchiseId = async (franchiseId, status) => {
    //for block
    if (status == true) {
        await Franchise.updateOne({_id: mongoose.Types.ObjectId(franchiseId)}, {
            $set: {
                isBlock: status,
                blockAt: moment()
            }
        })
    }
    //for unblock
    if (status == false) {
        await Franchise.updateOne({_id: mongoose.Types.ObjectId(franchiseId)}, {$set: {isBlock: status, blockAt: null}})
    }
}
exports.getUserFranchiseDeatil = async (userId) => {
    return await Franchise.findOne({createdBy: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.updateAbout = async (franchiseId, about) => {
    return await Franchise.updateOne({
        _id: mongoose.Types.ObjectId(franchiseId),
        isDeleted: false
    }, {$set: {about: about}})
}
exports.franchiseByStatus = async (franchiseStatus) => {
    return await Franchise.find({isDeleted: false, franchiseStatus: franchiseStatus})
}
exports.updateFranchiseStatus = async (userId, status) => {
    return await Franchise.updateOne({
        createdBy: mongoose.Types.ObjectId(userId),
        isDeleted: false,
    }, {$set: {franchiseStatus: status}})
}
exports.findFranchiseIdByTeamId = async (teamId) => {
    return await Franchise.findOne({franchiseTeams: {$in: [mongoose.Types.ObjectId(teamId)]}})
}
exports.findUserFranchiseByTeamId = async (teamId) => {
    return await Franchise.findOne({
        franchiseTeams: {$in: [mongoose.Types.ObjectId(teamId)]},
        isDeleted: false
    })
}
exports.checkFranchiseBlockStatus = async (franchiseId) => {
    return await Franchise.findOne({_id: mongoose.Types.ObjectId(franchiseId), isBlock: false})
}
exports.searchFranchiseByNameWithoutDeleteWithPaginaion = async (franchiseName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Franchise.find({isDeleted: false, franchiseName: {$regex: franchiseName}})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Franchise.find({isDeleted: false, franchiseName: {$regex: franchiseName}}).countDocuments();
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
exports.showAllFranchiseWithoutDeleteWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Franchise.find({isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Franchise.find({isDeleted: false}).countDocuments();
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
/////// only for dev////////////////////////////////////////////////
exports.deleteFranchisePermanentForDev = async (franchiseId) => {
    return await Franchise.deleteOne({_id: franchiseId})
}