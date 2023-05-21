const socket = require("socket.io");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const app = require("./app");

const conversationController = require("./Controllers/ConversationController")

const PublicConversationHelper = require("./Services/PublicConversationHelper")
const ConversationHelper = require("./Services/ConversationHelper")
const ChatMessageHelper = require("./Services/ChatMessageHelper")
const UserHelper = require("./Services/UserHelper");

const Conversation = require("./Models/Conversation");

const port = process.env.PORT || 4000;
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
//TODO :declare empty aray for add online/active users
let users = [];
let userOffline;

//TODO :add online user(userid and socketId) to users array when user connected
const addUser = async (userId, socketId) => {
	//senderId in json for add
	let userData = await UserHelper.foundUserById(userId.senderId)
	let profileImage = userData?.profileImage
	let userName = userData?.userDetail.userName
	!users.some((user) => user.userId === userId) &&
		users.push({ userId, socketId, profileImage, userName });
};
//TODO :remove online user(userid and socketId) from users array when user disconnected
const removeUser = async (socketId) => {
	userOffline = users.find((user) => user.socketId === socketId);

	//isOnline set to false
	if (typeof userOffline != "undefined") {
		await UserHelper.setUserOnlineStatus(userOffline.userId.senderId, false);
	}
	users = users.filter((user) => user.socketId !== socketId);
};
//TODO :show online user(userId,socketId) by userId
const getUser = (userId) => {
	return users.find((user) => user.userId.senderId === userId);
};
//io connection
io.on("connection", (socket) => {
	//get socketId and userId from user
	//TODO : addUser call for add user to online .....
	console.log("a user connected!");
	socket.on("addUser", async (userId) => {
		let senderId = userId;
		addUser(senderId, socket.id);
		io.emit("getUsers", users);
		//console.log("after add : ", users);
	});
	//TODO:send and receive msg
	socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
		//console.log("new msg : ", { senderId, receiverId, text }); //sender msg
		//	console.log("sender Id : ", senderId);
		let stringSenderId = senderId.toString();
		let stringReceiverId = receiverId.toString();

		let conversationDetail = await conversationController.conversationDetail(
			stringSenderId,
			stringReceiverId
		);
		//
		let conversationId;
		if (conversationDetail == null || conversationDetail.length == 0) {
			console.log("new conversation");
			let newConversationId = await ConversationHelper.addConversation(
				stringSenderId,
				stringReceiverId
			);
			conversationId = newConversationId.toString();
		} else {
			console.log("conversation already exist! - server");
			conversationId = conversationDetail._id;
		}
		//TODO:save msg to DB
		await ChatMessageHelper.createMessage(conversationId, stringSenderId, text, "Private")

		////
		const receiverDetail = getUser(stringReceiverId);
		io.to(receiverDetail.socketId).emit("getMessage", text);
		//console.log(text); // receiver msg
	});
	// public group Message
	socket.on("sendPublicMessage", async ({ senderId, text, conversationMode }) => {
		let publicConversationDetail
		let conversationId
		//check conversation by mode
		publicConversationDetail = await PublicConversationHelper.findConversationByMode(conversationMode)
		//check if not exist then create otherwise send id existing conversation
		// console.log("public conversation from server.js : ", publicConversationDetail);
		if (publicConversationDetail == null) {
			//new public conversation 
			conversationId = await PublicConversationHelper.createPublicConversation()
		} else {
			conversationId = publicConversationDetail._id
		}

		//TODO:save msg to DB
		await ChatMessageHelper.createMessage(conversationId, senderId, text, "Public")

		//TODO:Emit(recieve msg which was send with sendMessage event
		io.emit("getPublicMessage", {
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
});
server.listen(port);
