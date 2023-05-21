const mongoose = require("mongoose");
const gameSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		gameName: {type: String, required: true},
		gameImage: {type: String, default: ""},
		platforms: [{type: String, required: true}],
		uploadedDate: {type: Date, default: Date.now()},
		gameType: {type: String, default: "user"},//"franchise" user for franchise games
		//
		isDeleted: {type: Boolean, required: true, default: false},
		deletedAt: {type: Date, default: null},
	},
	{timestamps: true}
);
module.exports = mongoose.model("Game", gameSchema);
