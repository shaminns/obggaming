const fs = require("fs");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const GameHelper = require("../Services/GameHelper");
const LadderHelper = require("../Services/LadderHelper");
const TournamentHelper = require("../Services/TournamentHelper");
const MatchHelper = require("../Services/MatchHelper");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
//
exports.addGame = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let imagePath;
	let jpgImage;
	let pngImage;
	if (!req.file) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.IMAGE_NOT_READ
		);
		return res.status(response.code).json(response);
	}
	if (req.file) {
		if (req.file.mimetype != "image/jpeg") {
			jpgImage = false;
		} else {
			jpgImage = true;
		}
		if (req.file.mimetype != "image/png") {
			pngImage = false;
		} else {
			pngImage = true;
		}
		imagePath = req.file.path;
		if (jpgImage == false && pngImage == false) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!request.gameName || !request.platforms || !request.gameType) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETRE
		);
		return res.status(response.code).json(response);
	}
	let gameName = request.gameName.toLowerCase().trim();
	let game = await GameHelper.findAllGameByName(gameName);
	if (game != null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.GAME_EXIST
		);
		return res.status(response.code).json(response);
	}
	if (game == null) {
		let gameId = await GameHelper.addGame(request, imagePath);
		let gameData = await GameHelper.findGameById(gameId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.gameDetail = gameData;
		return res.status(response.code).json(response);
	}
};
exports.editGame = async (req, res, next) => {
	let request = req.body;
	let imagePath;
	let jpgImage;
	let pngImage;
	let gameDetail = await GameHelper.findGameById(request._id);
	if (gameDetail == null) {
		if (req.file) {
			imagePath = req.file.path;
			fs.unlinkSync(gameDetail.gameImage);
		}
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.GAME_DOESNOT_EXIST
		);
		return res.status(response.code).json(response);
	} else {
		if (!req.file) {
			imagePath = gameDetail.gameImage;
		} else {
			if (req.file.mimetype != "image/jpeg") {
				jpgImage = false;
			} else {
				jpgImage = true;
			}
			if (req.file.mimetype != "image/png") {
				pngImage = false;
			} else {
				pngImage = true;
			}
			if (jpgImage == false && pngImage == false) {
				imagePath = req.file.path;
				fs.unlinkSync(imagePath);
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.IMAGE_TYPE_ERROR
				);
				return res.status(response.code).json(response);
			} else {
				imagePath = req.file.path;
			}
		}
		let gameId = await GameHelper.editGame(request, imagePath);
		if (req.file) {
			fs.unlinkSync(gameDetail.gameImage);
		}
		let gameData = await GameHelper.findGameById(gameId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.gameDetail = gameData;
		return res.status(response.code).json(response);
	}
};
exports.deleteGame = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let gameArr = request.ids;
	for (let i = 0; i < gameArr.length; i++) {
		let gId = gameArr[i];
		let gameDetail = await GameHelper.findGameById(gId);
		if (gameDetail == null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.GAME_DOESNOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (gameDetail != null) {
			await GameHelper.deleteGame(gId);
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.ids = gameArr;
	return res.status(response.code).json(response);
};
//for drop down
exports.showGames = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	let result;
	result = await GameHelper.allGames();
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.allGames = result;
	return res.status(response.code).json(response);
};
exports.gameById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let gameId = req.query.id;
	let result = await GameHelper.findGameByIdWithDelete(gameId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.gameData = result;
	return res.status(response.code).json(response);
};
exports.games = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let gameResult;
	let gamePlatform;
	let finalGameArr = [];
	if (req.query.query) {
		if (req.query.query.toLowerCase() == "ladder") {
			let getLadderGameToPlay = await LadderHelper.getAllLaddersForGame();
			let filterGameId = [
				...new Set(
					getLadderGameToPlay.map((item) => item.gameToPlay.toString())
				),
			];
			if (filterGameId.length > 0) {
				for (let i = 0; i < filterGameId.length; i++) {
					let gameId = filterGameId[i];
					let gameDetail = await GameHelper.findUserGameById(gameId);
					if (gameDetail != null) {
						finalGameArr.push(gameDetail);
					}
				}
			}
		}
		if (req.query.query.toLowerCase() == "tournament") {
			let getTournamentGameById =
				await TournamentHelper.getAllTournamentForGame();
			let filterGameId = [
				...new Set(
					getTournamentGameById.map((item) => item.gameToPlay.toString())
				),
			];
			if (filterGameId.length > 0) {
				for (let i = 0; i < filterGameId.length; i++) {
					let gameId = filterGameId[i];
					let gameDetail = await GameHelper.findUserGameById(gameId);
					if (gameDetail != null) {
						finalGameArr.push(gameDetail);
					}
				}
			}
		}
		if (req.query.query.toLowerCase() == "match") {
			let getMatchGameToPlay = await MatchHelper.getAllMatchesForGame();
			let filterGameId = [
				...new Set(
					getMatchGameToPlay.map((item) => item.gameToPlay.toString())
				),
			];
			if (filterGameId.length > 0) {
				for (let i = 0; i < filterGameId.length; i++) {
					let gameId = filterGameId[i];
					let gameDetail = await GameHelper.findUserGameById(gameId);
					if (gameDetail != null) {
						finalGameArr.push(gameDetail);
					}
				}
			}
		}
		if (req.query.query.toLowerCase() == "all") {
			let allGames = await GameHelper.findAllGames();
			if (allGames.length > 0) {
				finalGameArr = [...allGames];
			}
		}
	}
	if (!req.query.query) {
		let allGames = await GameHelper.findAllGames();
		if (allGames.length > 0) {
			finalGameArr = [...allGames];
		}
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.gameData = finalGameArr;
	return res.status(response.code).json(response);
};
exports.allFranchiseGames = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let gameArr = [];
	let franchiseGameDetail = await GameHelper.allFranchiseGames();
	for (let i = 0; i < franchiseGameDetail.length; i++) {
		let gameObj = {
			_id: franchiseGameDetail[i]._id,
			gameName: franchiseGameDetail[i].gameName,
			gameImage: franchiseGameDetail[i].gameImage,
		};
		gameArr.push(gameObj);
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.gameData = gameArr;
	return res.status(response.code).json(response);
};
exports.getAllGameForHome = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let allGameForHome = await GameHelper.findAllUserGameForHome();
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.gameData = allGameForHome;
	return res.status(response.code).json(response);
};
exports.getAllGameFromDb = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let allGames = await GameHelper.findAllGamesWithDeletd();
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.gameData = allGames;
	return res.status(response.code).json(response);
};
