const socket = require("socket.io");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const app = require("./app");
const port = process.env.PORT || 4005;
const options = {
    key: fs.existsSync(process.env.SSL_KEY)
        ? fs.readFileSync(process.env.SSL_KEY)
        : null,
    cert: fs.existsSync(process.env.SSL_CRT)
        ? fs.readFileSync(process.env.SSL_CRT)
        : null,
};
const server =
    process.env.MODE == "DEV"
        ? http.createServer(app)
        : http.createServer(options, app);
console.log("Serving on ", port);
const clients = [];
// const io = require("socket.io")(server);
var io = socket(server, {
    cors: {
        origin: "*",
    },
});
//TODO:declare empty aray for add online/active users
let users = [];
//TODO:add online user(userid and socketId) to users array when user connected
const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
    users.push({userId, socketId});
};
//TODO:remove online user(userid and socketId) from users array when user disconnected
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};
//TODO:show online user(userId,socketId) by userId
const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};
//io connection
io.on("connection", (socket) => {
    // console.log("----------------------------------------");
    // console.log("user connected", socket.id);
    //get socketId and userId from user
    //TODO: addUser call for add user to online .....
    socket.on("addUser", (userId) => {
        let senderId = userId.senderId
        // console.log(userId)
        // console.log(senderId)
        // let stringSenderId = senderId.toString()
        addUser(senderId, socket.id);
        //TODO:show all online users after add a user
        io.emit("getUsers", users);
        // console.log("after user online", users)
    });
    //TODO:send and receive msg
    socket.on("sendMessage", async ({senderId, receiverId, text}) => {
        // console.log("uuu", receiverId.toString())
        let stringReceiverId = receiverId.toString()
        // let stringSenderId = senderId.toString()
        //TODO: get conversationId of two(sender and receiver) users
        //
        // let conversationDetail = await conversationController.conversationDetail(stringSenderId, stringReceiverId)
        // console.log(conversationDetail)
        // let conversationId = conversationDetail._id
        //TODO:save msg to DB
        //
        // await ChatMessageHelper.createMessage(conversationId, stringSenderId, text)
        const user = getUser(stringReceiverId);
        console.log("user : ", user)
        //TODO:Emit(recieve msg which was send with sendMessage event
        io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
        });
    });
    //TODO: discount user when goes offline
    socket.on("disconnect", () => {
        // console.log("a user disconnected!");
        //TODO: remove user from users array
        removeUser(socket.id);
        //TODO:show all online users after remove a user
        io.emit("getUsers", users);
        // console.log("after user offline", users)
    });
})
server.listen(port);
