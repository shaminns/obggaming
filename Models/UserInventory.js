const mongoose = require("mongoose");
const userInventorySchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        //
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        //
        isDeleted: { type: Boolean, required: true, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);
module.exports = mongoose.model("UserInventory", userInventorySchema);