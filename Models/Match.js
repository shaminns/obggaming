const mongoose = require("mongoose");
const matchSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		matchName: {type: String},
		matchTitleImage: {type: String, required: true},
		platform: {type: String, required: true},
		startingDateAndTime: {type: String},
		prize: {type: Number, required: true},
		status: {type: String, default: "pending"},
		matchRules: {type: String, default: ""},
		//
		gameToPlay: {type: mongoose.Schema.Types.ObjectId, ref: "Game"},
		challengeBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
		challengeTo: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
		winningUser: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
		//
		isDeleted: {type: Boolean, required: true, default: false},
		deletedAt: {type: Date, default: null},
	},
	{timestamps: true}
);
module.exports = mongoose.model("Match", matchSchema);