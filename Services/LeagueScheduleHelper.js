// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Helpers
const GeneralHelper = require("../Services/GeneralHelper")
// Models
const User = require("../Models/User");
const League = require("../Models/League")
const LeagueSchedule = require("../Models/LeagueSchedule");
const Team = require("../Models/Team");
exports.saveLeagueSchedule = async (roundNumber, srNo, scheduleType, randomNumber, leagueId, teamOneId, teamTwoId, franchiseId) => {
    const leagueSchedule = new LeagueSchedule({
        _id: new mongoose.Types.ObjectId(),
        roundNumber: roundNumber,
        rowNumber: srNo,
        scheduleType: scheduleType,
        randomMatchId: randomNumber,
        leagueId: leagueId,
        teamOne: teamOneId,
        teamTwo: teamTwoId,
        franchiseId: franchiseId,
    });
    await leagueSchedule.save();
    return leagueSchedule._id
}
exports.checkAlreadyLeagueSchedule = async (leagueId, roundNumber) => {
    return await LeagueSchedule.find({
        leagueId: leagueId,
        roundNumber: roundNumber,
        winner: null
    })
}
exports.findLeagueScheduleByLeagueId = async (leagueId) => {
    return await LeagueSchedule.find({leagueId: leagueId})
}
exports.getLeagueDetailForMaxRoundNumber = async (leaguId) => {
    return await LeagueSchedule.find({leagueId: mongoose.Types.ObjectId(leaguId)}).sort({roundNumber: -1}).limit(1)
}
exports.checkLeagueSchedule = async (leagueId) => {
    return await LeagueSchedule.find({leagueId: leagueId})
}
exports.updateWinnerTeamByMatchId = async (matchId, teamId) => {
    return await LeagueSchedule.updateOne({randomMatchId: matchId}, {$set: {winner: mongoose.Types.ObjectId(teamId)}})
}
exports.checkLeagueScheduleWithPagination = async (leagueId, pageNo) => {
    let pg = GeneralHelper.getPaginationDetailsForLeagueSchedule(pageNo);
    let userCondition //= [{leagueId: leagueId}];
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
        // userCondition.push({
        //   $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
        // });
    }
    // userCondition = {$and: userCondition};
    let result = await LeagueSchedule.find({leagueId: leagueId})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await LeagueSchedule.find({leagueId: leagueId}).countDocuments();
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
exports.checkTeamAndMatchId = async (franchiseTeamId, matchId) => {
    return await LeagueSchedule.find({
        randomMatchId: matchId,
        $or: [{teamOne: mongoose.Types.ObjectId(franchiseTeamId)},
            {teamTwo: mongoose.Types.ObjectId(franchiseTeamId)}]
    })
}
exports.findTypeAndRoundNumber = async (matchId) => {
    return await LeagueSchedule.findOne({randomMatchId: matchId})
}
exports.checkAlreadyLeagueScheduleForPlayoff = async (leagueId, roundNumber) => {
    return await LeagueSchedule.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: roundNumber,
        scheduleType: "playoff",
        winner: null
    })
}
exports.getPlayOffMatchDataWithRoundNumber = async (leagueId, roundNumber, rowNumber) => {
    return await LeagueSchedule.findOne({
        leagueId: mongoose.Types.ObjectId(leagueId),
        scheduleType: "playoff",
        roundNumber: roundNumber,
        rowNumber: rowNumber
    })
}
exports.findLeagueScheduleDetailByRoundNumber = async (roundNumber, leagueId) => {
    return await LeagueSchedule.findOne({roundNumber: roundNumber, leagueId: mongoose.Types.ObjectId(leagueId)})
}
exports.checkLeagueFinalExist = async (leagueId) => {
    return await LeagueSchedule.findOne({leagueId: mongoose.Types.ObjectId(leagueId), scheduleType: "final"})
}
exports.checkLeagueRoundWinner = async (leagueId, maxRoundNumber) => {
    return await LeagueSchedule.find({
        leagueId: mongoose.Types.ObjectId(leagueId),
        roundNumber: maxRoundNumber,
        winner: null
    })
}
//////for developer ////////////////////
exports.setWinnerToNullForLeagueSchedule = async (leagueId) => {
    return await LeagueSchedule.updateMany({leagueId: mongoose.Types.ObjectId(leagueId)}, {$set: {winner: null}})
}
exports.removeAllLeagueSchedule = async () => {
    await LeagueSchedule.remove()
    return true
}