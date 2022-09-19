const mongoose = require("mongoose");
const creditSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        gemsPackageName: {type: String, required: true},
        gemsIcon: {type: String, required: true},
        gemsQuantity: {type: Number, required: true},
        gemsPrice: {type: String, required: true},
        //
        isDeleted: {type: Boolean, required: true, default: false},
        deletedAt: {type: Date, default: null},
    },
    {timestamps: true}
);
module.exports = mongoose.model("Credit", creditSchema);
