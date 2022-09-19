const express = require("express");
const router = express.Router();
//Controller
const LadderController = require("../Controllers/LadderController");
const Ladder = require("../Models/Ladder");
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
//CRUD in admin routes
module.exports = router;
