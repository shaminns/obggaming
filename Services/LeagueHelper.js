// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const User = require("../Models/User");
const League = require("../Models/League")
const Tournament = require("../Models/Tournament");
const Team = require("../Models/Team");
const PlayerLeaguePoint = require("../Models/PlayersLeaguePoints")
//
const
    GeneralHelper = require("./GeneralHelper");
const {unlinkSync} = require("fs");
//
exports.createLeague = async (data, imagePath, startDate, endDate) => {
    const league = new League({
        _id: new mongoose.Types.ObjectId(),
        leagueName: data.leagueName.toLowerCase().trim(),
        gameToPlay: data.gameToPlay,
        teamSize: data.teamSize,
        totalTeams: data.totalTeams,
        entryFee: data.entryFee || 0,
        prize: data.prize,
        leagueTitleImage: imagePath,
        startingDate: startDate,
        endingDate: endDate,
    });
    await league.save();
    return league._id
}
exports.updateLeagueDetail = async (leagueId, data, imagePath) => {
    let startDate = await GeneralHelper.dateTimeToUtc(data.startingDate)
    let endDate = await GeneralHelper.dateTimeToUtc(data.endingDate)
    let league = await League.findOne({_id: leagueId})
    let leagueImage = league.leagueTitleImage
    if (leagueImage.toString() !== imagePath.toString()) {
        unlinkSync(leagueImage)
    }
    league.leagueName = data.leagueName.toLowerCase().trim() || league.leagueName,
        league.gameToPlay = data.gameToPlay || league.gameToPlay,
        league.teamSize = data.teamSize || league.teamSize,
        league.totalTeams = data.totalTeams || league.totalTeams,
        league.entryFee = data.entryFee || league.entryFee,
        league.prize = data.prize || league.prize,
        league.startingDate = startDate || league.startingDate,
        league.endingDate = endDate || league.endingDate,
        league.leagueTitleImage = imagePath
    let leagueModel = new League(league);
    return leagueModel.save().then((fullfilled) => {
        return fullfilled;
    });
}
exports.findLeagueByNameWithoutDelete = async (leagueName) => {
    return await League.findOne({leagueName: leagueName, isDeleted: false})
}
exports.findLeagueByIdWithoutDeleteWithPopulate = async (leagueId) => {
    return await League.findOne({
        _id: mongoose.Types.ObjectId(leagueId),
        isDeleted: false
    }).populate("gameToPlay createdBy leagueFranchise", "gameName userDetail.userName franchiseName")
}
exports.findLeagueByIdWithDeleteWithPopulate = async (leagueId) => {
    return await League.findOne({
        _id: mongoose.Types.ObjectId(leagueId),
    }).populate("gameToPlay createdBy leagueFranchise", "gameName userDetail.userName franchiseName")
}
exports.findTeamInLeague = async (leagueId, teamId) => {
    return await League.findOne({
        _id: mongoose.Types.ObjectId(leagueId),
        participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]},
        isDeleted: false
    })
}
exports.addTeam = async (leagueId, teamId) => {
    return League.updateOne({_id: leagueId}, {$push: {participatingTeams: teamId}})
}
exports.deleteLeague = async (leagueId) => {
    await League.updateOne({
        _id: mongoose.Types.ObjectId(leagueId)
    }, {
        $set: {
            isDeleted: true,
            deletedAt: moment()
        }
    }).exec()
    return true
}
exports.deleteLeagueByUser = async (data) => {
    let updateInfo = {
        isDeleted: true,
        deletedAt: moment()
    };
    for (let i = 0; i < data.leagueId.length; i++) {
        await League.updateOne({
            _id: data.leagueId[i]
        }, {
            $set: {
                isDeleted: updateInfo.isDeleted,
                deletedAt: updateInfo.deletedAt
            }
        }).exec()
    }
    return true
}
exports.findLeaguesByUserIdWithoutDeleteWithPopulate = async (userId) => {
    return await League.find({
        createdBy: mongoose.Types.ObjectId(userId),
        isDeleted: false
    }).populate("gameToPlay createdBy leagueFranchise", "gameName userDetail.userName franchiseName")
}
exports.allLeagues = async () => {
    return await League.find()
}
exports.allLeaguesWithoutDelete = async () => {
    return await League.find({isDeleted: false})
}
exports.allFranchiseLeagues = async (franchiseId) => {
    return await League.find({leagueFranchise: mongoose.Types.ObjectId(franchiseId)})
}
exports.allFranchiseLeaguesWithoutDelete = async (franchiseId) => {
    return await League.find({leagueFranchise: mongoose.Types.ObjectId(franchiseId), isDeleted: false})
}
exports.allLeagues = async () => {
    return await League.find({isDeleted: false})
}
exports.searchLeagueByName = async (leagueName) => {
    return await League.find({leagueName: {$regex: leagueName}, isDeleted: false})
}
exports.updateWinnerTeam = async (leagueId, teamId) => {
    return await League.updateOne({_id: mongoose.Types.ObjectId(leagueId)}, {$set: {winningTeam: mongoose.Types.ObjectId(teamId)}})
}
exports.findLeagueByGameIdAndStartingDate = async (gameToPlay) => {
    return await League.find({
        gameToPlay: mongoose.Types.ObjectId(gameToPlay),
        isDeleted: false
    })
}
exports.getPlayerPointsDetailByLeague = async (leagueId, roundNumber) => {
    return await PlayerLeaguePoint.find({leagueId: mongoose.Types.ObjectId(leagueId), roundNumber: {$lte: roundNumber}})
}
exports.searchLeagueByNameWithPagination = async (leagueName, pageNo) => {
    // return await League.find({leagueName: {$regex: leagueName}, isDeleted: false})
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await League.find({leagueName: {$regex: leagueName}, isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await League.find({leagueName: {$regex: leagueName}, isDeleted: false}).countDocuments();
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
exports.allLeaguesWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await League.find({isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await League.find({isDeleted: false}).countDocuments();
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
exports.findTeamParticipating = async (teamId) => {
    return await League.find({winningTeam: null, participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}})
}
////////only for developer /////////////////////////////////////
exports.removeAllRecord = async () => {
    await League.remove()
    return true
}
exports.deleteLeagueById = async (flId) => {
    await League.remove({_id: mongoose.Types.ObjectId(flId)})
    return true
}