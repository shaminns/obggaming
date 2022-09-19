// Mongoose
const mongoose = require("mongoose");
// Models
const User = require("../Models/User");

async function foundUserById(_id) {
    let result = "";
    await User.findOne({_id: _id})
        .populate("organization")
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
            result = err;
        });
    return result;
}

async function foundUserByEmail(email) {
    let result = "";
    await User.findOne({email: email})
        .populate("organization")
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
            result = err;
        });
    return result;
}

async function updateUser(_id, request) {
    let result = "";
    const updateUserInfo = {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        userName: request.userName,
        age: request.age,
    };
    await User.updateOne({_id: _id}, {$set: updateUserInfo})
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
}

async function updateUserImage(_id, imageName) {
    let result;
    const updateUserImage = {
        profileImage: imageName,
    };
    await User.updateOne({_id: _id}, {$set: updateUserImage})
        .exec()
        .then((docs) => {
            result = docs;
        })
        .catch((err) => {
        });
    return result;
}

async function updateUser2(findObj, setObj) {
    let modelThread = "";
    await User.updateOne(findObj, {$set: setObj})
        .exec()
        .then((docs) => {
            modelThread = docs;
        })
        .catch((err) => {
            modelThread = err;
        });
    return modelThread;
}

module.exports = {
    foundUserById,
    foundUserByEmail,
    updateUser,
    updateUser2,
    updateUserImage,
};
