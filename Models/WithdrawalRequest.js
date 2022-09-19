const mongoose = require("mongoose");
const withdrawalRequestSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        userName: {type: String, required: true},
        accountType: {type: String, required: true},
        accountNumber: {type: Number, required: true},
        withdrawalCoins: {type: Number, required: true},
        status: {type: String, default: "pending"},
        //
        isDeleted: {type: Boolean, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
