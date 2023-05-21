const mongoose = require("mongoose");
const tournamentResultSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		tournamentName: { type: String },
		roundNumber: { type: Number, default: 1 },
		score: { type: String },
		submissionDate: { type: String },
		resultVideo: { type: String },
		resultType: { type: String, default: "" },
		result: { type: String, default: "pending" },
		scheduleType: { type: String, default: "" },
		matchId: { type: String },
		killPoints: { type: Number, default: 0 },
		placePoints: { type: Number, default: 0 },
		teamViewName: { type: String, default: "" },
		gameName: { type: String, default: "" },
		tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
		teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
		gameToPlay: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
		submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		playerResults: [
			{
				userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				killPoints: { type: Number, default: 0 },
			},
		],
		// killPoints: {type: Number, default: 0},
		//
		// resultType: {type: mongoose.Schema.Types.ObjectId, ref: "Franchise", default: null},
		//
		isDeleted: { type: Boolean, default: false },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);
module.exports = mongoose.model("TournamentResult", tournamentResultSchema);
