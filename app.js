const env = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");
//helpers
const ResponseHelper = require("./Services/ResponseHelper");
const ResponseCode = require("./Constants/ResponseCode.js");
const Message = require("./Constants/Message.js");
//edited
// Required Routes
const authRoutes = require("./Routes/Auth");
const adminRoutes = require("./Routes/Admin");
const matchRoutes = require("./Routes/Match");
const teamRoutes = require("./Routes/Team");
const userRoutes = require("./Routes/User");
const tournamentRoutes = require("./Routes/Tournament");
const ladderRoutes = require("./Routes/Ladder");
const gameRoutes = require("./Routes/Game");
const chatMessageRoutes = require("./Routes/ChatMessage");
const conversationRoutes = require("./Routes/Conversation");
const leagueRoutes = require("./Routes/League");
const fantasyLeagueRoutes = require("./Routes/FantasyLeague")
///
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/battleground";
// Connect Mongo DB
mongoose.connect(
    dbUrl,
    {useNewUrlParser: true, useCreateIndex: true},
    (err) => {
        if (!err) {
            console.log("Connection Successful");
        } else {
            console.log("Connection not successful", err);
        }
    }
);
mongoose.Promise = global.Promise;
// Middlewares
app.use(morgan("dev"));
app.use("/Uploads", express.static("Uploads"));
app.use("/Assets", express.static("Assets"));
app.use("/Static", express.static("Static"));
// app.use(express.static(__dirname + '/Assets'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Type, Signature"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});
// Routes which should handle requests
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/tournament", tournamentRoutes);
app.use("/api/ladder", ladderRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/messages", chatMessageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/league", leagueRoutes);
app.use("/api/fantasyleague", fantasyLeagueRoutes)
// Default Route When nothing matches
app.use((req, res, next) => {
    response = ResponseHelper.setResponse(ResponseCode.NOT_FOUND, "API Not found :o :o");
    res.status(response.code).json(response);
    next(res);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});
module.exports = app;
