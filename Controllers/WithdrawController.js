const fs = require("fs");
const moment = require("moment");
// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const PayPalHelper = require("../Services/PaypalHelper");
const UserHelper = require("../Services/UserHelper");
const WithdrawHelper = require("../Services/WithdrawHelper");
const GeneralHelper = require("../Services/GeneralHelper");
const EmailHelper = require("../Services/EmailHelper");
//Controller

// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");
//
const paypal = require("paypal-rest-sdk");
const paypalPayout = require("@paypal/payouts-sdk");
//paypal config
paypal.configure({
	mode: process.env.PAYPAL_MODE, //sandbox or live
	client_id: process.env.PAYPAL_CLIENT_ID,
	client_secret: process.env.PAYPAL_CLIENT_SECRET,
});
let clientId = process.env.PAYPAL_CLIENT_ID;
let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
let environment = new paypalPayout.core.SandboxEnvironment(
	clientId,
	clientSecret
);
let client = new paypalPayout.core.PayPalHttpClient(environment);
//

exports.withdrawRequest = async (req, res, debug = false) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	let paypalToken = await GeneralHelper.paypalToken(clientId, clientSecret);
	request.setHeader = ("Authorization", "Bearer " + paypalToken);
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
			!request.email ||
			!request.fullName ||
			!request.address ||
			!request.amount
		) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		let email = request.email.toLowerCase().trim();
		let fullName = request.fullName.toLowerCase().trim();
		let address = request.address.toLowerCase().trim();
		let amount = parseFloat(request.amount);
		let userData = await UserHelper.foundUserById(userId);
		let userCredits = userData?.userDetail?.credits;
		if (parseFloat(amount) > parseFloat(userCredits)) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.USER_INSUFFICIENT_CREDIT
			);
			return res.status(response.code).json(response);
		}
		let requestBody = await PayPalHelper.buildRequestBody(email, amount);
		try {
			const request = new paypalPayout.payouts.PayoutsPostRequest();
			request.requestBody(requestBody);
			let response = await client.execute(request);
			let header = response.result.batch_header;
			let payout = await PayPalHelper.getPayout(header.payout_batch_id);
			let type = "Credit";
			await WithdrawHelper.createWithdrawRequest(
				userId,
				email,
				fullName,
				address,
				amount,
				type,
				"PENDING",
				header.payout_batch_id
			);
			let credits = parseFloat(userCredits) - parseFloat(amount)
			await UserHelper.updateCredit(userId, credits)
			//for user
			let subject = "Payout - OBG";
			let message = "Withdraw request detail.\n\nAmount : " + amount + "$";
			let replacements = {};
			await EmailHelper.sendEmailToUser(
				email,
				subject,
				message,
				replacements
			);
			//for admin
			let adminSubject = "Withdraw from User - OBG";
			let adminMessage =
				"User " +
				fullName +
				" has request for withdraw.\n\nWithdraw Amount : " +
				amount + "$";
			let adminReplacements = {};
			await EmailHelper.sendEmailToUser(
				process.env.EMAIL,
				adminSubject,
				adminMessage,
				adminReplacements
			);
			res.status(200).send(payout.result);



		} catch (e) {
			if (e.statusCode) {
				//console.log("EEEEE : ", e)
				if (debug) {
					//console.log("Status code: ", e.statusCode);
					//const error = JSON.parse(e.message);
					//console.log("Failure response: ", error);
					//console.log("Headers: ", e.headers);
					//res.status(e.statusCode).send(error);
					res.status(400).send(e);
				}
			} else {
				console.log(e);
			}
		}
	};
};

///
exports.pay = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.body;
	if (!req.headers.authorization) {
		response = ResponseHelper.setResponse(
			ResponseCode.NOT_FOUND,
			Message.TOKEN_NOT_FOUND
		);
		return res.status(response.code).json(response);
	}
	// Get Token
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
			!request.name ||
			!request.sku ||
			!request.price ||
			!request.description
		) {
			response = ResponseHelper.setResponse(
				ResponseCode.NOT_SUCCESS,
				Message.MISSING_PARAMETER
			);
			return res.status(response.code).json(response);
		}
		const create_payment_json = {
			intent: "sale",
			payer: {
				payment_method: "paypal",
			},
			redirect_urls: {
				return_url:
					process.env.FRONT_APP_URL_PRO +
					"/user/transactions/success?userId=" +
					userId,
				cancel_url: process.env.FRONT_APP_URL_PRO + "/user/transactions/cancelled",
			},
			transactions: [
				{
					item_list: {
						items: [
							{
								name: request.name,
								sku: request.sku,
								price: request.price,
								currency: "USD",
								quantity: 1,
							},
						],
					},
					amount: {
						currency: "USD",
						total: request.price,
					},
					description: request.description,
				},
			],
		};
		// console.log(create_payment_json.redirect_urls);
		//////
		let approvalLink;
		paypal.payment.create(create_payment_json, async function (error, payment) {
			if (error) {
				throw error;
			} else {
				// console.log("Create Payment Response");
				// console.log(payment);

				for (let i = 0; i < payment.links.length; i++) {
					if (payment.links[i].rel === "approval_url") {
						approvalLink = payment.links[i].href + "&amount=" + payment.transactions[0].amount.total;
						//console.log("approve link : ", approvalLink);
						res.send(payment.links);
						//res.send(payment);
						//res.redirect(approvalLink);
					}
				}
			}
		});
	}
};

exports.success = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse();
	let request = req.query;
	const payerId = request.PayerID;
	const paymentId = request.paymentId;
	let amount = request.amount
	console.log(payerId, paymentId);
	let userId = request.userId;
	const execute_payment_json = {
		"payer_id": payerId,
		"transactions": [
			{
				"amount": {
					"currency": "USD",
					"total": amount,
				},
			},
		],
	};
	///
	paypal.payment.execute(
		paymentId,
		execute_payment_json,
		async function (error, payment) {
			if (error) {
				// console.log("err : ", error.response);
				// console.log("end");
				response = ResponseHelper.setResponse(
					ResponseCode.FORBIDDEN,
					Message.WENT_WRONG,
					error.response.name
				);
				return res.status(response.code).json(response);
				//throw error;


			} else {
				let userData = await UserHelper.foundUserById(userId);
				let userCredit = userData.userDetail.credits;
				let userEmail = userData.userDetail.email;
				let fullName = userData.userDetail.fullName;
				let address = ".";
				let amount = execute_payment_json.transactions[0].amount.total;

				let finalCredits = parseFloat(userCredit) + parseFloat(amount);

				// console.log("get payment response");
				// console.log(JSON.stringify(payment));
				// console.log("### state : ", payment.state)
				if (payment.state == "approved") {
					let type = "Debit";
					let status = "SUCCESS";
					let transactionId =
						payment.transactions[0].related_resources[0].sale.id;
					let result = await WithdrawHelper.createWithdrawRequest(
						userId,
						userEmail,
						fullName,
						address,
						amount,
						type,
						status,
						transactionId
					);
					await UserHelper.updateCredit(userId, finalCredits);
					//res.send("Success and do extra work");
					response = ResponseHelper.setResponse(
						ResponseCode.SUCCESS,
						Message.REQUEST_SUCCESSFUL,
						result
					);
					return res.status(response.code).json(response);
				} else {
					response = ResponseHelper.setResponse(
						ResponseCode.FORBIDDEN,
						Message.WENT_WRONG
					);
					return res.status(response.code).json(response);
				}
			}
		}
	);
};

exports.cancel = async (req, res) => {
	console.log("here2");
	let response = ResponseHelper.getDefaultResponse();
	response = ResponseHelper.setResponse(
		ResponseCode.NOT_SUCCESS,
		Message.WENT_WRONG
	);
	return res.status(response.code).json(response);
};
exports.showRequests = async (req, res) => {
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
		let pageNo;
		if (request.pageNo) {
			pageNo = request.pageNo;
		}
		if (!request.pageNo) {
			pageNo = 1;
		}
		let result = await WithdrawHelper.getAllRequestWithPagination(pageNo);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL,
			result
		);
		return res.status(response.code).json(response);
	}
};

exports.showUserTransaction = async (req, res) => {
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
		let result = await WithdrawHelper.getUserWithdrawHistory(userId);
		response = ResponseHelper.setResponse(
			ResponseCode.SUCCESS,
			Message.REQUEST_SUCCESSFUL,
			result
		);
		return res.status(response.code).json(response);
	}
};



exports.paypalTransactionWebhook = async (req, res) => {
	let response = ResponseHelper.getDefaultResponse()
	let request = req.body
	//console.log("******* : ", req.body);
	let transactionStatus = request?.resource.transaction_status
	let transactionId = request?.resource.transaction_id
	let payoutBtachId = request?.resource.payout_batch_id
	let timeProcessed = request?.resource.time_processed
	let withdrawDetail = await WithdrawHelper.findWithdrawStatus(payoutBtachId)
	let userId = withdrawDetail?.userId
	let amount = withdrawDetail?.amount
	let userData = await UserHelper.foundUserById(userId)
	let userCredits = userData?.userDetail?.credits;
	if (transactionStatus == "UNCLAIMED") {
		let credits = parseFloat(userCredits) + parseFloat(amount)
		await UserHelper.updateCredit(userId, credits)
	}
	await WithdrawHelper.updateWithdrawStatus(payoutBtachId, transactionId, transactionStatus, timeProcessed)
	response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL)
	return res.status(response.code).json(response);
}