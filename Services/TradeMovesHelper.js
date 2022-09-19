// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const TradeMove = require("../Models/TradeMoves");
//
const
    GeneralHelper = require("./GeneralHelper");
const {unlinkSync} = require("fs");
//
exports.addTradeMoveProposal = async (takeFlTeamId, giveFlTeamId, flId, toId, fromId, givePlayerId, takePlayerId) => {
    let tradeMove = new TradeMove({
        _id: new mongoose.Types.ObjectId(),
        fantasyLeagueId: flId,
        takeFlTeamId: takeFlTeamId,
        giveFlTeamId: giveFlTeamId,
        toId: toId,
        fromId: fromId,
        takePlayerId: takePlayerId,
        givePlayerId: givePlayerId,
    })
    await tradeMove.save()
    return tradeMove._id
}
exports.findAlreadyProposal = async (takeFlTeamId, giveFlTeamId, flId, toId, fromId, givePlayerId, takePlayerId) => {
    return await TradeMove.findOne({
        takeFlTeamId: mongoose.Types.ObjectId(takeFlTeamId),
        giveFlTeamId: mongoose.Types.ObjectId(giveFlTeamId),
        fantasyLeagueId: mongoose.Types.ObjectId(flId),
        toId: mongoose.Types.ObjectId(toId),
        fromId: mongoose.Types.ObjectId(fromId),
        givePlayerId: mongoose.Types.ObjectId(givePlayerId),
        takePlayerId: mongoose.Types.ObjectId(takePlayerId),
        approvedStatus: "pending"
    })
}
exports.findAlreadySendProposal = async (takePlayerFlTeamId, giveFlTeamId, fantasyLeagueId, toId, fromId, takePlayerId) => {
    return await TradeMove.findOne({
        takeFlTeamId: mongoose.Types.ObjectId(takePlayerFlTeamId),
        giveFlTeamId: mongoose.Types.ObjectId(giveFlTeamId),
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        toId: mongoose.Types.ObjectId(toId),
        fromId: mongoose.Types.ObjectId(fromId),
        takePlayerId: mongoose.Types.ObjectId(takePlayerId),
        approvedStatus: "pending"
    })
}
exports.findUserReceivedTradeMoveRequest = async (userId) => {
    return await TradeMove.find({toId: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.findUserSendTradeMoveRequest = async (userId) => {
    return await TradeMove.find({fromId: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.findTradeMoveReqById = async (recordId) => {
    return await TradeMove.findOne({_id: mongoose.Types.ObjectId(recordId), isDeleted: false})
}
exports.updateRequestStatus = async (recordId, approvedStatus) => {
    await TradeMove.updateOne({_id: mongoose.Types.ObjectId(recordId)}, {$set: {approvedStatus: approvedStatus}})
    return true
}
exports.findGivePlayerForThisPlayer = async (fantasyLeagueId, playerIdForCheck) => {
    return await TradeMove.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        givePlayerId: mongoose.Types.ObjectId(playerIdForCheck),
        approvedStatus: "pending"
    })
}
exports.findTakePlayerForThisPlayer = async (fantasyLeagueId, playerIdForCheck) => {
    return await TradeMove.findOne({
        fantasyLeagueId: mongoose.Types.ObjectId(fantasyLeagueId),
        takePlayerId: mongoose.Types.ObjectId(playerIdForCheck),
        approvedStatus: "pending"
    })
}