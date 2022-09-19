const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
// Models
const Ladder = require("../Models/Ladder");
// Helpers
const GeneralHelper = require("./GeneralHelper");
const Tournament = require("../Models/Tournament");
exports.createLadder = async (data, imagePath, startDateAndTime, endDateAndTime) => {
    const ladder = new Ladder({
        _id: new mongoose.Types.ObjectId(),
        ladderTitleImage: imagePath,
        ladderName: data.ladderName.toLowerCase().trim(),
        gameToPlay: data.gameToPlay,
        entryFee: data.entryFee,
        prize: data.prize,
        teamSize: data.teamSize,
        totalTeams: data.totalTeams,
        ladderType: data.ladderType,
        startingDateAndTime: startDateAndTime,
        endingDateAndTime: endDateAndTime,
    });
    await ladder.save();
    return ladder._id
}
exports.findLadder = async (ladderId) => {
    return await Ladder.findOne({_id: ladderId, isDeleted: false})
}
exports.listLadder = async (pageNo) => {
    let searchValue = null;
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let ladderCondition = [{isDeleted: false}];
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
        ladderCondition.push({
            $or: [
                {ladderName: {$regex: regex}},
                {entryFee: {$regex: regex}},
                {prize: {$regex: regex}},
                {startingTime: {$regex: regex}},
                {startingDate: {$regex: regex}},
                {endingTime: {$regex: regex}},
                {endingDate: {$regex: regex}},
                {gameToPlay: {$regex: regex}},
            ],
        });
    }
    ladderCondition = {$and: ladderCondition};
    let result = await Ladder.find(ladderCondition)
        .sort({createdAt: 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Ladder.find(ladderCondition).countDocuments();
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
};
exports.laddersByNameWithPagination = async (ladderName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Ladder.find({ladderName: {$regex: ladderName}, isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Ladder.find({ladderName: {$regex: ladderName}, isDeleted: false}).countDocuments();
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
exports.laddersWithPagination = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Ladder.find({isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Ladder.find({isDeleted: false}).countDocuments();
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
exports.listLadderByName = async (paramLadderName) => {
    return Ladder.find({ladderName: {$regex: paramLadderName.toLowerCase()}, isDeleted: false});
};
exports.listLadderWithPageAndNameSearch = async (pageNo, paramLadderName) => {
    let searchValue = null;
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let ladderCondition = [{isDeleted: false, ladderName: {$regex: paramLadderName.toLowerCase()}}];
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
        ladderCondition.push({
            $or: [
                {ladderName: {$regex: regex}},
                {entryFee: {$regex: regex}},
                {prize: {$regex: regex}},
                {startingTime: {$regex: regex}},
                {startingDate: {$regex: regex}},
                {endingTime: {$regex: regex}},
                {endingDate: {$regex: regex}},
                {gameToPlay: {$regex: regex}},
            ],
        });
    }
    ladderCondition = {$and: ladderCondition};
    let result = await Ladder.find(ladderCondition)
        .sort({createdAt: 1})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Ladder.find(ladderCondition).countDocuments();
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
};
// exports.findLadder = async (ladderId) => {
//     return Ladder.findOne({_id: ladderId})
// };
exports.updateLadder = async (ladder, request, ImagePath, res) => {
    let result = "";
    let startDateAndTime = await GeneralHelper.dateTimeToUtc(request.startingDateAndTime)
    let endDateAndTime = await GeneralHelper.dateTimeToUtc(request.endingDateAndTime)
    const updateLadderInfo = {
        ladderName: request.ladderName.toLowerCase().trim() || ladder.ladderName,
        gameToPlay: request.gameToPlay || ladder.gameToPlay,
        entryFee: request.entryFee || ladder.entryFee,
        prize: request.prize || ladder.prize,
        startingDateAndTime: startDateAndTime || ladder.startingDateAndTime,
        endingDateAndTime: endDateAndTime || ladder.endingDateAndTime,
        ladderType: request.ladderType.toLowerCase() || ladder.ladderType
    }
    await Ladder.updateOne({_id: request._id}, {
        $set: {
            ladderName: updateLadderInfo.ladderName,
            gameToPlay: updateLadderInfo.gameToPlay,
            entryFee: updateLadderInfo.entryFee,
            prize: updateLadderInfo.prize,
            startingDateAndTime: updateLadderInfo.startingDateAndTime,
            endingDateAndTime: updateLadderInfo.endingDateAndTime,
            ladderTitleImage: ImagePath,
            ladderType: updateLadderInfo.ladderType
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
exports.deleteLadder = async (ladderId) => {
    await Ladder.updateOne({
        _id: mongoose.Types.ObjectId(ladderId)
    }, {
        $set: {
            isDeleted: true,
            deletedAt: moment()
        }
    })
    return true
};
exports.deleteLadderPermanent = async (ladderId) => {
    return await Ladder.deleteOne({_id: mongoose.Types.ObjectId(ladderId)})
}
exports.addTeam = async (ladderId, teamId, ladderTeamResult) => {
    return Ladder.updateOne({_id: ladderId},
        {$push: {participatingTeams: {teamId: teamId, ladderTeamResult: ladderTeamResult}}}
    )
}
exports.findLadderById = async (ladderId) => {
    return await Ladder.findOne({_id: ladderId}).populate
    ("participatingTeams.teamId gameToPlay", "teamViewName gameName")
}
exports.findLadderByIdWithoutPopulateGame = async (ladderId) => {
    return await Ladder.findOne({_id: ladderId}).populate
    ("participatingTeams.teamId", "teamViewName")
}
exports.findLadderByIdWithoutDel = async (ladderId) => {
    return await Ladder.findOne({_id: ladderId, isDeleted: false}).populate
    ("participatingTeams.teamId gameToPlay", "teamViewName gameName")
}
exports.findLadderByIdWithoutPopulate = async (ladderId) => {
    return await Ladder.findOne({_id: ladderId}).populate
    ("participatingTeams.teamId ", "teamViewName ")
}
exports.findLadderByName = async (ladderName) => {
    return await Ladder.findOne({ladderName: ladderName, isDeleted: false})
}
exports.allLaddersList = async () => {
    return await Ladder.find()
}
exports.allLaddersListWithoutDeleted = async () => {
    return await Ladder.find({isDeleted: false})
}
exports.updateLadderTeamResult = async (ladderId, teamId, newladderTeamResult) => {
    await Ladder.updateOne({
            _id: ladderId
        },
        {$pull: {participatingTeams: {teamId: {$in: [mongoose.Types.ObjectId(teamId)]}}}})
    await Ladder.updateOne({
            _id: ladderId
        },
        {
            $push: {
                participatingTeams: {
                    teamId: mongoose.Types.ObjectId(teamId),
                    ladderTeamResult: newladderTeamResult
                }
            }
        })
    return true
}
exports.findMyLadders = async (teamId) => {
    return await Ladder.find({"participatingTeams.teamId": {$in: [mongoose.Types.ObjectId(teamId)]}})
}
exports.findMyLaddersWithOutDelete = async (teamId) => {
    return await Ladder.find({isDeleted: false, "participatingTeams.teamId": {$in: [mongoose.Types.ObjectId(teamId)]}})
}
// exports.ladderDetailById = async (ladderId) => {
//     return await Ladder.findOne({
//         _id: ladderId
//     }).populate("participatingTeams.teamId", "teamViewName")
// }
exports.findLadderByGameIdWithoutDelete = async (gameId) => {
    return await Ladder.find({gameToPlay: mongoose.Types.ObjectId(gameId), isDeleted: false})
}
exports.getAllLaddersForGame = async () => {
    return await Ladder.find({isDeleted: false}, {_id: 0, gameToPlay: 1})
}
exports.getAllLaddersForHome = async () => {
    return await Ladder.find({isDeleted: false}).sort({createdAt: -1}).limit(4)
}
exports.findTeamParicipatingInLadder = async (teamId) => {
    return await Ladder.find({isDeleted: false, 'participatingTeams.teamId': {$in: [mongoose.Types.ObjectId(teamId)]}})
}