const mongoose = require("mongoose");
const tournamentSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		tournamentName: { type: String, required: true },
		tournamentTitleImage: { type: String, default: "", required: true },
		entryFee: { type: Number, required: true },
		prize: { type: Number, required: true },
		teamSize: { type: Number, required: true }, //size of each team for check criteria
		totalTeams: { type: Number, default: 1 }, //No of Maximum teams that can play
		startingDateAndTime: { type: String, required: true },
		tournamentType: { type: String, default: "general" },
		//
		gameToPlay: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
		participatingTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
		winningTeam: {
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
module.exports = mongoose.model("Tournament", tournamentSchema);
