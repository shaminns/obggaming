const mongoose = require("mongoose");
const withdrawSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		email: { type: String, required: true },
		amount: { type: Number, required: true },
		type: { type: String, required: true },
		payoutBatchId: { type: String, default: "" },
		status: { type: String, default: "Pending" },
		fullName: { type: String, required: true },
		address: { type: String, required: true },
		transactionId: { type: String, default: "" },
		timeProcessed: { type: String, default: "" },
		//
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		//
		isDeleted: { type: Boolean, default: false },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);
module.exports = mongoose.model("Withdraw", withdrawSchema);
