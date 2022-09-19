// Mongoose
const mongoose = require("mongoose");
//Models
const Game = require("../Models/Game");
const Match = require("../Models/Match");
// Helpers
const GeneralHelper = require("./GeneralHelper");
const {gameById} = require("../Controllers/GameController");
const MatchResult = require("../Models/MatchResult");
//////////////////////////////////////////////////////////////
/// only for developer - DB Game Type Change ////////////////
////////////////////////////////////////////////////////////
exports.updateGameType = async (gameId, gameType) => {
    return await Game.updateOne({_id: gameId}, {$set: {gameType: gameType}})
}
exports.permanentDeleteGame = async (gameId) => {
    return await Game.deleteOne({_id: gameId})
}
exports.findAllGamesWithDeletd = async () => {
    return await Game.find()
}
///
exports.findGameById = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId),
        isDeleted: false
    })
}
exports.findGameByIdWithDelete = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId)
    })
}
exports.findUserGameById = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId),
        isDeleted: false,
        gameType: "user"
    })
}
exports.findFranchiseGameById = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId), gameType: "franchise",
        isDeleted: false
    })
}
exports.findDeletedGameById = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId), gameType: "user"
    })
}
exports.findUserFranchiseGameByIdWithDeleted = async (gameId) => {
    return await Game.findOne({
        _id: mongoose.Types.ObjectId(gameId)
    })
}
exports.findGameByName = async (gameName) => {
    return await Game.findOne({gameName: gameName, gameType: "user", isDeleted: false})
};
exports.findAllGameByName = async (gameName) => {
    return await Game.findOne({gameName: gameName, isDeleted: false})
};
exports.findFranchiseGameByName = async (gameName) => {
    return await Game.findOne({gameName: gameName, gameType: "franchise", isDeleted: false})
};
exports.searchGameByName = async (gameNamee) => {
    return await Game.find({
        gameName: {$regex: gameNamee},
        isDeleted: false, gameType: "user"
    })
}
exports.findGameByPlatform = async (gamePlatform) => {
    return await Game.find({
        platforms: {$in: gamePlatform}, gameType: "user"
        , isDeleted: false
    })
}
exports.allGames = async () => {
    return await Game.find({gameType: "user", isDeleted: false})
};
exports.allGamesWithFranchiseGame = async () => {
    return await Game.find({isDeleted: false})
};
exports.addGame = async (data, imagePath) => {
    let game
    let isGameArr = Array.isArray(data.platforms)
    var gamePlatformArr;
    let platformsArr = []
    if (typeof data.platforms === "string") {
        gamePlatformArr = JSON.parse(data.platforms)
        for (let i = 0; i < gamePlatformArr.length; i++) {
            platformsArr.push(gamePlatformArr[i].toLowerCase())
        }
        game = new Game({
            _id: new mongoose.Types.ObjectId(),
            gameName: data.gameName.toLowerCase().trim(),
            gameImage: imagePath,
            platforms: platformsArr,
            uploadDate: Date.now(),
        });
    } else {
        if (isGameArr == true) {
            for (let i = 0; i < data.platforms.length; i++) {
                platformsArr.push(data.platforms[i].toLowerCase())
            }
            game = new Game({
                _id: new mongoose.Types.ObjectId(),
                gameName: data.gameName.toLowerCase().trim(),
                gameImage: imagePath,
                platforms: platformsArr,
                uploadDate: Date.now(),
            });
        }
        if (isGameArr == false) {
            game = new Game({
                _id: new mongoose.Types.ObjectId(),
                gameName: data.gameName.toLowerCase().trim(),
                gameImage: imagePath,
                platforms: data.platforms,
                uploadDate: Date.now(),
            })
        }
    }
    await game.save();
    return game._id
}
exports.editGame = async (data, imagePath) => {
    await Game.updateOne({_id: data._id}, {$set: {platforms: []}}, {multi: true})
    let game = await Game.findOne({_id: data._id})
    let isGameArr = Array.isArray(data.platforms)
    var gamePlatformArr;
    let platformsArr = []
    if (typeof data.platforms === "string") {
        gamePlatformArr = JSON.parse(data.platforms)
        for (let i = 0; i < gamePlatformArr.length; i++) {
            platformsArr.push(gamePlatformArr[i].toLowerCase())
        }
        game.gameName = data.gameName.toLowerCase().trim() || game.gameName,
            game.gameImage = imagePath,
            game.platforms = platformsArr
    } else {
        let isGameArr = Array.isArray(data.platforms)
        if (isGameArr == true) {
            let platformsArr = []
            for (let i = 0; i < data.platforms.length; i++) {
                platformsArr.push(data.platforms[i].toLowerCase())
            }
            game.gameName = data.gameName.toLowerCase().trim() || game.gameName,
                game.gameImage = imagePath,
                game.platforms = platformsArr
        }
        if (isGameArr == false) {
            game.gameName = data.gameName.toLowerCase().trim() || game.gameName,
                game.gameImage = imagePath,
                game.platforms = data.platforms
        }
    }
    let gameModel = new Game(game);
    await gameModel.save()
    return gameModel._id
}
exports.deleteGame = async (_id) => {
    await Game.updateOne({_id: mongoose.Types.ObjectId(_id)}, {
        $set: {isDeleted: true, deletedAt: Date.now()},
    }).exec();
    return _id
};
exports.showGames = async (pageNo, searchValue = null) => {
    let page = GeneralHelper.getPaginationDetails(pageNo);
    let gameCondition = [{isDeleted: false}];
    let game = GeneralHelper.isValueSet(searchValue);
    if (game) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
        gameCondition.push({
            $or: [
                {name: {$regex: regex}},
                {platforms: {$regex: regex}},
                {profileImage: {$regex: regex}},
            ],
        });
    }
    gameCondition = {$and: gameCondition};
    let result = await Game.find(gameCondition)
        .sort({_id: -1})
        .skip(page.skip)
        .limit(page.pageSize)
        .exec();
    let total = await Game.find(gameCondition).countDocuments();
    return {
        pagination: GeneralHelper.makePaginationObject(
            page.pageNo,
            page.pageSize,
            page.skip,
            total,
            result.length
        ),
        data: result,
    };
};
exports.searchGameByName = async (gameName) => {
    return await Game.find({gameName: gameName})
}
exports.adminSearchGameByName = async (gameNamee) => {
    return await Game.find({
        gameName: {$regex: gameNamee},
        isDeleted: false
    })
}
exports.allFranchiseGames = async () => {
    return await Game.find({gameType: "franchise", isDeleted: false})
}
exports.findGameByNameWithoutDelete = async (gameName) => {
    return await Game.findOne({
        gameName: gameName,
        isDeleted: false
    })
}
exports.findAllGames = async () => {
    return await Game.find({isDeleted: false, gameType: "user"})
}
exports.findAllUserGameForHome = async () => {
    return await Game.find({isDeleted: false, gameType: "user"}).sort({createdAt: -1}).limit(5)
}
exports.findGameWithGAmeNameWithPaginationWithoutDel = async (gameName, pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Game.find({gameName: {$regex: gameName}, isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Game.find({gameName: {$regex: gameName}, isDeleted: false}).countDocuments();
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
exports.allGameWithPaginationWithoutDel = async (pageNo) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let userCondition
    let searchValue = null;
    if (GeneralHelper.isValueSet(searchValue)) {
        searchValue = GeneralHelper.escapeLike(searchValue);
        let regex = new RegExp(searchValue, "i");
    }
    let result = await Game.find({isDeleted: false})
        .skip(pg.skip)
        .limit(pg.pageSize)
        .exec();
    let total = await Game.find({isDeleted: false}).countDocuments();
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