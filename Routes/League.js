const multer = require("multer");
const path = require("path");
// Express Router
const express = require("express");
const router = express.Router();
// Controllers
const LeagueController = require("../Controllers/LeagueController");
const FranchiseController = require("../Controllers/FranchiseController")
//
const {exceptionFunc} = require("../Services/ExceptionHelper")
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
router.get("/league", LeagueController.getLeagueById)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'getLeagueById', 'Backend issue: user-get-league'))
router.get("/schedule", LeagueController.leagueSchedule)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'leagueSchedule', 'Backend issue: user-get-schedule'))
router.get("/standing", LeagueController.leagueStanding)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'leagueStanding', 'Backend issue: user-get-standing'))
router.get("/stats", LeagueController.leagueStats)
// (req, res) => exceptionFunc(req, res)(LeagueController, 'leagueStats', 'Backend issue: user-get-stats'))
module.exports = router;