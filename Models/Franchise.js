const mongoose = require("mongoose");
const franchiseSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        franchiseName: {type: String, required: true},
        franchiseTitleImage: {type: String, default: ""},
        yearlyIncome: {type: String, required: true},
        occupation: {type: String},
        email: {type: String},
        address: {type: String, default: ""},
        about: {type: String, default: ""},
        franchiseStatus: {type: String, default: "none"},
        createdByName: {type: String},
        isBlock: {type: Boolean, default: false},
        blockAt: {type: Date, default: null},
        approvedStatus: {type: String, default: "pending"},
        //
        createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        franchiseTeams: [{type: mongoose.Schema.Types.ObjectId, ref: "Team"}],
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("Franchise", franchiseSchema);
