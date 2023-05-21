const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		password: {type: String, required: true},
		profileImage: {type: String, default: ""},
		backgroundImage: {type: String, default: ""},
		userDetail: {type: Object, default: null},
		role: {type: String, required: true, default: "User"},
		userToken: {type: String, default: null},
		userPoints: {type: Number, default: 0},
		isOnline: {type: Boolean, default: false},
		//
		isDeleted: {type: Boolean, default: false},
		deletedAt: {type: Date, default: null},
	},
	{timestamps: true},
	{strict: false}
);
module.exports = mongoose.model("User", userSchema);
