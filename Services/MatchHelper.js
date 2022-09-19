const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const Match = require("../Models/Match");
exports.findMatchByTitleAndUserId = async (matchName, userId, challengeTo) => {
    return Match.findOne({
        matchName: matchName,
        challengeBy: userId,
        challengeTo: challengeTo,
        isDeleted: false
    })
}
exports.findPublicMatchByTitleAndUserId = async (matchName, userId) => {
    return Match.findOne({
        matchName: matchName,
        challengeBy: userId,
        challengeTo: null,
        isDeleted: false
    })
}
exports.createMatchInvitation = async (request, userId, imagePath, startDateAndTime) => {
    const matchInvitation = new Match({
        _id: new mongoose.Types.ObjectId(),
        matchName: request.matchName.toLowerCase(),
        gameToPlay: request.gameToPlay,
        platform: request.platform,
        challengeBy: userId,
        challengeTo: request.challengeTo,
        prize: request.prize,
        matchTitleImage: imagePath,
        startingDateAndTime: startDateAndTime,
    })
    await matchInvitation.save()
    return matchInvitation._id
}
exports.createPublicMatchInvitation = async (request, userId, imagePath, startDateAndTime) => {
    const matchInvitation = new Match({
        _id: new mongoose.Types.ObjectId(),
        matchName: request.matchName.toLowerCase(),
        gameToPlay: request.gameToPlay,
        platform: request.platform,
        challengeBy: userId,
        challengeTo: null,
        prize: request.prize,
        matchTitleImage: imagePath,
        startingDateAndTime: startDateAndTime,
    })
    await matchInvitation.save()
    return matchInvitation._id
}
exports.findMatchInvitationByIdWithPopulate = async (matchId) => {
    return await Match.findOne({
        _id: matchId,
        isDeleted: false
    }).populate("gameToPlay challengeBy challengeTo",
        "_id gameName _id userDetail.userName userDetail.fullName _id userDetail.userName userDetail.fullName")
}
exports.findWithDeletedMatchInvitationByIdWithPopulate = async (matchId) => {
    return await Match.findOne({_id: matchId}).populate("gameToPlay challengeBy challengeTo",
        "_id gameName _id userDetail.userName userDetail.fullName")
}
exports.findAllReceivedMatchInvite = async (userId) => {
    return await Match.find({challengeTo: userId, isDeleted: false})
}
exports.findAllSendMatchInvite = async (userId) => {
    return await Match.find({challengeBy: userId, isDeleted: false})
}
exports.findMatchByIdWithoutDel = async (matchId) => {
    return await Match.findOne({_id: matchId, isDeleted: false})
}
exports.findMatchByIdPopulatedWithoutDel = async (matchId) => {
    return await Match.findOne({
        _id: matchId,
        isDeleted: false
    }).populate("gameToPlay challengeBy challengeTo", "gameName userDetail.userName userDetail.fullName profileImage")
}
exports.findMatchByIdWithDel = async (matchId) => {
    return await Match.findOne({_id: matchId})
}
exports.findMatchByIdPopulatedWithDel = async (matchId) => {
    return await Match.findOne({
        _id: matchId
    }).populate("gameToPlay challengeBy challengeTo", "gameName userDetail.userName userDetail.fullName")
}
exports.findAlreadyWinningUser = async (matchId, userId) => {
    return await Match.find({_id: matchId, winningUser: mongoose.Types.ObjectId(userId)})
}
exports.updateMatchWinningUserToNull = async (matchId) => {
    return await Match.updateOne({_id: matchId}, {$set: {winningUser: null}})
}
exports.updateWinUserMatchResult = async (matchId, userId) => {
    return await Match.updateOne({_id: mongoose.Types.ObjectId(matchId)}, {$set: {winningUser: mongoose.Types.ObjectId(userId)}})
}
exports.findMyMatches = async (userId) => {
    return await Match.find({
        isDeleted: false,
        status: {$ne: "expired"},
        $or: [
            {challengeBy: mongoose.Types.ObjectId(userId)},
            {challengeTo: mongoose.Types.ObjectId(userId)}]
    }).populate("gameToPlay challengeBy challengeTo winningUser", "gameName userDetail.userName userDetail.fullName")
}
exports.findPublicMatches = async () => {
    return await Match.find({
        challengeTo: null
    }).populate("gameToPlay challengeBy  winningUser", "gameName userDetail.userName userDetail.fullName")
}
exports.findPublicMatchesByGame = async (gameId) => {
    return await Match.find({
        challengeTo: null, gameToPlay: mongoose.Types.ObjectId(gameId)
    }).populate("gameToPlay challengeBy  winningUser", "gameName userDetail.userName userDetail.fullName")
}
exports.findUserTotalMatchesWithPopulate = async (userId) => {
    return await Match.find({
        status: "accepted",
        $or: [
            {challengeBy: mongoose.Types.ObjectId(userId)},
            {challengeTo: mongoose.Types.ObjectId(userId)}]
    }).populate("gameToPlay challengeBy challengeTo winningUser", "gameName userDetail.userName userDetail.fullName")
}
exports.findUserWinMatchesWithPopulate = async (userId) => {
    return await Match.find({
        status: "accepted",
        winningUser: mongoose.Types.ObjectId(userId),
        $or: [
            {challengeBy: mongoose.Types.ObjectId(userId)},
            {challengeTo: mongoose.Types.ObjectId(userId)}]
    }).populate("gameToPlay challengeBy challengeTo winningUser", "gameName userDetail.userName userDetail.fullName")
}
exports.matchInvitationResponse = async (matchId, status) => {
    return await Match.updateOne({_id: matchId, status: "pending"}, {$set: {status: status}})
}
exports.publicMatchInvitationResponse = async (matchId, userId, status) => {
    return await Match.updateOne({_id: mongoose.Types.ObjectId(matchId)}, {
        $set: {
            status: status,
            challengeTo: mongoose.Types.ObjectId(userId)
        }
    })
}
exports.deleteMatch = async (matchId) => {
    return await Match.updateOne({_id: mongoose.Types.ObjectId(matchId)}, {
        $set: {
            isDeleted: true,
            deletedAt: moment()
        }
    })
}
exports.findAllMyAcceptedMatches = async (userId) => {
    return await Match.find({
        status: "accepted",
        $or: [
            {challengeBy: mongoose.Types.ObjectId(userId)},
            {challengeTo: mongoose.Types.ObjectId(userId)}]
    }).populate("gameToPlay challengeBy challengeTo winningUser", "gameName userDetail.userName userDetail.fullName").sort({updatedAt: -1})
}
exports.findPendingMatches = async () => {
    return await Match.find({status: "pending", isDeleted: false})
}
exports.checkChallengeTo = async (matchId) => {
    return await Match.findOne({_id: mongoose.Types.ObjectId(matchId)}, {challengeTo: 1})
}
exports.deletePermanentPublicMatch = async (matchId) => {
    return await Match.deleteOne({_id: mongoose.Types.ObjectId(matchId)})
}