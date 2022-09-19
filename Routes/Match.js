const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
const fs = require("fs");
// Controllers
const MatchController = require("../Controllers/MatchController");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
//
var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "Uploads/MatchImages/");
	},
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
//will be using this for uploading
const upload = multer({storage: storage});
// Routes
module.exports = router;
