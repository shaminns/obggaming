const mongoose = require("mongoose");
const playerTournamentPointsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		points: { type: Number, default: 0 },
		roundNumber: { type: Number },
		scheduleType: { type: String },
		//
		tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
		playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		//
		isDeleted: { type: Boolean, default: false },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);
module.exports = mongoose.model(
	"PlayerTournamentPoints",
	playerTournamentPointsSchema
);
