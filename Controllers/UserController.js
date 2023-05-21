const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs");
const moment = require("moment");
//Controller
const matchController = require("../Controllers/MatchController");
const franchiseController = require("../Controllers/FranchiseController");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const UserHelper = require("../Services/UserHelper");
const MatchHelper = require("../Services/MatchHelper");
const TeamHelper = require("../Services/TeamHelper");
const MatchResultHelper = require("../Services/MatchResultHelper");
const FranchiseHelper = require("../Services/FranchiseHelper");
const TryoutHelper = require("../Services/TryoutHelper");
const FantasyLeagueHelper = require("../Services/FantasyLeagueHelper");
const TradeMoveHelper = require("../Services/TradeMovesHelper");
const FantasyTeamHelper = require("../Services/FantasyTeamHelper");
// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
///
exports.delete = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request.id) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.User_Id_Missing
		);
		return res.status(response.code).json(response);
	}
	this.findUser(request, res);
	let result = await UserHelper.deleteUser(request.id);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		result
	);
	return res.status(response.code).json(response);
};
exports.updateUser = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request._id) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let user = await UserHelper.foundUserById(request._id);
	if (user == null) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.USER_NOT_EXISTS
		);
		return res.status(response.code).json(response);
	}
	let result = await UserHelper.updatingUser(user, request, res);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		result
	);
	return res.status(response.code).json(response);
};
exports.showSpecificUser = async (req, res, next) => {
	let request = req.body;
	let result = await UserHelper.foundUserByEmail(request.email);
	let response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		result
	);
	return res.status(response.code).json(response);
};
exports.checkEmailAndPassword = async (request, res) => {
	if (!(request.email && request.password)) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_EMAIL_OR_PASSWORD
		);
		return res.status(response.code).json(response);
	}
};
exports.showMyDetails = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let userData = await this.userProfielDetailData(userId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.userData = userData;
		return res.status(response.code).json(response);
	}
};
exports.editMyDetails = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if ("fullName" in request) {
			await UserHelper.updateUserFullName(request, userId);
		}
		if ("about" in request) {
			await UserHelper.updateUserAbout(request, userId);
		}
		let userData = await this.userProfielDetailData(userId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.userData = userData;
		return res.status(response.code).json(response);
	}
};
exports.addUser = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (
		!request.fullName ||
		!request.userName ||
		!request.email ||
		!request.password
	) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let fullName = request.fullName.toLowerCase().trim();
	let userName = request.userName.toLowerCase().trim();
	let email = request.email.toLowerCase().trim();
	let modelUser = await UserHelper.foundUserByEmail(email);
	if (!(modelUser == null)) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.EMAIL_EXIST
		);
		return res.status(response.code).json(response);
	}
	let userNameCheck = await UserHelper.findUserByUserName(userName);
	if (userNameCheck != null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.USERNAME_EXIST
		);
		return res.status(response.code).json(response);
	}
	let password = await GeneralHelper.bcryptPassword(request.password);
	let user = await UserHelper.createUser(email, password, fullName, userName);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.updateMyProfile = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let user = await UserHelper.foundUserById(userId);
		if (user == null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		}
		if (user != null) {
			let result = await UserHelper.updateUser(request, userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL,
				result
			);
			return res.status(response.code).json(response);
		}
	}
};
exports.updateProfileImage = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
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
	if (!req.headers.authorization) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(imagePath);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let user = await UserHelper.foundUserById(userId);
		let previousProfileImage = user.profileImage;
		if (user == null) {
			fs.unlinkSync(imagePath);
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		}
		if (user != null) {
			if (previousProfileImage == "") {
				await UserHelper.updateProfileImage(userId, imagePath);
				let userDetail = await UserHelper.foundUserById(userId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.userData = userDetail;
				return res.status(response.code).json(response);
			}
			if (previousProfileImage != "") {
				fs.unlinkSync(previousProfileImage);
				await UserHelper.updateProfileImage(userId, imagePath);
				let userDetail = await this.userProfielDetailData(userId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.userData = userDetail;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.updateBackgroundImage = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
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
			fs.unlinkSync(previousBackgroundImage);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.IMAGE_TYPE_ERROR
			);
			return res.status(response.code).json(response);
		}
	}
	if (!req.headers.authorization) {
		fs.unlinkSync(previousBackgroundImage);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		fs.unlinkSync(previousBackgroundImage);
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let user = await UserHelper.foundUserById(userId);
		if (user == null) {
			fs.unlinkSync(previousBackgroundImage);
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		}
		if (user != null) {
			let previousBackgroundImage = user.backgroundImage;
			if (previousBackgroundImage == "") {
				await UserHelper.updateBackgroundImage(userId, imagePath);
				let userDetail = await UserHelper.foundUserById(userId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.userData = userDetail;
				return res.status(response.code).json(response);
			}
			if (previousBackgroundImage != "") {
				fs.unlinkSync(previousBackgroundImage);
				await UserHelper.updateBackgroundImage(userId, imagePath);
				let userDetail = await this.userProfielDetailData(userId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.userData = userDetail;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.addGamerTags = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request.email) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let user = await UserHelper.foundUserByEmail(request.email.toLowerCase());
	if (user == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.USER_NOT_EXISTS
		);
		return res.status(response.code).json(response);
	}
	const GamerTags = {
		XboxId: request.XboxId || null,
		PsnId: request.PsnId || null,
		NintendoId: request.NintendoId || null,
		OriginId: request.OriginId || null,
		UplayId: request.UplayId || null,
		MobileGamerTag: request.MobileGamerTag || null,
		RiotId: request.RiotId || null,
		DiscordId: request.DiscordId || null,
	};
	let result = await UserHelper.addGamerTag(user, GamerTags, res);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFULL,
		result
	);
	return res.status(response.code).json(response);
};
exports.showTags = async (req, res) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request.email) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	let user = await UserHelper.foundUserByEmail(request.email);
	if (user == null) {
		response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.USER_NOT_EXISTS
		);
		return res.status(response.code).json(response);
	}
	response = await ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFULL,
		user.Tags
	);
	return res.status(response.code).json(user);
};
exports.missingParameterResponse = async (req, res) => {
	let response = ResponseHelper.setResponse(
		ResponseCode.NOT_SUCCESS,
		Message.MISSING_PARAMETER
	);
	return res.status(response.code).json(response);
};
exports.requestWithdrawal = async (req, res) => {
	let request = req.body;
	let response;
	if (
		!request.userName ||
		!request.accountType ||
		!request.accountNumber ||
		!request.withdrawalCoins
	) {
		this.missingParameterResponse(req, res);
	}
	let findUser = await UserHelper.findUserByUserName(request.userName);
	if (findUser == null) {
		this.noSuchUserResponse(req, res);
	}
	if (findUser.credits < request.withdrawalCoins) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.INVALID_REQUEST
		);
		return res.status(response.code).json(response);
	} else {
		let result = await UserHelper.createWithdrawalRequest(
			request.userName,
			request.accountType,
			request.accountNumber,
			request.withdrawalCoins
		);
		this.requestSuccessfulResponse(req, res, result);
	}
};
exports.noSuchUserResponse = async (req, res) => {
	let response = ResponseHelper.setResponse(
		ResponseCode.NOT_SUCCESS,
		Message.USER_NOT_EXISTS
	);
	return res.status(response.code).json(response);
};
exports.requestSuccessfulResponse = async (req, res, result = null) => {
	let response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		result
	);
	return res.status(response.code).json(response);
};
exports.sendFriendRequest = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (!request.friendId) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let user = await UserHelper.foundUserById(userId);
		if (user._id == request.friendId) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_REQUEST
			);
			return res.status(response.code).json(response);
		}
		let findUser = await UserHelper.foundUserById(request.friendId);
		console.log("find user : ", findUser);
		if (findUser == null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_NOT_EXISTS
			);
			return res.status(response.code).json(response);
		}
		if (findUser != null) {
			let friendRequest;
			let friendReqeustCheck = await UserHelper.checkAlreadyFriendRequest(
				userId,
				findUser._id
			);
			if (friendReqeustCheck != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.ALREADY_REQUESTED
				);
				return res.status(response.code).json(response);
			}
			let receivedFriendReqeustCheck =
				await UserHelper.checkAlreadyReceivedRequest(userId, findUser._id);
			if (receivedFriendReqeustCheck != null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.INVALID_REQUEST +
					". " +
					Message.ALREADY_REQUESTED +
					" to you." +
					Message.CHECK_FRIEND_REQUEST
				);
				return res.status(response.code).json(response);
			}
			if (friendReqeustCheck == null) {
				await UserHelper.sendRequest(userId, findUser);
				console.log("friend id : ", findUser._id);
				let userRecord = await this.userProfielDetailData(findUser._id); //friendId
				let sentRequest = await UserHelper.sentFriendRequestToFriend(
					userId,
					findUser._id
				);
				let receivedRequest = await UserHelper.receivedFriendRequestToFriend(
					findUser._id,
					userId
				);
				if (sentRequest != null) {
					if (sentRequest.status == "pending") {
						friendRequest = "sent";
					}
					if (sentRequest.status == "accepted") {
						friendRequest = "accepted";
					}
				}
				if (receivedRequest != null) {
					if (receivedRequest.status == "pending") {
						friendRequest = "received";
					}
					if (receivedRequest.status == "accepted") {
						friendRequest = "accepted";
					}
				}
				if (sentRequest == null && receivedRequest == null) {
					friendRequest = "";
				}
				let userData = {
					role: userRecord.role,
					profileImage: userRecord.profileImage,
					backgroundImage: userRecord.backgroundImage,
					currentMatch: userRecord.currentMatch,
					userDetail: {
						userName: userRecord.userDetail.userName,
						fullName: userRecord.userDetail.fullName,
						email: userRecord.userDetail.email,
						matches: userRecord.userDetail.matches,
						wins: userRecord.userDetail.wins,
						losses: userRecord.userDetail.losses,
						winPercentage: userRecord.userDetail.winPercentage,
						recentResults: userRecord.userDetail.recentResults,
						friends: userRecord.userDetail.friends,
						credits: userRecord.userDetail.credits,
						tags: userRecord.userDetail.tags,
						resetPasswordToken: userRecord.userDetail.resetPasswordToken,
						resetPasswordExpires: userRecord.userDetail.resetPasswordExpires,
						about: userRecord.userDetail.about,
					},
					isDeleted: userRecord.isDeleted,
					deletedAt: userRecord.deletedAt,
					_id: userRecord._id,
					createdAt: userRecord.createdAt,
					updatedAt: userRecord.updatedAt,
					friendRequest: friendRequest,
				};
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.userData = userData;
				return res.status(response.code).json(response);
			}
		}
	}
};
exports.showMyRequest = async (req, res) => {
	let request = req.body;
	let flName = "";
	let response;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let myRequests = await this.myRequestData(userId);
		let response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.receivedRequests = myRequests.receivedRequests;
		response.sentRequests = myRequests.sentRequests;
		return res.status(response.code).json(response);
	}
};
exports.acceptFriendRequest = async (req, res) => {
	let request = req.body;
	let response;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if (!request.fromId) {
			this.missingParameterResponse(req, res);
		}
		let user = await UserHelper.foundUserById(request.fromId);
		if (user == null) {
			this.noSuchUserResponse(req, res);
		} else {
			let fromId = request.fromId;
			let findRequest = await UserHelper.findRequest(fromId);
			if (findRequest == null) {
				this.noSuchRequestResponse(req, res);
			} else {
				let alreadyAdded = await UserHelper.alreadyInFriends(userId, fromId);
				if (alreadyAdded == true) {
					response = ResponseHelper.setResponse(
						ResponseCode.NOT_SUCCESS,
						Message.ALREADY_EXIST
					);
					return res.status(response.code).json(response);
				}
				if (alreadyAdded == false) {
					if (request.status == "cancelled") {
						await UserHelper.acceptRequest(userId, fromId, request.status);
						let myRequests = await this.myRequestData(userId);
						response = ResponseHelper.setResponse(
							ResponseCode.SUCCESS,
							Message.REQUEST_SUCCESSFUL
						);
						response.receivedRequests = myRequests.receivedRequests;
						response.sentRequests = myRequests.sentRequests;
						return res.status(response.code).json(response);
					}
					if (request.status == "accepted")
						await UserHelper.addFriend(userId, fromId);
					await UserHelper.addRequestedFriend(fromId, userId);
					await UserHelper.acceptRequest(userId, fromId, request.status);
					let result = await UserHelper.findAcceptedRequestToFriend(
						fromId,
						userId
					);
					let myRequests = await this.myRequestData(userId);
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL
					);
					response.receivedRequests = myRequests.receivedRequests;
					response.sentRequests = myRequests.sentRequests;
					return res.status(response.code).json(response);
				}
			}
		}
	}
};
exports.deleteFriendRequest = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let friendRequest;
		let friendId = request.friendId;
		let checkFriendRequestExist = await UserHelper.findSentRequestToFriend(
			userId,
			friendId
		);
		if (checkFriendRequestExist == null) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.NOT_REQUESTED
			);
			return res.status(response.code).json(response);
		} else {
			let aFriendReqeustCheck = await UserHelper.checkAlreadyFriendRequest(
				userId,
				friendId
			);
			await UserHelper.deleteFriendRequest(userId, friendId);
			let userRecord = await this.userProfielDetailData(friendId);
			friendRequest = "";
			let userData = {
				role: userRecord.role,
				profileImage: userRecord.profileImage,
				backgroundImage: userRecord.backgroundImage,
				currentMatch: userRecord.currentMatch,
				userDetail: {
					userName: userRecord.userDetail.userName,
					fullName: userRecord.userDetail.fullName,
					email: userRecord.userDetail.email,
					matches: userRecord.userDetail.matches,
					wins: userRecord.userDetail.wins,
					losses: userRecord.userDetail.losses,
					winPercentage: userRecord.userDetail.winPercentage,
					recentResults: userRecord.userDetail.recentResults,
					friends: userRecord.userDetail.friends,
					credits: userRecord.userDetail.credits,
					tags: userRecord.userDetail.tags,
					resetPasswordToken: userRecord.userDetail.resetPasswordToken,
					resetPasswordExpires: userRecord.userDetail.resetPasswordExpires,
					about: userRecord.userDetail.about,
				},
				isDeleted: userRecord.isDeleted,
				deletedAt: userRecord.deletedAt,
				_id: userRecord._id,
				createdAt: userRecord.createdAt,
				updatedAt: userRecord.updatedAt,
				friendRequest: friendRequest,
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.userData = userData;
			return res.status(response.code).json(response);
		}
	}
};
exports.noSuchRequestResponse = async (req, res) => {
	let response = ResponseHelper.setResponse(
		ResponseCode.NOT_SUCCESS,
		Message.NO_REQUEST_FOUND
	);
	return res.status(response.code).json(response);
};
exports.myFriendsList = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let friendsDataArr = [];
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		let friendsList = await UserHelper.myFriendList(userId);
		if (friendsList != null) {
			for (let i = 0; i < friendsList.userDetail.friends.length; i++) {
				let friendId = friendsList.userDetail.friends[i];
				let friendDetail = await UserHelper.foundUserById(friendId);
				let fullName = friendDetail.userDetail.fullName;
				let userName = friendDetail.userDetail.userName;
				let profileImage = friendDetail.profileImage;
				friendsDataArr.push({
					_id: friendId,
					fullName: fullName,
					userName: userName,
					profileImage: profileImage,
				});
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.friendsList = friendsDataArr;
		return res.status(response.code).json(response);
	}
};
exports.saerchByFullNameUserName = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let searchArr = [];
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if (req.query.query) {
			console.log("query : ", req.query.query);
			// let format = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;//block special character in search
			let format = /^[a-zA-Z0-9_.-]*$/; //block special character in search without (. - _)
			if (!req.query.query.match(format)) {
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.searchData = [];
				return res.status(response.code).json(response);
			} else {
				let searchValue = req.query.query.toLowerCase().trim();
				let searchData = await UserHelper.findUserByUserNameAndFullName(
					searchValue
				);
				for (let i = 0; i < searchData.length; i++) {
					if (userId.toString() != searchData[i]._id.toString()) {
						searchArr.push(searchData[i]);
					}
				}
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.searchData = searchArr;
				return res.status(response.code).json(response);
			}
		}
		if (!req.query.query) {
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.searchData = [];
			return res.status(response.code).json(response);
		}
	}
};
exports.userProfileById = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let searchedUserId = req.query.query;
	let friendRequest;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	let token = req.headers.authorization;
	let userId = await tokenExtractor.getInfoFromToken(token);
	if (userId == null) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_AUTHORIZE,
			Message.INVALID_TOKEN
		);
		return res.status(response.code).json(response);
	}
	if (userId != null) {
		if (req.query.query) {
			let userRecord = await this.userProfielDetailData(searchedUserId);
			let sentRequest = await UserHelper.sentFriendRequestToFriend(
				userId,
				searchedUserId
			);
			let receivedRequest = await UserHelper.receivedFriendRequestToFriend(
				searchedUserId,
				userId
			);
			if (sentRequest != null) {
				if (sentRequest.status == "pending") {
					friendRequest = "sent";
				}
				if (sentRequest.status == "accepted") {
					friendRequest = "accepted";
				}
				if (sentRequest.status == "cancelled") {
					friendRequest = "";
				}
			}
			if (receivedRequest != null) {
				if (receivedRequest.status == "pending") {
					friendRequest = "received";
				}
				if (receivedRequest.status == "accepted") {
					friendRequest = "accepted";
				}
				if (receivedRequest.status == "cancelled") {
					friendRequest = "";
				}
			}
			if (sentRequest == null && receivedRequest == null) {
				friendRequest = "";
			}
			let userData = {
				role: userRecord.role,
				profileImage: userRecord.profileImage,
				backgroundImage: userRecord.backgroundImage,
				currentMatch: userRecord.currentMatch,
				userDetail: {
					userName: userRecord.userDetail.userName,
					fullName: userRecord.userDetail.fullName,
					email: userRecord.userDetail.email,
					matches: userRecord.userDetail.matches,
					wins: userRecord.userDetail.wins,
					losses: userRecord.userDetail.losses,
					winPercentage: userRecord.userDetail.winPercentage,
					recentResults: userRecord.userDetail.recentResults,
					friends: userRecord.userDetail.friends,
					credits: userRecord.userDetail.credits,
					tags: userRecord.userDetail.tags,
					resetPasswordToken: userRecord.userDetail.resetPasswordToken,
					resetPasswordExpires: userRecord.userDetail.resetPasswordExpires,
					about: userRecord.userDetail.about,
				},
				isDeleted: userRecord.isDeleted,
				deletedAt: userRecord.deletedAt,
				_id: userRecord._id,
				createdAt: userRecord.createdAt,
				updatedAt: userRecord.updatedAt,
				friendRequest: friendRequest,
			};
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.userData = userData;
			return res.status(response.code).json(response);
		}
		if (req.query.query == "") {
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.userData = [];
			return res.status(response.code).json(response);
		}
		if (!req.query.query) {
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.userData = [];
			return res.status(response.code).json(response);
		}
	}
};
///// user with in user controller
exports.myRequestData = async (userId) => {
	let response = ResponseHelper.getDefaultResponse();
	let userToUserName;
	let teamRequestType;
	let teamName;
	let teamRequest = "team invite";
	let franchiseTeamRequest = "franchise team invite";
	let friendRequest = "friend request";
	let matchRequest = "match invite";
	let tryoutRequest = "tryout request";
	let flRequest = "fl request";
	let tradeMoveRequest = "trade move";
	let finalReceivedArr = [];
	let finalSendArr = [];
	let finalReceivedTeamInvArr = [];
	let finalSendTeamInvArr = [];
	let finalReceivedMatchInvArr = [];
	let finalSendMatchInvArr = [];
	let finalReceivedTryoutArr = [];
	let finalSendTryoutArr = [];
	let finalReceivedFlArr = [];
	let finalSendFlArr = [];
	let receiveTradeMoveArr = [];
	let sendTradeMoveArr = [];
	let finalSendTradeMoveArr = [];
	let finalReceivedTradeMoveArr = [];
	let receivedRequestArr;
	let sendRequestArr;
	let receivedTryoutArr;
	let sendTryoutArr;
	let receivedFlArr;
	let sendFlArr;
	let finalReceivedRequestArr;
	let finalSendRequestArr;
	let receivedResult = await UserHelper.showReceivedRequests(userId);
	let sendResult = await UserHelper.showSendRequests(userId);
	let receivedTeamInvitesResult = await TeamHelper.findAllReceivedTeamInvite(
		userId
	);
	let sendTeamInvitesResult = await TeamHelper.findAllSendTeamInvite(userId);
	let receivedMatchInviteResult = await MatchHelper.findAllReceivedMatchInvite(
		userId
	);
	let sendMatchInvitateResult = await MatchHelper.findAllSendMatchInvite(
		userId
	);
	let receivedTryoutRequest = await TryoutHelper.findAllReceivedTryoutRequest(
		userId
	);
	let sendTryoutRequest = await TryoutHelper.findAllSendTryoutRequest(userId);
	let receivedFlRequest = await FantasyLeagueHelper.findAllReceivedFlRequest(
		userId
	);
	let sendFlRequest = await FantasyLeagueHelper.findAllSendFlRequest(userId);
	let receivedTradeMoveRequest =
		await TradeMoveHelper.findUserReceivedTradeMoveRequest(userId);
	let sendTradeMoveRequest = await TradeMoveHelper.findUserSendTradeMoveRequest(
		userId
	);
	//receive request data
	/// friend request
	if (receivedResult.length > 0) {
		for (let i = 0; i < receivedResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(receivedResult[i].to);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				receivedResult[i].from
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			finalReceivedArr.push({
				requestDetail: receivedResult[i].status,
				fromId: receivedResult[i].from,
				requestFrom: userFromUserName,
				toId: receivedResult[i].to,
				requestTo: userToUserName,
				createdAt: receivedResult[i].createdAt,
				updatedAt: receivedResult[i].updatedAt,
				requestType: friendRequest,
				time: moment(receivedResult[i].createdAt).fromNow(),
			});
		}
	}
	//team invites
	if (receivedTeamInvitesResult.length > 0) {
		for (let i = 0; i < receivedTeamInvitesResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				receivedTeamInvitesResult[i].to
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				receivedTeamInvitesResult[i].from
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let teamDetail = await TeamHelper.findTeamInviteByTeamId(
				receivedTeamInvitesResult[i].teamId
			);
			if (teamDetail == null) {
				console.log("Team not found : ", receivedTeamInvitesResult[i].teamId);
			} else {
				teamName = teamDetail.teamViewName;
				if (teamDetail.teamType == null) {
					teamRequestType = teamRequest;
				} else {
					teamRequestType = franchiseTeamRequest;
				}
			}
			finalReceivedTeamInvArr.push({
				requestDetail: receivedTeamInvitesResult[i].status,
				id: receivedTeamInvitesResult[i].teamId,
				name: teamName,
				fromId: receivedTeamInvitesResult[i].from,
				requestFrom: userFromUserName,
				toId: receivedTeamInvitesResult[i].to,
				requestTo: userToUserName,
				createdAt: receivedTeamInvitesResult[i].createdAt,
				updatedAt: receivedTeamInvitesResult[i].updatedAt,
				requestType: teamRequestType,
				time: moment(receivedTeamInvitesResult[i].createdAt).fromNow(),
			});
		}
	}
	/////match received request
	if (receivedMatchInviteResult.length > 0) {
		for (let i = 0; i < receivedMatchInviteResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				receivedMatchInviteResult[i].challengeTo
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				receivedMatchInviteResult[i].challengeBy
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let credit = (receivedMatchInviteResult[i].prize / 2).toFixed(2);
			finalReceivedMatchInvArr.push({
				requestDetail: receivedMatchInviteResult[i].status,
				id: receivedMatchInviteResult[i]._id, //match Id
				name: receivedMatchInviteResult[i].matchName, //match Name
				fromId: receivedMatchInviteResult[i].challengeBy,
				requestFrom: userFromUserName,
				toId: receivedMatchInviteResult[i].challengeTo,
				requestTo: userToUserName,
				credits: credit,
				createdAt: receivedMatchInviteResult[i].createdAt,
				updatedAt: receivedMatchInviteResult[i].updatedAt,
				requestType: matchRequest,
				time: moment(receivedMatchInviteResult[i].createdAt).fromNow(),
			});
		}
	}
	///tryout request
	// if (receivedTryoutRequest.length > 0) {
	//     for (let i = 0; i < receivedTryoutRequest.length; i++) {
	//         let userToDetail = await UserHelper.foundUserById(receivedTryoutRequest[i].franchiseOwnerId);
	//         let userToUserName = userToDetail.userDetail.userName;
	//         console.log("user Id : ", userId)
	//         let userFromDetail = await UserHelper.foundUserById(receivedTryoutRequest[i].userId);
	//         console.log("userFromDetail : ", userFromDetail)
	//         let userFromUserName = userFromDetail.userDetail.userName
	//         finalReceivedTryoutArr.push({
	//             requestDetail: receivedTryoutRequest[i].status,
	//             fromId: receivedTryoutRequest[i].userId,
	//             requestFrom: userFromUserName,
	//             toId: receivedTryoutRequest[i].franchiseOwnerId,
	//             requestTo: userToUserName,
	//             createdAt: receivedTryoutRequest[i].createdAt,
	//             updatedAt: receivedTryoutRequest[i].updatedAt,
	//             requestType: tryoutRequest,
	//             time: moment(receivedTryoutRequest[i].createdAt).fromNow()
	//         });
	//     }
	// }
	/////Fantasy League (FL) request
	if (receivedFlRequest.length > 0) {
		for (let i = 0; i < receivedFlRequest.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				receivedFlRequest[i].to
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				receivedFlRequest[i].from
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let flname;
			let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				receivedFlRequest[i].fantasyLeagueId
			);
			if (flDetail == null) {
				console.log("FL not found : ", receivedFlRequest[i].fantasyLeagueId);
			} else {
				flName = flDetail.flName;
			}
			finalReceivedFlArr.push({
				requestDetail: receivedFlRequest[i].status,
				id: receivedFlRequest[i].fantasyLeagueId,
				name: flName,
				fromId: receivedFlRequest[i].from,
				requestFrom: userFromUserName,
				toId: receivedFlRequest[i].to,
				requestTo: userToUserName,
				createdAt: receivedFlRequest[i].createdAt,
				updatedAt: receivedFlRequest[i].updatedAt,
				requestType: flRequest,
				time: moment(receivedFlRequest[i].createdAt).fromNow(),
			});
		}
	}
	//trademove
	if (receivedTradeMoveRequest.length > 0) {
		for (let i = 0; i < receivedTradeMoveRequest.length; i++) {
			let fromTeamId;
			let toTeamId;
			let fantasyLeagueId = receivedTradeMoveRequest[i].fantasyLeagueId;
			let fromUserId = receivedTradeMoveRequest[i].fromId;
			let fromUserFlTeam = await FantasyTeamHelper.findFantasyTeamDetailByFlId(
				fantasyLeagueId,
				fromUserId
			);
			if (fromUserFlTeam != null) {
				fromTeamId = fromUserFlTeam._id;
			} else {
				fromTeamId = "";
			}
			let toUserId = receivedTradeMoveRequest[i].toId;
			let toUserFlTeam = await FantasyTeamHelper.findFantasyTeamDetailByFlId(
				fantasyLeagueId,
				toUserId
			);
			if (toUserFlTeam != null) {
				toTeamId = toUserFlTeam._id;
			} else {
				toTeamId = "";
			}
			let userToDetail = await UserHelper.foundUserById(
				receivedTradeMoveRequest[i].toId
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				receivedTradeMoveRequest[i].fromId
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let givePlayerDetail = await UserHelper.foundUserById(
				receivedTradeMoveRequest[i].givePlayerId
			);
			let givePlayerUserName = givePlayerDetail.userDetail.userName;
			let takePlayerDetail = await UserHelper.foundUserById(
				receivedTradeMoveRequest[i].takePlayerId
			);
			let takePlayerUserName = takePlayerDetail.userDetail.userName;
			finalReceivedTradeMoveArr.push({
				requestDetail: receivedTradeMoveRequest[i].approvedStatus,
				fantasyLeagueId: fantasyLeagueId,
				fromTeamId: fromTeamId,
				toTeamId: toTeamId,
				_id: receivedTradeMoveRequest[i]._id,
				fromId: receivedTradeMoveRequest[i].fromId,
				requestFrom: userFromUserName,
				toId: receivedTradeMoveRequest[i].toId,
				requestTo: userToUserName,
				createdAt: receivedTradeMoveRequest[i].createdAt,
				updatedAt: receivedTradeMoveRequest[i].updatedAt,
				requestType: tradeMoveRequest,
				time: moment(receivedTradeMoveRequest[i].createdAt).fromNow(),
			});
		}
	}
	///////////////////////////////////////////Send request data
	//friend request
	if (sendResult.length > 0) {
		for (let i = 0; i < sendResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(sendResult[i].to);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(sendResult[i].from);
			let userFromUserName = userFromDetail.userDetail.userName;
			finalSendArr.push({
				requestDetail: sendResult[i].status,
				fromId: sendResult[i].from,
				requestFrom: userFromUserName,
				toId: sendResult[i].to,
				requestTo: userToUserName,
				createdAt: sendResult[i].createdAt,
				updatedAt: sendResult[i].updatedAt,
				requestType: friendRequest,
				time: moment(sendResult[i].createdAt).fromNow(),
			});
		}
	}
	//team invites
	if (sendTeamInvitesResult.length > 0) {
		for (let i = 0; i < sendTeamInvitesResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				sendTeamInvitesResult[i].to
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				sendTeamInvitesResult[i].from
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let teamDetail = await TeamHelper.findTeamInviteByTeamId(
				sendTeamInvitesResult[i].teamId
			);
			if (teamDetail == null) {
				console.log("Team Not found ", sendTeamInvitesResult[i].teamId);
			} else {
				teamName = teamDetail.teamViewName;
				if (teamDetail.teamType == null) {
					teamRequestType = teamRequest;
				} else {
					teamRequestType = franchiseTeamRequest;
				}
			}
			finalSendTeamInvArr.push({
				requestDetail: sendTeamInvitesResult[i].status,
				id: sendTeamInvitesResult[i].teamId,
				name: teamName,
				fromId: sendTeamInvitesResult[i].from,
				requestFrom: userFromUserName,
				toId: sendTeamInvitesResult[i].to,
				requestTo: userToUserName,
				createdAt: sendTeamInvitesResult[i].createdAt,
				updatedAt: sendTeamInvitesResult[i].updatedAt,
				requestType: teamRequestType,
				time: moment(sendTeamInvitesResult[i].createdAt).fromNow(),
			});
		}
	}
	/////match send request
	if (sendMatchInvitateResult.length > 0) {
		for (let i = 0; i < sendMatchInvitateResult.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				sendMatchInvitateResult[i].challengeTo
			);
			if (userToDetail != null) {
				userToUserName = userToDetail.userDetail.userName;
				let userFromDetail = await UserHelper.foundUserById(
					sendMatchInvitateResult[i].challengeBy
				);
				let userFromUserName = userFromDetail.userDetail.userName;
				let credit = (sendMatchInvitateResult[i].prize / 2).toFixed(2);
				finalSendMatchInvArr.push({
					requestDetail: sendMatchInvitateResult[i].status,
					id: sendMatchInvitateResult[i]._id, //match Id
					name: sendMatchInvitateResult[i].matchName, //match Name
					fromId: sendMatchInvitateResult[i].challengeBy,
					requestFrom: userFromUserName,
					toId: sendMatchInvitateResult[i].challengeTo,
					requestTo: userToUserName,
					credits: credit,
					createdAt: sendMatchInvitateResult[i].createdAt,
					updatedAt: sendMatchInvitateResult[i].updatedAt,
					requestType: matchRequest,
					time: moment(sendMatchInvitateResult[i].createdAt).fromNow(),
				});
			}
		}
	}
	//tryout sent request
	///tryout request
	if (sendTryoutRequest.length > 0) {
		for (let i = 0; i < sendTryoutRequest.length; i++) {
			let userToDetail = await UserHelper.foundUserById(
				sendTryoutRequest[i].franchiseOwnerId
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				sendTryoutRequest[i].userId
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			finalSendTryoutArr.push({
				requestDetail: sendTryoutRequest[i].status,
				fromId: sendTryoutRequest[i].userId,
				requestFrom: userFromUserName,
				toId: sendTryoutRequest[i].franchiseOwnerId,
				requestTo: userToUserName,
				createdAt: sendTryoutRequest[i].createdAt,
				updatedAt: sendTryoutRequest[i].updatedAt,
				requestType: tryoutRequest,
				time: moment(sendTryoutRequest[i].createdAt).fromNow(),
			});
		}
	}
	//send Fantasy League (FL) request
	if (sendFlRequest.length > 0) {
		for (let i = 0; i < sendFlRequest.length; i++) {
			let userToDetail = await UserHelper.foundUserById(sendFlRequest[i].to);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				sendFlRequest[i].from
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let flDetail = await FantasyLeagueHelper.findFantasyLeagueByIdWithDelete(
				sendFlRequest[i].fantasyLeagueId
			);
			if (flDetail == null) {
				console.log("FL not found : ", receivedFlRequest[i].fantasyLeagueId);
			} else {
				flName = flDetail.flName;
			}
			finalSendFlArr.push({
				requestDetail: sendFlRequest[i].status,
				id: sendFlRequest[i].fantasyLeagueId,
				name: flName,
				fromId: sendFlRequest[i].from,
				requestFrom: userFromUserName,
				toId: sendFlRequest[i].to,
				requestTo: userToUserName,
				createdAt: sendFlRequest[i].createdAt,
				updatedAt: sendFlRequest[i].updatedAt,
				requestType: flRequest,
				time: moment(sendFlRequest[i].createdAt).fromNow(),
			});
		}
	}
	//trade move
	if (sendTradeMoveRequest.length > 0) {
		for (let i = 0; i < sendTradeMoveRequest.length; i++) {
			let fromTeamId;
			let toTeamId;
			let fantasyLeagueId = sendTradeMoveRequest[i].fantasyLeagueId;
			let fromUserId = sendTradeMoveRequest[i].fromId;
			let fromUserFlTeam = await FantasyTeamHelper.findFantasyTeamDetailByFlId(
				fantasyLeagueId,
				fromUserId
			);
			if (fromUserFlTeam != null) {
				fromTeamId = fromUserFlTeam._id;
			} else {
				fromTeamId = "";
			}
			let toUserId = sendTradeMoveRequest[i].toId;
			let toUserFlTeam = await FantasyTeamHelper.findFantasyTeamDetailByFlId(
				fantasyLeagueId,
				toUserId
			);
			if (toUserFlTeam != null) {
				toTeamId = toUserFlTeam._id;
			} else {
				toTeamId = "";
			}
			let userToDetail = await UserHelper.foundUserById(
				sendTradeMoveRequest[i].toId
			);
			let userToUserName = userToDetail.userDetail.userName;
			let userFromDetail = await UserHelper.foundUserById(
				sendTradeMoveRequest[i].fromId
			);
			let userFromUserName = userFromDetail.userDetail.userName;
			let givePlayerDetail = await UserHelper.foundUserById(
				sendTradeMoveRequest[i].givePlayerId
			);
			//let givePlayerUserName = givePlayerDetail?.userDetail?.userName;
			let takePlayerDetail = await UserHelper.foundUserById(
				sendTradeMoveRequest[i].takePlayerId
			);
			//let takePlayerUserName = takePlayerDetail?.userDetail?.userName;
			finalSendTradeMoveArr.push({
				requestDetail: sendTradeMoveRequest[i].approvedStatus,
				_id: sendTradeMoveRequest[i]._id,
				fantasyLeagueId: fantasyLeagueId,
				fromTeamId: fromTeamId,
				toTeamId: toTeamId,
				fromId: sendTradeMoveRequest[i].fromId,
				requestFrom: userFromUserName,
				toId: sendTradeMoveRequest[i].toId,
				requestTo: userToUserName,
				createdAt: sendTradeMoveRequest[i].createdAt,
				updatedAt: sendTradeMoveRequest[i].updatedAt,
				requestType: tradeMoveRequest,
				time: moment(sendTradeMoveRequest[i].createdAt).fromNow(),
			});
		}
	}
	// receivedRequestArr = finalReceivedArr.concat(finalReceivedTeamInvArr)
	// receivedTryoutArr = receivedRequestArr.concat(finalReceivedTryoutArr)
	// finalReceivedRequestArr = receivedTryoutArr.concat(finalReceivedMatchInvArr)
	receivedRequestArr = finalReceivedArr.concat(finalReceivedTeamInvArr);
	receivedFlArr = finalReceivedFlArr.concat(receivedRequestArr);
	receiveTradeMoveArr = receivedFlArr.concat(finalReceivedTradeMoveArr);
	finalReceivedRequestArr = receiveTradeMoveArr.concat(
		finalReceivedMatchInvArr
	);
	sendRequestArr = finalSendArr.concat(finalSendTeamInvArr);
	sendTryoutArr = sendRequestArr.concat(finalSendTryoutArr);
	sendFlArr = finalSendFlArr.concat(sendTryoutArr);
	sendTradeMoveArr = sendFlArr.concat(finalSendTradeMoveArr);
	finalSendRequestArr = sendTradeMoveArr.concat(finalSendMatchInvArr);
	///// sorted received and send array
	let sortedReceivedArray = [];
	let sortedSendArray = [];
	if (finalReceivedRequestArr.length > 0) {
		sortedReceivedArray = finalReceivedRequestArr.sort(
			(a, b) => new moment(b.createdAt) - new moment(a.createdAt)
		);
	}
	if (finalSendRequestArr.length > 0) {
		sortedSendArray = finalSendRequestArr.sort(
			(a, b) => new moment(b.createdAt) - new moment(a.createdAt)
		);
	}
	return {
		receivedRequests: sortedReceivedArray,
		sentRequests: sortedSendArray,
	};
};
//// for user profile detail (showUserById and showMyProfile)
exports.userProfielDetailData = async (userId) => {
	let userData = {};
	let userNewDetail = await UserHelper.foundUserById(userId);
	if (userNewDetail == null) {
		console.log("user not found (token/userId incorrect)");
	} else {
		let recentResult = await matchController.matchDataByUserId(userId);
		let matchData = await MatchHelper.findAllMyAcceptedMatches(userId);
		let challengeToMatchResultObj;
		let challengeByMatchResultObj;
		let challengeByResult;
		let challengeToResult;
		let matchObj;
		let i = 0; // for last match data
		if (matchData.length > 0) {
			if (matchData[i].winningUser != null) {
				let matchId = matchData[i]._id;
				let challengeById = matchData[i].challengeBy._id;
				let challengeToId = matchData[i].challengeTo._id;
				let challengeByMatchResult =
					await MatchResultHelper.findUserMatchResultByMatchId(
						challengeById,
						matchId
					);
				if (challengeByMatchResult != null) {
					for (let j = 0; j < challengeByMatchResult.results.length; j++) {
						if (
							challengeByMatchResult.results[j].playerId.toString() ==
							challengeById.toString()
						) {
							challengeByMatchResultObj = challengeByMatchResult.results[j];
						}
					}
					if (challengeByMatchResultObj.result == "pending") {
						challengeByResult = "";
					} else {
						challengeByResult = challengeByMatchResultObj.result;
					}
				}
				let challengeToMatchResult =
					await MatchResultHelper.findUserMatchResultByMatchId(
						challengeToId,
						matchId
					);
				if (challengeToMatchResult != null) {
					for (let k = 0; k < challengeToMatchResult.results.length; k++) {
						if (
							challengeToMatchResult.results[k].playerId.toString() ==
							challengeToId.toString()
						) {
							challengeToMatchResultObj = challengeToMatchResult.results[k];
						}
					}
					if (challengeToMatchResultObj.result == "pending") {
						challengeToResult = "";
					} else {
						challengeToResult = challengeToMatchResultObj.result;
					}
				}
			}
			if (matchData[i].winningUser == null) {
				(challengeByResult = ""), (challengeToResult = "");
			}
			matchObj = {
				_id: matchData[i]._id,
				matchName: matchData[i].matchName,
				challengeBy: {
					userName: matchData[i].challengeBy.userDetail.userName,
					resultStatus: challengeByResult,
				},
				challengeTo: {
					userName: matchData[i].challengeTo.userDetail.userName,
					resultStatus: challengeToResult,
				},
				prize: matchData[i].prize,
				status: matchData[i].status,
				startDate: moment(matchData[i]?.startingDateAndTime).format(
					"MMM DD yyyy"
				),
				startTime: moment(matchData[i]?.startingDateAndTime).format("hh:mm A"),
				matchTitleImage: matchData[i]?.matchTitleImage,
			};
		}
		if (matchData.length == 0) {
			matchObj = {
				_id: "",
				matchName: "",
				challengeBy: {
					userName: "",
					resultStatus: "",
				},
				challengeTo: {
					userName: "",
					resultStatus: "",
				},
				prize: "",
				status: "",
				startDate: "",
				startTime: "",
				matchTitleImage: "",
			};
		}
		let finalFriendArr = [];
		let userFriends = userNewDetail.userDetail.friends;
		if (userFriends.length > 0) {
			for (let k = 0; k < userFriends.length; k++) {
				let friendId = userFriends[k];
				let friendData = await UserHelper.foundUserById(friendId);
				if (friendData != null) {
					let friendObj = {
						_id: friendData._id,
						userName: friendData.userDetail.userName,
						profileImage: friendData.profileImage,
					};
					finalFriendArr.push(friendObj);
				}
			}
		}
		let userType = await franchiseController.getUserFranchiseModeAndFranchiseId(
			userId
		);
		userData = {
			role: userNewDetail.role,
			profileImage: userNewDetail.profileImage,
			backgroundImage: userNewDetail.backgroundImage,
			currentMatch: matchObj,
			userType: userType,
			userDetail: {
				userName: userNewDetail.userDetail.userName,
				fullName: userNewDetail.userDetail.fullName,
				email: userNewDetail.userDetail.email,
				matches: recentResult.matches,
				wins: recentResult.win,
				losses: recentResult.loss,
				winPercentage: recentResult.winPercentage,
				recentResults: recentResult.recentResult,
				friends: userNewDetail.userDetail.friends.length,
				friendsDetail: finalFriendArr,
				credits: userNewDetail.userDetail.credits,
				tags: userNewDetail.userDetail.tags,
				resetPasswordToken: userNewDetail.userDetail.resetPasswordToken,
				resetPasswordExpires: userNewDetail.userDetail.resetPasswordExpires,
				about: userNewDetail.userDetail.about,
			},
			isDeleted: userNewDetail.isDeleted,
			deletedAt: userNewDetail.deletedAt,
			_id: userNewDetail._id,
			createdAt: userNewDetail.createdAt,
			updatedAt: userNewDetail.updatedAt,
		};
	}
	return userData;
};
