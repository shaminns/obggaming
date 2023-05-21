const mongoose = require("mongoose");
const tournamentScheduleSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		id: { type: Number }, //id for schedule (front-end)
		roundNumber: { type: Number },
		nextMatchId: { type: Number, default: 0 },
		nextLooserMatchId: { type: Number, default: 0 },
		rowNumber: { type: Number },
		scheduleType: { type: String }, //round, playoff or final
		randomMatchId: { type: String },
		//
		tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
		teamOne: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
		teamTwo: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },

		winner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			default: null,
		},
		//
		isDeleted: { type: Boolean, default: false },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);
module.exports = mongoose.model("TournamentSchedule", tournamentScheduleSchema);
