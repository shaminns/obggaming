const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const Tournament = require("../Models/Tournament");
// Helpers
const GeneralHelper = require("./GeneralHelper");
const League = require("../Models/League");
exports.createTournament = async (data, imagePath, startDateAndTime) => {
    const tournament = new Tournament({
        _id: new mongoose.Types.ObjectId(),
        tournamentName: data.tournamentName.toLowerCase().trim(),
        gameToPlay: data.gameToPlay,
        teamSize: data.teamSize,
        totalTeams: data.totalTeams,
        entryFee: data.entryFee,
        prize: data.prize,
        tournamentType: data.tournamentType,
        tournamentTitleImage: imagePath,
        startingDateAndTime: startDateAndTime,
    });
    await tournament.save();
    return tournament._id
}
// exports.createFranchiseTournament = async (data, imagePath, startDate) => {
//     const tournament = new Tournament({
//         _id: new mongoose.Types.ObjectId(),
//         tournamentName: data.tournamentName.toLowerCase().trim(),
//         gameToPlay: data.gameToPlay,
//         teamSize: data.teamSize,
//         totalTeams: data.totalTeams,
//         entryFee: data.entryFee,
//         prize: data.prize,
//         tournamentType: "franchise",
//         tournamentTitleImage: imagePath,
//         startingDateAndTime: startDate,
//     });
//     await tournament.save();
//     return tournament._id
// }
// exports.joinTournament = async (id)=> {
// 	if(User.credits < Tournament.entryFee)
// 	{
// 		return result="not possible";
// 	}
//     let result = await MatchInvite.updateOne({_id:_id},{$set:updateMatchInfo});
// 	return result;
// }
exports.tournamentsByNameWithPagination = async (tournamentName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Tournament.find({tournamentName: {$regex: tournamentName}, isDeleted: false})
        .populate("gameToPlay", "gameName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Tournament.find({tournamentName: {$regex: tournamentName}, isDeleted: false}).countDocuments();
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
exports.tournamentsWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Tournament.find({isDeleted: false})
        .populate("gameToPlay", "gameName")
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Tournament.find({isDeleted: false}).countDocuments();
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
exports.listByTournamentName = async (tournamentName) => {
    return await Tournament.find({tournamentName: {$regex: tournamentName.toLowerCase()}, isDeleted: false}
    )
}
exports.listTournamentsByPageAndName = async (pageNo, tournamentName) => {
    let searchValue = null;
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let tournamentCondition = [{isDeleted: false, tournamentName: {$regex: tournamentName.toLowerCase()}}];
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, 'i');
        tournamentCondition.push({
            $or: [
                {"name": {$regex: regex}},
                {"entryFee": {$regex: regex}},
                {"Prize": {$regex: regex}},
                {"startingTime": {$regex: regex}},
                {"startingDate": {$regex: regex}},
                {"game": {$regex: regex}}
            ]
        });
    }
    tournamentCondition = {$and: tournamentCondition}
    let result = await Tournament.find(tournamentCondition)
        .sort({createdAt: 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Tournament.find(tournamentCondition).countDocuments();
    return {
        "pagination": GeneralHelper.makePaginationObject(pg.pageNo, pg.pageSize, pg.skip, total, result.length),
        "data": result
    };
}
exports.updateTournament = async (tournament_, request, id, imagePath) => {
    let startDateAndTime = await GeneralHelper.dateTimeToUtc(request.startingDateAndTime)
    let result = "";
    const updateTournamentInfo = {
        tournamentName: request.tournamentName.toLowerCase().trim() || tournament_.tournamentName,
        gameToPlay: request.gameToPlay || tournament_.gameToPlay,
        entryFee: request.entryFee || tournament_.entryFee,
        prize: request.prize || tournament_.prize,
        tournamentType: request.tournamentType || tournament_.tournamentType,
        startingDateAndTime: startDateAndTime || tournament_.startingDateAndTime
    };
    await Tournament.updateOne({_id: mongoose.Types.ObjectId(id)}, {
        $set: {
            tournamentName: updateTournamentInfo.tournamentName,
            gameToPlay: updateTournamentInfo.gameToPlay,
            entryFee: updateTournamentInfo.entryFee,
            prize: updateTournamentInfo.prize,
            startingDateAndTime: updateTournamentInfo.startingDateAndTime,
            tournamentType: updateTournamentInfo.tournamentType,
            tournamentTitleImage: imagePath
        }
    })
        .exec()
        .then(docs => {
            result = docs;
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
    return result;
}
exports.findTournament = async (data) => {
    let tournamentName = data.tournamentName.toLowerCase().trim()
    return await Tournament.findOne({tournamentName: tournamentName, gameToPlay: data.gameToPlay});
}
exports.findActiveTournament = async (data) => {
    return await Tournament.findOne({
        tournamentName: data.tournamentName.toLowerCase().trim(),
        gameToPlay: data.gameToPlay,
        isDeleted: false,
        tournamentType: null
    });
}
exports.findActiveFranchiseTournament = async (data) => {
    return await Tournament.findOne({
        tournamentName: data.tournamentName.toLowerCase().trim(),
        gameToPlay: data.gameToPlay,
        isDeleted: false,
        tournamentType: data.franchiseId
    });
}
exports.findTournamentByNameAndGame = async (tournamentName, gameToPlay) => {
    return await Tournament.findOne({tournamentName: tournamentName.toLowerCase(), gameToPlay: gameToPlay});
}
exports.findTournamentById = async (_id) => {
    return await Tournament.findOne({_id: mongoose.Types.ObjectId(_id), isDeleted: false})
}
exports.findTournamentByIdWithGamePopulate = async (_id) => {
    return await Tournament.findOne({
        _id: mongoose.Types.ObjectId(_id),
        isDeleted: false
    }).populate("gameToPlay", "gameName")
}
exports.findTournamentByIdWithPopulate = async (_id) => {
    return await Tournament.findOne({
        _id: mongoose.Types.ObjectId(_id),
        isDeleted: false
    }).populate("participatingTeams gameToPlay",
        "teamViewName participatingInTournaments participatingInMatches teamMembers teamTitleImage teamLeader winsCount lossCount gameName platforms")
}
exports.findTournamentByIdWithDeletedWithPopulate = async (_id) => {
    return await Tournament.findOne({
        _id: mongoose.Types.ObjectId(_id),
    }).populate("participatingTeams gameToPlay",
        "teamViewName participatingInTournaments participatingInMatches teamMembers teamTitleImage teamLeader winsCount lossCount gameName platforms")
}
exports.deleteTournament = async (tournamentId) => {
    await Tournament.updateOne({_id: mongoose.Types.ObjectId(tournamentId)}, {
        $set: {
            isDeleted: true,
            deletedAt: moment().utc(),
            resultVideo: ""
        }
    }).exec()
    return true
}
exports.deleteTournamentPermanent = async (tournamentId) => {
    await Tournament.deleteOne({_id: mongoose.Types.ObjectId(tournamentId)})
    return true
}
exports.addTeam = async (tournamentId, teamId) => {
    return Tournament.updateOne({_id: mongoose.Types.ObjectId(tournamentId)}, {$push: {participatingTeams: teamId}})
}
exports.teamTournamentsDetail = async (teamId) => {
    return await Tournament.find({participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}})
}
exports.allTournamentList = async () => {
    return await Tournament.find()
}
exports.allTournamentListWithoutDeleted = async () => {
    return await Tournament.find({tournamentType: "general", isDeleted: false})//add tournament type
}
exports.allTournamentListForExportWithoutDeleted = async () => {
    return await Tournament.find({isDeleted: false})
}
exports.updateTournamentTeamResult = async (tournamentId, teamId) => {
    return await Tournament.updateOne({_id: mongoose.Types.ObjectId(tournamentId)}, {$set: {winningTeam: teamId}})
}
exports.findAlreadyWinningTeam = async (tournamentId, teamId) => {
    return await Tournament.findOne({_id: tournamentId, winningTeam: mongoose.Types.ObjectId(teamId)})
}
exports.updateTournamentWinningTeam = async (tournamentId) => {
    return await Tournament.updateOne({_id: mongoose.Types.ObjectId(tournamentId)}, {$set: {winningTeam: null}})
}
exports.findMyTournament = async (teamId) => {
    return await Tournament.find({participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}})
}
exports.findMyTournamentWithOutDelete = async (teamId) => {
    return await Tournament.find({isDeleted: false, participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}})
}
exports.findMyExternalTournamentWithOutDelete = async (teamId) => {
    return await Tournament.find({
        isDeleted: false,
        tournamentType: "general",
        participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}
    })
}
exports.allFranchiseTournamentListWithoutDeleted = async () => {
    return await Tournament.find({tournamentType: "franchise", isDeleted: false})
}
exports.allTournamentListByGameNameIdWithoutDeleted = async (gameId) => {
    //add tournament type
    return await Tournament.find({
        tournamentType: "general",
        gameToPlay: mongoose.Types.ObjectId(gameId),
        isDeleted: false
    })
}
exports.getAllTournamentForGame = async () => {
    return await Tournament.find({tournamentType: "general", isDeleted: false}, {_id: 0, gameToPlay: 1})
}
exports.getAllTournamentForHome = async () => {
    return await Tournament.find({tournamentType: "general", isDeleted: false}).sort({createdAt: -1}).limit(4)
}
exports.findTeamParticipating = async (teamId) => {
    return await Tournament.find({
        winningTeam: null,
        isDeleted: false,
        participatingTeams: {$in: [mongoose.Types.ObjectId(teamId)]}
    })
}