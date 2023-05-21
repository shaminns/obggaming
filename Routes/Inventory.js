const multer = require("multer");
const path = require("path");

// Express Router
const express = require("express");
const router = express.Router();

// Controllers
const InventoryController = require("../Controllers/InventoryController");


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "Uploads/Inventory/");
    },
    filename: (req, file, cb) => {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});
//will be using this for uplading
const upload = multer({ storage: storage });
// Routes
router.post("/add", upload.single("inventory"), InventoryController.add)
router.post("/update", upload.single("inventory"), InventoryController.update)
router.post("/delete", InventoryController.delete)
router.get("/list", InventoryController.list)
router.post("/add-to-user", InventoryController.addToUser)
//
module.exports = router;
