const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const LeagueController = require("../Controllers/LeagueController");
const FranchiseController = require("../Controllers/FranchiseController");
//
const { exceptionFunc } = require("../Services/ExceptionHelper");
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
router.get("/league", LeagueController.getLeagueById);
router.get("/schedule", LeagueController.leagueSchedule);
router.get("/standing", LeagueController.leagueStanding);
router.get("/stats", LeagueController.leagueStats);
//
module.exports = router;
