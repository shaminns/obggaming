const moment = require("moment");
// Mongoose
const mongoose = require("mongoose");
//Helpers
const GeneralHelper = require("../Services/GeneralHelper");
//Models
const User = require("../Models/User");
const FriendRequest = require("../Models/FriendRequests");
const WithdrawalRequest = require("../Models/WithdrawalRequest");
const Franchise = require("../Models/Franchise");
const FantasyLeagueSchedule = require("../Models/FantasyLeagueSchedule");
//////for dev only/////////////////////////////////////////////
/// delete(hard) user by email ////////////////////////////////
exports.deleteUser = async (email) => {
    await User.deleteOne({"userDetail.email": email})
}
/// delete(hard) user by Id ////////////////////////////////
exports.deleteUserById = async (id) => {
    await User.deleteOne({_id: id})
}
/////// //////////////////////////////////////////////////////
exports.foundUserByEmail = async (email) => {
    return await User.findOne(
        {"userDetail.email": email, isDeleted: false},
        {
            "userDetail.resetPasswordToken": 0,
            "userDetail.resetPasswordExpires": 0,
        }
    );
};
exports.findUserByUserName = async (userName) => {
    return await User.findOne({"userDetail.userName": userName});
};
exports.createUser = async (password, userDetail, request) => {
    let role = "User";
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        password: password,
        role: role,
        profileImage: "",
        backgroundImage: "",
        userDetail: userDetail,
    });
    await user.save();
    return user._id
};
exports.updateUserToken = async (_id, token) => {
    return await User.updateOne({_id: mongoose.Types.ObjectId(_id)}, {$set: {userToken: token}})
}
exports.alUsersList = async () => {
    return await User.find({role: "User"});
};
exports.alUsersListForDashboard = async () => {
    return await User.find({role: "User", isDeleted: false}, {userToken: 1, _id: 0});
};
exports.alActiveUsersList = async () => {
    return await User.find({role: "User", isDeleted: false});
};
exports.updateUserCoins = async (findObj, setObj) => {
    return User.updateOne(findObj, {$set: {credits: setObj}});
};
exports.foundUserById = async (userId) => {
    return await User.findOne({_id: mongoose.Types.ObjectId(userId)});
};
exports.foundUserByUserName = async (userName) => {
    return await User.findOne({"userDetail.userName": userName});
};
exports.foundUserByUserNameWithoutDeleted = async (userName) => {
    return await User.findOne({"userDetail.userName": userName.toLowerCase(), isDeleted: false});
};
exports.foundUserByToken = async (token) => {
    return await User.findOne({forgotToken: token});
};
exports.updateToken = async (id, forgotToken) => {
    return User.updateOne({_id: mongoose.Types.ObjectId(id)}, {resetPasswordToken: forgotToken});
};
exports.updateTime = async (id, expiryTime) => {
    return User.updateOne({_id: mongoose.Types.ObjectId(id)}, {resetPasswordExpires: expiryTime});
};
exports.updateUser = async (data) => {
    let user = await User.findOne({_id: mongoose.Types.ObjectId(data.id)});
    user.userDetail.fullName = data.fullName.toLowerCase().trim() || user.userDetail.fullName,
        user.userDetail.about = data.about.toLowerCase().trim() || user.userDetail.about,
        user.userDetail.credits = data.credits || user.userDetail.credits
    let userModel = new User(user);
    return userModel.save().then((fullfilled) => {
        return fullfilled;
    });
};
exports.updateResetForgotPasswordToken = async (
    data,
    forgotToken,
    isoTokenExpiry
) => {
    return await User.updateOne(
        {
            "userDetail.email": data.email,
        },
        {
            $set: {
                "userDetail.resetPasswordToken": forgotToken,
                "userDetail.resetPasswordExpires": isoTokenExpiry,
            },
        }
    );
};
exports.updateUserAndToken = async (res, id, password) => {
    let result;
    return await User.updateOne(
        {_id: mongoose.Types.ObjectId(id)},
        {
            password: password,
            "userDetail.resetPasswordToken": null,
            "userDetail.resetPasswordExpires": null,
        }
    )
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
};
exports.deleteUsers = async (idArr) => {
    let updateInfo = {
        isDeleted: true,
        deletedAt: moment(),
    };
    await User.updateMany({_id: {$in: idArr}}, {$set: updateInfo}).exec();
};
exports.findAllUsers = async (pageNo, searchValue = null) => {
    return await User.find(
        {},
        {
            profileImage: 1,
            email: 1,
            backgroundImage: 1,
            fullName: 1,
            userDetail: 1,
            friends: 1,
        }
    );
};
exports.totalRegistered = async () => {
    return User.find({isDeleted: false}).countDocuments();
};
exports.foundUserCount = async (conditionObj) => {
    return User.find(conditionObj).countDocuments();
};
exports.showReceivedRequests = async (userId) => {
    return await FriendRequest.find({
        isDeleted: false,
        status: {$in: ["pending", "accepted", "cancelled"]},
        to: userId,
    }).populate("User", "userName");
};
exports.showSendRequests = async (userId) => {
    return await FriendRequest.find({
        isDeleted: false,
        status: {$in: ["pending", "accepted", "cancelled"]},
        from: userId,
    }).populate("User", "userName");
};
exports.updateUserFullName = async (data, userId) => {
    let user = await User.findOne({_id: userId});
    user.userDetail.fullName = data.fullName.toLowerCase().trim() || user.userDetail.fullName;
    let userModel = new User(user);
    await userModel.save();
    return user._id
};
exports.updateUserAbout = async (data, userId) => {
    let user = await User.findOne({_id: userId});
    user.userDetail.about = data.about.trim();
    let userModel = new User(user);
    await userModel.save();
    return user._id
};
exports.updateProfileImage = async (userId, imagePath) => {
    let user = await User.findOne({_id: mongoose.Types.ObjectId(userId)});
    user.profileImage = imagePath;
    let userModel = new User(user);
    return userModel.save().then((fullfilled) => {
        return fullfilled;
    });
};
exports.updateBackgroundImage = async (userId, imagePath) => {
    let user = await User.findOne({_id: mongoose.Types.ObjectId(userId)});
    user.backgroundImage = imagePath || user.backgroundImage;
    let userModel = new User(user);
    return userModel.save().then((fullfilled) => {
        return fullfilled;
    });
};
exports.addGamerTag = async (user, GamerTags, res) => {
    let result = "";
    await User.updateOne({_id: mongoose.Types.ObjectId(user._id)}, {$set: {Tags: GamerTags}})
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
            res.status(500).json({
                error: err,
            });
        });
    return result;
};
exports.sendRequest = async (userId, receiver) => {
    const friendRequest = new FriendRequest({
        _id: new mongoose.Types.ObjectId(),
        to: receiver._id,
        from: userId,
        status: "pending",
    });
    await friendRequest.save();
};
exports.findSentRequestToFriend = async (userId, findFriend) => {
    return await FriendRequest.findOne({
        from: mongoose.Types.ObjectId(userId),
        to: mongoose.Types.ObjectId(findFriend),
        status: "pending"
    });
};
exports.findAcceptedRequestToFriend = async (fromId, userId) => {
    return await FriendRequest.findOne({
        from: mongoose.Types.ObjectId(fromId),
        to: mongoose.Types.ObjectId(userId),
        status: "accepted"
    });
};
exports.findRequest = async (userId) => {
    return await FriendRequest.findOne({from: userId, status: "pending"});
};
exports.acceptRequest = async (userId, fromId, status) => {
    return FriendRequest.updateOne(
        {to: mongoose.Types.ObjectId(userId), from: mongoose.Types.ObjectId(fromId), status: "pending"},
        {$set: {status: status}}
    );
};
exports.sentFriendRequestToFriend = async (userId, friendId) => {
    return await FriendRequest.findOne({from: mongoose.Types.ObjectId(userId), to: mongoose.Types.ObjectId(friendId)});
};
exports.deleteFriendRequest = async (userId, findFriend) => {
    return await FriendRequest.deleteOne({
        from: mongoose.Types.ObjectId(userId),
        to: mongoose.Types.ObjectId(findFriend),
        status: "pending"
    });
};
exports.receivedFriendRequestToFriend = async (friendId, userId) => {
    return await FriendRequest.findOne({from: mongoose.Types.ObjectId(friendId), to: mongoose.Types.ObjectId(userId)});
};
exports.alreadyInFriends = async (userId, fromId) => {
    let userData = await this.foundUserById(userId);
    let friendArr = [];
    for (let i = 0; i < userData.userDetail.friends.length; i++) {
        friendArr.push(userData.userDetail.friends[i].toString());
    }
    return friendArr.includes(fromId.toString());
};
exports.addFriend = async (userId, fromId) => {
    return User.updateOne(
        {_id: mongoose.Types.ObjectId(userId)},
        {
            $push: {
                "userDetail.friends": mongoose.Types.ObjectId(fromId),
            },
        }
    );
}
exports.addRequestedFriend = async (fromId, userId) => {
    return User.updateOne(
        {_id: fromId},
        {
            $push: {
                "userDetail.friends": mongoose.Types.ObjectId(userId),
            },
        }
    );
};
exports.findFriend = async (userName, user) => {
    return await User.findOne(
        {_id: mongoose.Types.ObjectId(user._id)},
        {friends: {$elemMatch: {userName: userName}}}
    );
};
exports.createWithdrawalRequest = async (
    userName,
    accountType,
    accountNumber,
    withdrawalCoins
) => {
    const withdrawalRequest = new WithdrawalRequest({
        _id: new mongoose.Types.ObjectId(),
        userName: userName,
        accountType: accountType,
        accountNumber: accountNumber,
        withdrawalCoins: withdrawalCoins,
    });
    await withdrawalRequest.save();
};
exports.checkAlreadyFriendRequest = async (userId, requestedId) => {
    return await FriendRequest.findOne({
        from: mongoose.Types.ObjectId(userId),
        to: mongoose.Types.ObjectId(requestedId),
        status: {$in: ["pending", "accepted"]},
    });
};
exports.checkAlreadyReceivedRequest = async (userId, requestedId) => {
    return await FriendRequest.findOne({
        from: mongoose.Types.ObjectId(requestedId),
        to: mongoose.Types.ObjectId(userId),
        status: "pending",
    });
};
exports.usersListByUserName = async (userName) => {
    let userNameLower = userName.toLowerCase()
    return await User.find({
        "userDetail.userName": {$regex: userNameLower},
        role: "User",
    });
};
exports.updateCredit = async (userId, credit) => {
    return await User.updateOne(
        {_id: mongoose.Types.ObjectId(userId)},
        {"userDetail.credits": credit}
    );
};
exports.myFriendList = async (userId) => {
    return await User.findOne({_id: mongoose.Types.ObjectId(userId)}, {"userDetail.friends": 1});
};
exports.findUserByUserNameAndFullName = async (searchValue) => {
    return await User.find({
        role: "User",
        $or: [
            {'userDetail.userName': {$regex: searchValue}},
            {'userDetail.fullName': {$regex: searchValue}}]
    }, {profileImage: 1, "userDetail.userName": 1, "userDetail.fullName": 1})
}
exports.updateUserPoints = async (userId, userPoints) => {
    return await User.updateOne({_id: mongoose.Types.ObjectId(userId)}, {
        $set: {
            userPoints: userPoints
        }
    })
}






