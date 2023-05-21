const mongoose = require("mongoose");
const inventorySchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        name: { type: String, default: "" },
        link: { type: String, default: "" },
        //
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Inventory", inventorySchema);