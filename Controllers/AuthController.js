const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");
// Models
const User = require("../Models/User");
// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
// Helpers
const GeneralHelper = require("../Services/GeneralHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const CredentialHelper = require("../Services/CredentialHelper");
const TokenHelper = require("../Services/TokenHelper");
const EmailHelper = require("../Services/EmailHelper");
const AdminHelper = require("../Services/AdminHelper");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
const atob = require("atob");
const FantasyTeamHelper = require("../Services/FantasyTeamHelper");
const FantasyLeagueHelper = require("../Services/FantasyLeagueHelper");
exports.createAdmin = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!request.fullName || !request.email || !request.password) {
		let response = await ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	if (request.fullName) {
		resultCheck = CredentialHelper.fullNameCheck(request.fullName);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_FULL_NAME
			);
			return res.status(response.code).json(response);
		}
	}
	if (request.password) {
		resultCheck = CredentialHelper.passwordCheck(request.password);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_PASSWORD
			);
			return res.status(response.code).json(response);
		}
	}
	if (request.email) {
		resultCheck = CredentialHelper.emailCheck(request.email);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_EMAIL
			);
			return res.status(response.code).json(response);
		}
		let email = request.email.toLowerCase();
		let user = await UserHelper.foundUserByEmail(email);
		if (user != null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.EMAIL_NOT_EXIST
			);
			return res.status(response.code).json(response);
		}
	}
	let password = await GeneralHelper.bcryptPassword(request.password);
	let userDetail = {
		userName: "",
		fullName: request.fullName.toLowerCase(),
		email: request.email.toLowerCase(),
		friends: [],
		credits: 0,
		tags: [],
		resetPasswordToken: null,
		resetPasswordExpires: null,
		about: request.about || "",
	};
	let admin = await AdminHelper.createAdmin(
		request.email.toLowerCase(),
		request.fullName,
		password,
		userDetail
	);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		admin
	);
	return res.status(response.code).json(response);
};
exports.createUser = async (req, res, next) => {
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
	if (request.fullName) {
		resultCheck = CredentialHelper.fullNameCheck(fullName);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_FULL_NAME
			);
			return res.status(response.code).json(response);
		}
	}
	if (request.userName) {
		resultCheck = CredentialHelper.userNameCheck(userName);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_USERNAME
			);
			return res.status(response.code).json(response);
		}
	}
	if (request.password) {
		resultCheck = CredentialHelper.passwordCheck(request.password);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_PASSWORD
			);
			return res.status(response.code).json(response);
		}
	}
	if (request.email) {
		resultCheck = CredentialHelper.emailCheck(email);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_EMAIL
			);
			return res.status(response.code).json(response);
		}
		let user = await UserHelper.foundUserByEmail(email);
		if (user != null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.EMAIL_EXIST
			);
			return res.status(response.code).json(response);
		}
	}
	let userDetailByUserName = await UserHelper.foundUserByUserNameWithoutDeleted(
		userName
	);
	if (userDetailByUserName != null) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.USERNAME_EXIST
		);
		return res.status(response.code).json(response);
	}
	let password = await GeneralHelper.bcryptPassword(request.password);
	let userDetail = {
		userName: userName,
		fullName: fullName,
		email: email,
		friends: [],
		credits: 50,
		tags: [],
		resetPasswordToken: null,
		resetPasswordExpires: null,
		about: request.about || "",
	};
	let userId = await UserHelper.createUser(password, userDetail, request);
	///welcome email
	let subject = "Welcome To OnlineBattleGround (OBG)";
	let message = ".";
	const replacements = {
		link: "go.onlinebattleground.com", // hard code because env update issue
		userName: userName.toUpperCase(),
		appName: process.env.APP_NAME,
		mailFrom: process.env.MAIL_FROM,
	};
	EmailHelper.sendEmail(email, subject, message, "welcome", replacements);
	////
	let user = await UserHelper.foundUserById(userId);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL,
		user
	);
	return res.status(response.code).json(response);
};
exports.login = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	if (!(request.email && request.password)) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.MISSING_PARAMETER
		);
		return res.status(response.code).json(response);
	}
	if (request.email) {
		resultCheck = CredentialHelper.emailCheck(
			request.email.toLowerCase().trim()
		);
		if (resultCheck === false) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_EMAIL
			);
			return res.status(response.code).json(response);
		}
		let email = request.email.toLowerCase();
		let user = await UserHelper.foundUserByEmail(email);
		if (user == null) {
			let response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.EMAIL_NOT_EXIST
			);
			return res.status(response.code).json(response);
		}
		let userPassword = request.password;
		bcrypt.compare(userPassword, user.password, async (err, result) => {
			if (err) {
				response = ResponseHelper.setResponse(
					ResponseCode.NOT_SUCCESS,
					Message.INVALID_PASSWORD
				);
				return res.status(response.code).json(response);
			}
			if (!result) {
				response = ResponseHelper.setResponse(
					ResponseCode.FORBIDDEN,
					Message.WRONG_PASSWORD
				);
				return res.status(response.code).json(response);
			}
			if (result) {
				const token = jwt.sign(
					{
						email: user.userDetail.email,
						id: user._id,
						role: user.role,
					},
					process.env.JWT_SECRET,
					{
						expiresIn: "24h",
					}
				);
				let result = {
					_id: user._id,
					role: user.role,
					email: user.userDetail.email,
					fullName: user.userDetail.fullName,
					profileImage: user.profileImage,
				};
				await UserHelper.updateUserToken(user._id, token);
				if (token) {
					try {
						jwt.verify(token, process.env.JWT_SECRET);
					} catch (err) {
						return null;
					}
				}
				response = ResponseHelper.setResponse(
					ResponseCode.SUCCESS,
					Message.LOGIN_SUCCESS,
					result
				);
				// Only For Login API
				response.token = token;
				return res.status(response.code).json(response);
			}
		});
	}
};
exports.forgot = async (req, res, next) => {
	let request = req.body;
	let response = ResponseHelper.getDefaultResponse();
	let userEmail = request.email.toLowerCase();
	let subject = "Password Reset Request.";
	let message = ".";
	const foundUser = await UserHelper.foundUserByEmail(userEmail);
	if (foundUser == null) {
		let response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.EMAIL_NOT_EXIST
		);
		return res.status(response.code).json(response);
	}
	const forgotToken = await TokenHelper.tokenCreater(userEmail);
	const FRONT_APP_URL = GeneralHelper.getFrontAppResetUrl();
	const link = `${FRONT_APP_URL}/${foundUser._id}`;
	const BACK_APP_URL = GeneralHelper.getBackAppUrl();
	const decoded = jwt.verify(forgotToken, process.env.JWT_SECRET);
	let tokenExpiry = decoded.exp * 1000;
	let isoTokenExpiry = new Date(tokenExpiry);
	await UserHelper.updateResetForgotPasswordToken(
		request,
		forgotToken,
		isoTokenExpiry
	);
	const replacements = {
		link: "go.onlinebattleground.com/auth/reset/" + foundUser._id, // hard code because env update issue
		appName: process.env.APP_NAME,
		mailFrom: process.env.MAIL_FROM,
	};
	EmailHelper.sendEmail(
		userEmail,
		subject,
		message,
		"forgot-password-new",
		replacements
	);
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.reset = async (req, res, next) => {
	let response = ResponseHelper.getDefaultResponse();
	const request = req.body;
	const id = req.body.userId;
	let user = await UserHelper.foundUserById(id);
	let tokenExpiry = user.userDetail.resetPasswordExpires;
	let expiryTime = moment(tokenExpiry).format("DD/MM/YYYY HH:mm");
	let currentTime = await moment().format("DD/MM/YYYY HH:mm");
	let timeDifference = await moment(expiryTime).isAfter(currentTime);
	if (timeDifference == false) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_SUCCESS,
			Message.NEW_REQUEST_EXPIRED
		);
		return res.status(response.code).json(response);
	}
	if (timeDifference == true) {
		if (request.newPassword !== request.confirmPassword) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.INVALID_PASSWORD
			);
			return res.status(response.code).json(response);
		}
		const password = await GeneralHelper.bcryptPassword(request.newPassword);
		await UserHelper.updateUserAndToken(res, id, password);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		return res.status(response.code).json(response);
	}
};
exports.change = async (req, res, next) => {
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

		if (
			!request.oldPassword ||
			!request.userPassword ||
			!request.confirmUserPassword
		) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}

		let oldPassword = request.oldPassword;
		let userPassword = request.userPassword;
		let confirmUserPassword = request.confirmUserPassword;

		let user = await UserHelper.foundUserById(userId);
		let matched = await GeneralHelper.comparePassword(oldPassword, user.password);
		if (!matched) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.OLD_PASSWORD_NOT_MATCH
			);
			return res.status(response.code).json(response);
		}
		if (userPassword != confirmUserPassword) {
			response = await ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.PASSWORD_NOT_MATCH
			);
			return res.status(response.code).json(response);
		} else {
			const password = await GeneralHelper.bcryptPassword(userPassword);
			await UserHelper.updateUserPasswordByUserId(userId, password);
			response = ResponseHelper.setResponse(
				ResponseCode.SUCCESS,
				Message.REQUEST_SUCCESSFUL
			);
			return res.status(response.code).json(response);
		}
	}
};
exports.logoutAndRemoveToken = async (req, res) => {
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
		await UserHelper.updateUserToken(userId, null);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		return res.status(response.code).json(response);
	}
};
exports.contactUsSend = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let senderEmail = request.senderEmail;
	let emailSubject = request.subject;
	let msgBody = request.msgBody;
	//send mail
	let subject = emailSubject + " - OnlineBattleGround (OBG)";
	let message = msgBody + " \n\nSent by : " + senderEmail;
	let receiverEmail = process.env.EMAIL;
	const replacements = {
		link: process.env.FRONT_APP_URL_PRO,//"go.onlinebattleground.com", // hard code because env update issue
		appName: process.env.APP_NAME,
		mailFrom: senderEmail,
	};
	EmailHelper.sendSimpleEmail(receiverEmail, subject, message, replacements);
	//
	response = ResponseHelper.setResponse(
		ResponseCode.SUCCESS,
		Message.REQUEST_SUCCESSFUL
	);
	return res.status(response.code).json(response);
};
exports.reportIssue = async (req, res) => {
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
		if (!request.subject || !request.msgBody) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let userData = await UserHelper.foundUserById(userId)
		//console.log("user detail : ", userData);
		let userEmail = userData?.userDetail?.email
		let userFullName = userData?.userDetail?.fullName
		let userName = userData?.userDetail?.userName
		let emailSubject = request.subject;
		let msgBody = request.msgBody;
		//send mail
		let subject = emailSubject + " - OnlineBattleGround (OBG)";
		let message = msgBody + " \n\nSent by : " + userEmail + " (" + userFullName + " - " + userName + ").";
		let receiverEmail = process.env.SUPPORT_EMAIL;
		const replacements = {
			link: process.env.FRONT_APP_URL_PRO,
			appName: process.env.APP_NAME,
			mailFrom: userEmail,
		};
		EmailHelper.sendEmailToUser(receiverEmail, subject, message, replacements);
		//
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL
		);
		return res.status(response.code).json(response);
	}
};
