const mongoose = require("mongoose");
const ladderSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		ladderName: { type: String, required: true },
		ladderTitleImage: { type: String, default: "" },
		entryFee: { type: Number, required: true },
		prize: { type: Number, required: true },
		teamSize: { type: Number, required: true }, //size of each team for check criteria
		totalTeams: { type: Number, default: 1 }, //No of Maximum teams that can play
		startingDateAndTime: { type: String, required: true },
		endingDateAndTime: { type: String, required: true },
		ladderType: { type: String, default: "Open" },
		//
		gameToPlay: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
		participatingTeams: [
			{
				teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
				ladderTeamResult: { type: Object },
			},
		],
		//
		isDeleted: { type: Boolean, default: false },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);
module.exports = mongoose.model("Ladder", ladderSchema);
