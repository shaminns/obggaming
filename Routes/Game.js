const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const GameController = require("../Controllers/GameController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
//
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/GameImages/");
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
router.post("/game", upload.single("gameImage"), GameController.addGame);
router.put("/game", upload.single("gameImage"), GameController.editGame);
router.post("/deleteGame", GameController.deleteGame);
router.get("/game", GameController.showGames);

//for developer
router.get("/allGames", GameController.getAllGameFromDb);
module.exports = router;
