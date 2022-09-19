// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const FantasyLeague = require("../Models/FantasyLeague")
const FantasyTeam = require("../Models/FantasyTeam")
//
exports.creatFantasyTeam = async (teamViewName, userId, fantasyLeagueId, teamSize, totalTeams) => {
    const fantasyTeam = new FantasyTeam({
        _id: new mongoose.Types.ObjectId(),
        teamViewName: teamViewName,
        teamOwner: userId,
        teamType: fantasyLeagueId,
        teamSize: teamSize,
        totalTeams: totalTeams
    })
    await fantasyTeam.save()
    return fantasyTeam._id
}
exports.findFantasyTeamDetailByFantasyTeamId = async (fantasyTeamId) => {
    return await FantasyTeam.findOne({_id: mongoose.Types.ObjectId(fantasyTeamId)})
}
exports.checkAlreadyTeamMember = async (teamId, playerId) => {
    return await FantasyTeam.findOne({
        _id: mongoose.Types.ObjectId(teamId),
        'teamMembers.userId': {$in: [mongoose.Types.ObjectId(playerId)]}
    })
}
exports.addMemberToFlTeam = async (teamId, playerId) => {
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(teamId)},
        {
            $push: {
                teamMembers: {
                    userId: playerId,
                    role: "Player",
                    blockTradeOff: false
                }
            }
        })
    return true
}
exports.updateMemberToFlTeam = async (teamId, playerId, oldPlayerId) => {
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(teamId)},
        {
            $pull: {
                teamMembers: {
                    userId: {$in: [mongoose.Types.ObjectId(oldPlayerId)]}
                }
            }
        })
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(teamId)},
        {
            $push: {
                teamMembers: {
                    userId: playerId,
                    role: "Player",
                    blockTradeOff: false
                }
            }
        })
    return true
}
exports.checkIsFlJoined = async (userId, flId) => {
    return await FantasyTeam.findOne({
        teamType: mongoose.Types.ObjectId(flId),
        teamOwner: mongoose.Types.ObjectId(userId),
        isDeleted: false
    })
}
exports.findAllFantasyTeamByUserId = async (userId) => {
    return await FantasyTeam.find({teamOwner: mongoose.Types.ObjectId(userId), isDeleted: false})
}
exports.checkAlreadyHaveTeam = async (userId, fantasyLeagueId) => {
    return await FantasyTeam.findOne(({
        teamOwner: mongoose.Types.ObjectId(userId),
        teamType: mongoose.Types.ObjectId(fantasyLeagueId),
        isDeleted: false
    }))
}
exports.findAllFantasyTeam = async () => {
    return await FantasyTeam.find()
}
exports.findPlayerAllFantayTeam = async (playerIdForPick) => {
    return await FantasyTeam.find({'teamMembers.userId': {$in: [mongoose.Types.ObjectId(playerIdForPick)]}})
}
exports.dropMemberFromFlTeam = async (flTeamId, flMemberId) => {
    return await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(flTeamId)},
        {$pull: {teamMembers: {userId: {$in: [mongoose.Types.ObjectId(flMemberId)]}}}})
}
exports.updateWaiverStatus = async (flTeamId, flMemberId, status) => {
    return await FantasyTeam.updateOne({
            _id: mongoose.Types.ObjectId(flTeamId),
            "teamMembers": {"$elemMatch": {"userId": mongoose.Types.ObjectId(flMemberId)}}
        },
        {$set: {'teamMembers.$.blockTradeOff': status}})
}
exports.findFantasyTeamDetailByFlId = async (fantasyLeagueId, userId) => {
    return await FantasyTeam.findOne({
        teamType: mongoose.Types.ObjectId(fantasyLeagueId),
        'teamMembers.userId': {$in: [mongoose.Types.ObjectId(userId)]}
    })
}
exports.findMyFantasyTeamDetailByFlId = async (userId, fantasyLeagueId) => {
    return await FantasyTeam.findOne({
        teamType: mongoose.Types.ObjectId(fantasyLeagueId),
        teamOwner: mongoose.Types.ObjectId(userId)
    })
}
exports.updateFlTeamName = async (flTeamId, flTeamName) => {
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(flTeamId)},
        {$set: {teamViewName: flTeamName}})
    return true
}
exports.updateTradeMovePlayer = async (teamIdForUpdate, pullPlayerId, pushPlayerId) => {
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(teamIdForUpdate)},
        {$pull: {teamMembers: {userId: {$in: [mongoose.Types.ObjectId(pullPlayerId)]}}}})
    await FantasyTeam.updateOne({_id: mongoose.Types.ObjectId(teamIdForUpdate)},
        {$push: {teamMembers: {userId: mongoose.Types.ObjectId(pushPlayerId)}}})
    return true
}