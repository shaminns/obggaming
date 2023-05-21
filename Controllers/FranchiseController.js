const mongoose = require("mongoose");
const fs = require("fs");
const moment = require("moment");
//Controller
const TeamContoller = require("../Controllers/TeamController");
// Helpers
const FranchiseHelper = require("../Services/FranchiseHelper");
const UserHelper = require("../Services/UserHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const TeamHelper = require("../Services/TeamHelper");
const TryoutHelper = require("../Services/TryoutHelper");
// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
//
exports.createFranchise = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let teamMemberArr = [];
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
		let userData = await UserHelper.foundUserById(userId);
		let userEmail = userData.userDetail.email;
		let userName = userData.userDetail.userName;
		if (
			!request.franchiseName ||
			!request.occupation ||
			!request.yearlyIncome ||
			!request.address
		) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let franchiseName = request.franchiseName.toLowerCase().trim();
		let userFranchiseDetail = await FranchiseHelper.userFranchise(userId);
		if (userFranchiseDetail != null) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_IN_FRANCHISE
			);
			return res.status(response.code).json(response);
		}
		let franchiseDetailByName =
			await FranchiseHelper.findFranchiseByNameWithoutDelete(franchiseName);
		if (franchiseDetailByName != null) {
			fs.unlinkSync(imagePath);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.ALREADY_EXIST
			);
			return res.status(response.code).json(response);
		}
		if (franchiseDetailByName == null) {
			let allFranchise = await FranchiseHelper.showAllFranchiseWithoutDelete();
			for (let k = 0; k < allFranchise.length; k++) {
				for (let m = 0; m < allFranchise[k].franchiseTeams.length; m++) {
					let teamId = allFranchise[k].franchiseTeams[m];
					let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
					for (let i = 0; i < teamDetail.teamMembers.length; i++) {
						teamMemberArr.push(teamDetail.teamMembers[i].userId.toString());
					}
					if (teamMemberArr.includes(userId.toString())) {
						fs.unlinkSync(imagePath);
						response = ResponseHelper.setResponse(
							ResponseCode.NOT_SUCCESS,
							Message.ALREADY_MEMBER
						);
						return res.status(response.code).json(response);
					} else {
						let teamMemberStringArr =
							await TeamContoller.checkFranchiseTeamMemberDetail(userId); //e,n
						if (teamMemberStringArr.includes("e")) {
							fs.unlinkSync(imagePath);
							response = ResponseHelper.setResponse(
								ResponseCode.NOT_SUCCESS,
								Message.ALREADY_IN_FRANCHISE_TEAM
							);
							return res.status(response.code).json(response);
						}
					}
				}
			}
			let franchiseId = await FranchiseHelper.saveFranchise(
				franchiseName,
				userId,
				userName,
				userEmail,
				request.yearlyIncome,
				request.address,
				request.occupation,
				imagePath
			);
			let franchiseData = await this.franchiseDetailData(userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		}
	}
};
exports.getFranchiseByUserTokenOrFranchiseId = async (req, res) => {
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
		let franchiseData;
		if (req.query.franchiseId) {
			franchiseData = await this.franchiseDetailDataByFranchiseId(
				req.query.franchiseId,
				userId
			);
		}
		if (!req.query.franchiseId) {
			franchiseData = await this.franchiseDetailData(userId);
		}
		console.log("franchiseData feb : ", franchiseData);
		if (Object.keys(franchiseData).length == 0) {
			console.log(
				"*********** Franchise may be either blocked or deleted ************"
			);
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.FRANCHISE_BLOCK_OR_DELETED
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		} else {
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		}
	}
};
exports.showAllFranchiseData = async (req, res) => {
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
		let userData = await UserHelper.foundUserById(userId);
		let userRole = userData.role;
		if (userRole != "Admin") {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_AUTHORIZE,
				Message.NOT_AUTHORIZE_ACTION
			);
			return res.status(response.code).json(response);
		}
		if (userRole == "Admin") {
			let franchiseObjArr = [];
			let franchiseData;
			let pageNo;
			if (request.pageNo) {
				pageNo = request.pageNo;
			}
			if (!request.pageNo) {
				pageNo = 1;
			}
			if (req.query.query) {
				let franchiseName = req.query.query.toLowerCase().trim();
				franchiseData =
					await FranchiseHelper.searchFranchiseByNameWithoutDeleteWithPaginaion(
						franchiseName,
						pageNo
					);
			}
			if (!req.query.query) {
				franchiseData =
					await FranchiseHelper.showAllFranchiseWithoutDeleteWithPagination(
						pageNo
					);
			}
			let franchiseObjData = await this.franchiseObj(franchiseData);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseObjData;
			return res.status(response.code).json(response);
		}
	}
};
exports.approveBlockFranchiseStatus = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let franchiseId;
	let notFranchiseId = [];
	let approveFranchiseId = [];
	let franchiseObjArr = [];
	let franchiseIdArr = request.franchiseId;
	let franchiseObj;
	if ("approvedStatus" in request) {
		for (let i = 0; i < franchiseIdArr.length; i++) {
			franchiseId = franchiseIdArr[i];
			let franchiseBlockStatus =
				await FranchiseHelper.checkFranchiseBlockStatus(franchiseId);
			if (franchiseBlockStatus == null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.UNBLOCK_FRANCHISE_FIRST
				);
				return res.status(response.code).json(response);
			} else {
				let franchiseDetailById =
					await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseId);
				if (franchiseDetailById == null) {
					notFranchiseId.push(franchiseId);
				}
				// if (franchiseDetailById != null) {
				else {
					await FranchiseHelper.updateApproveStatusByFranchiseId(
						franchiseId,
						request.approvedStatus
					);
					approveFranchiseId.push(franchiseId);
				}
			}
		}
		if (notFranchiseId.length != 0) {
			console.log("Records of these ID/s not found : " + notFranchiseId);
		}
	}
	if ("status" in request) {
		franchiseId = request.franchiseId;
		await FranchiseHelper.updateBlockStatusByFranchiseId(
			request.franchiseId,
			request.status
		);
	}
	// let pageNo
	// if (request.pageNo) {
	//     pageNo = request.pageNo
	// }
	// if (!request.pageNo) {
	//     pageNo = 1
	// }
	// let franchiseData = await FranchiseHelper.showAllFranchiseWithoutDeleteWithPagination(pageNo)
	// let franchiseObjData = await this.franchiseObj(franchiseData)
	let franchiseData =
		await FranchiseHelper.findFranchiseByIdWithoutDeleteWithBlock(franchiseId);
	if (franchiseData != null) {
		franchiseObj = {
			_id: franchiseData._id,
			franchiseName: franchiseData.franchiseName,
			franchiseOwner: franchiseData.createdByName,
			totalTeams: franchiseData.franchiseTeams.length,
			occupation: franchiseData.occupation,
			yearlyIncome: franchiseData.yearlyIncome,
			address: franchiseData.address,
			isBlock: franchiseData.isBlock,
			approvedStatus: franchiseData.approvedStatus,
		};
	} else {
		franchiseObj = {};
	}
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	response.franchiseData = franchiseObj;
	return res.status(response.code).json(response);
};
exports.userFranchiseTeamsList = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let teamObjArr = [];
	let teamMemberArr = [];
	let teamIdArr = [];
	let franchiseId;
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
		// let checkUserFranchiseOwner = await FranchiseHelper.userFranchise(userId)
		// if (checkUserFranchiseOwner == null) {
		//     response = ResponseHelper.setResponse(ResponseCode.NOT_SUCCESS, Message.NOT_BELONG_TO_FRANCHISE)
		//     return res.status(response.code).json(response);
		// }
		// if (checkUserFranchiseOwner != null) {
		//     franchiseId = checkUserFranchiseOwner._id
		// }
		let userFanchiseDetail = await this.getUserFranchiseModeAndFranchiseId(
			userId
		);
		let franchiseId = userFanchiseDetail.franchiseId;
		let franchiseDetail = await FranchiseHelper.findFranchiseByIdWithoutDelete(
			franchiseId
		);
		let franchiseIdsArr = await TeamContoller.getFranchiseIdForUser(userId);
		let franchiseTeamsArr = franchiseDetail.franchiseTeams;
		if (franchiseTeamsArr.length > 0) {
			for (let i = 0; i < franchiseTeamsArr.length; i++) {
				let teamId = franchiseTeamsArr[i];
				let teamDetail = await TeamHelper.findTeamDeatilByTeamId(teamId);
				for (let j = 0; j < teamDetail.teamMembers.length; j++) {
					if (teamDetail.teamMembers.length > 0) {
						teamMemberArr.push(teamDetail.teamMembers[j].userId.toString());
					}
				}
				if (teamMemberArr.includes(userId)) {
					teamIdArr.push(teamId);
				}
				teamMemberArr = [];
			}
			if (teamIdArr.length > 0) {
				for (let k = 0; k < teamIdArr.length; k++) {
					let userTeamId = teamIdArr[k];
					let teamData = await TeamHelper.findTeamDeatilByTeamId(userTeamId);
					let teamObj = {
						_id: teamData._id,
						teamTitleImage: teamData.teamTitleImage,
						teamViewName: teamData.teamViewName,
						teamNickName: teamData.teamNickName,
					};
					teamObjArr.push(teamObj);
				}
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.teamData = teamObjArr;
		return res.status(response.code).json(response);
	}
};
exports.updateAboutAndStatus = async (req, res) => {
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
	if (userId != null) {
		if ("about" in request && request.about.length >= 0) {
			let franchiseDetail = await FranchiseHelper.getUserFranchiseDeatil(
				userId
			);
			if (franchiseDetail == null) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.FRANCHISE_NOT_FOUND
				);
				return res.status(response.code).json(response);
			}
			if (franchiseDetail != null) {
				let franchiseId = franchiseDetail._id;
				let about;
				if (request.about.toLowerCase().trim().length >= 1) {
					about = request.about.toLowerCase().trim();
				}
				if (request.about.toLowerCase().trim().length < 1) {
					about = request.about;
				}
				await FranchiseHelper.updateAbout(franchiseId, about);
				let franchiseData = await this.franchiseDetailData(userId);
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.REQUEST_SUCCESSFUL
				);
				response.franchiseData = franchiseData;
				return res.status(response.code).json(response);
			}
		}
		if (request.status) {
			await FranchiseHelper.updateFranchiseStatus(userId, request.status);
			let franchiseData = await this.franchiseDetailData(userId);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			response.franchiseData = franchiseData;
			return res.status(response.code).json(response);
		}
	}
};
exports.allFranchise = async (req, res) => {
	let franchiseObjArr = [];
	let franchiseData;
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
	if (userId != null) {
		if (!req.query.franchiseStatus) {
			franchiseData =
				await FranchiseHelper.showAllFranchiseWithoutDeleteAndBlock();
		}
		if (req.query.franchiseStatus) {
			if (req.query.franchiseStatus.toLowerCase() == "all") {
				franchiseData =
					await FranchiseHelper.showAllFranchiseWithoutDeleteAndBlock();
			} else {
				franchiseData =
					await FranchiseHelper.franchiseByStatusWithoutDeleteAndBlock(
						req.query.franchiseStatus.toLowerCase()
					);
			}
		}
		if (franchiseData.length > 0) {
			for (let i = 0; i < franchiseData.length; i++) {
				let franchiseObj = {
					_id: franchiseData[i]._id,
					franchiseTitleImage: franchiseData[i].franchiseTitleImage,
					franchiseStatus: franchiseData[i].franchiseStatus,
					franchiseName: franchiseData[i].franchiseName,
					totalTeams: franchiseData[i].franchiseTeams.length,
					owner: franchiseData[i].createdByName,
				};
				franchiseObjArr.push(franchiseObj);
			}
		}
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		response.franchiseData = franchiseObjArr;
		return res.status(response.code).json(response);
	}
};
///////////////////////////////////////////////////////////////////////////////////////////////
/////// use with in Franchise Controller and Team Controller (create [franchise] team response)
exports.franchiseDetailData = async (userId) => {
	console.log("user id : ", userId);
	let franchiseTeamsData;
	let tryout;
	let franchiseObj;
	let userFranchiseDetail = await FranchiseHelper.userFranchise(userId);
	console.log("user franchise detail : ", userFranchiseDetail);
	if (userFranchiseDetail == null) {
		franchiseObj = {};
	} else {
		let formattedCreatedDate = moment(userFranchiseDetail.createdAt).format(
			"MMMM DD, yyyy"
		);
		let franchiseId = userFranchiseDetail._id;
		let franchiseTeams = await TeamHelper.findFranchiseTeamWithoutDeleted(
			franchiseId
		);
		let tryoutRequestCheck = await TryoutHelper.findSentRequest(userId);
		if (tryoutRequestCheck == null) {
			tryout = "";
		}
		if (tryoutRequestCheck != null) {
			tryout = "sent";
		}
		if (franchiseTeams.length == 0) {
			franchiseTeamsData = [];
		}
		// if (franchiseTeams.length > 0) {
		else {
			franchiseTeamsData = await TeamContoller.myTeamsData(franchiseTeams);
		}
		franchiseObj = {
			franchiseTitleImage: userFranchiseDetail.franchiseTitleImage,
			about: userFranchiseDetail.about,
			franchiseStatus: userFranchiseDetail.franchiseStatus,
			franchiseTeams: franchiseTeamsData,
			isDeleted: userFranchiseDetail.isDeleted,
			deletedAt: userFranchiseDetail.deletedAt,
			tryout: tryout,
			_id: userFranchiseDetail._id,
			franchiseName: userFranchiseDetail.franchiseName,
			createdDate: formattedCreatedDate,
			createdBy: {
				name: userFranchiseDetail.createdByName,
				_id: userFranchiseDetail.createdBy,
			},
			totalTeams: franchiseTeams.length,
			matches: 0,
			win: 0,
			loss: 0,
			winPercentage: 0 + "%",
			yearlyIncome: userFranchiseDetail.yearlyIncome,
			occupation: userFranchiseDetail.occupation,
			isBlock: userFranchiseDetail.isBlock,
			blockAt: userFranchiseDetail.blockAt,
			approvedStatus: userFranchiseDetail.approvedStatus,
			createdAt: userFranchiseDetail.createdAt,
			updatedAt: userFranchiseDetail.updatedAt,
		};
	}
	return franchiseObj;
};
// get franchise detail by franchiseId
exports.franchiseDetailDataByFranchiseId = async (franchiseId, userId) => {
	let franchiseTeamsData;
	let franchiseObj;
	let tryout;
	let tryoutRequestCheck = await TryoutHelper.findSentRequest(
		franchiseId,
		userId
	);
	if (tryoutRequestCheck == null) {
		tryout = "";
	}
	if (tryoutRequestCheck != null) {
		tryout = "sent";
	}
	let userFranchiseDetail =
		await FranchiseHelper.findFranchiseByIdWithoutDelete(franchiseId);
	if (userFranchiseDetail == null) {
		franchiseObj = {};
	} else {
		let formattedCreatedDate = moment(userFranchiseDetail.createdAt).format(
			"MMMM DD, yyyy"
		);
		let franchiseTeams = await TeamHelper.findFranchiseTeamWithoutDeleted(
			franchiseId
		);
		if (franchiseTeams.length > 0) {
			franchiseTeamsData = await TeamContoller.myTeamsData(franchiseTeams);
		}
		if (franchiseTeams.length == 0) {
			franchiseTeamsData = [];
		}
		franchiseObj = {
			franchiseTitleImage: userFranchiseDetail.franchiseTitleImage,
			about: userFranchiseDetail.about,
			franchiseStatus: userFranchiseDetail.franchiseStatus,
			franchiseTeams: franchiseTeamsData,
			isDeleted: userFranchiseDetail.isDeleted,
			deletedAt: userFranchiseDetail.deletedAt,
			tryout: tryout,
			_id: userFranchiseDetail._id,
			franchiseName: userFranchiseDetail.franchiseName,
			createdDate: formattedCreatedDate,
			createdBy: {
				name: userFranchiseDetail.createdByName,
				_id: userFranchiseDetail.createdBy,
			},
			totalTeams: franchiseTeams.length,
			matches: 0,
			win: 0,
			loss: 0,
			winPercentage: 0 + "%",
			yearlyIncome: userFranchiseDetail.yearlyIncome,
			occupation: userFranchiseDetail.occupation,
			isBlock: userFranchiseDetail.isBlock,
			blockAt: userFranchiseDetail.blockAt,
			approvedStatus: userFranchiseDetail.approvedStatus,
			createdAt: userFranchiseDetail.createdAt,
			updatedAt: userFranchiseDetail.updatedAt,
		};
	}
	return franchiseObj;
};
///object for admin data (array)
exports.franchiseObj = async (franchiseData) => {
	let franchiseObjArr = [];
	if (franchiseData.data.length > 0) {
		for (let i = 0; i < franchiseData.data.length; i++) {
			let franchiseObj = {
				_id: franchiseData.data[i]._id,
				franchiseName: franchiseData.data[i].franchiseName,
				franchiseOwner: franchiseData.data[i].createdByName,
				totalTeams: franchiseData.data[i].franchiseTeams.length,
				occupation: franchiseData.data[i].occupation,
				yearlyIncome: franchiseData.data[i].yearlyIncome,
				address: franchiseData.data[i].address,
				isBlock: franchiseData.data[i].isBlock,
				approvedStatus: franchiseData.data[i].approvedStatus,
			};
			franchiseObjArr.push(franchiseObj);
		}
	}
	let pagination = franchiseData.pagination;
	return { ...pagination, data: franchiseObjArr };
};
/////get user franchise team
exports.getUserFranchiseTeam = async (userId) => {
	let userParticipatingFranchiseTeamDetail =
		await TeamHelper.findUserFranchiseTeam(userId);
	return userParticipatingFranchiseTeamDetail;
};
//get user franchise id
exports.getUserUserFrachise = async (teamId) => {
	let userFranchiseDetail = await FranchiseHelper.findUserFranchiseByTeamId(
		teamId
	);
	return userFranchiseDetail;
};
//get userType (mode and franchiseId)
exports.getUserFranchiseModeAndFranchiseId = async (userId) => {
	let mode;
	let franchiseId;
	let userFranchiseOwnerCheck = await FranchiseHelper.getUserFranchiseDeatil(
		userId
	);
	let userFranchiseTeamDetail = await this.getUserFranchiseTeam(userId);
	if (userFranchiseOwnerCheck != null) {
		franchiseId = userFranchiseOwnerCheck._id;
		mode = "fOwner";
	}
	if (userFranchiseOwnerCheck == null && userFranchiseTeamDetail != null) {
		let userFranchiseDetail = await this.getUserUserFrachise(
			userFranchiseTeamDetail._id
		);
		franchiseId = userFranchiseDetail._id;
		mode = "fMember";
	}
	if (userFranchiseOwnerCheck == null && userFranchiseTeamDetail == null) {
		franchiseId = null;
		mode = "simpleUser";
	}
	let userType = {
		mode: mode,
		franchiseId: franchiseId,
	};
	return userType;
};
