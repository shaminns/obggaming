const express = require("express");
const router = express.Router();
//Controller
const WithdrawController = require("../Controllers/WithdrawController");
//Model
//for user
router.post("/withdraw-request", WithdrawController.withdrawRequest);
router.post("/pay", WithdrawController.pay);
router.get("/success", WithdrawController.success);
router.get("/cancel", WithdrawController.cancel);
//for admin
router.get("/show-requests", WithdrawController.showRequests);
//webhook api
router.post("/paypal-transaction-webhook", WithdrawController.paypalTransactionWebhook)

//
module.exports = router;
