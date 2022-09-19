// Mongoose
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// Moment
const moment = require("moment");
// Models
const User = require("../Models/User");
//
exports.createAdmin = async (email, fullName, password, userDetail) => {
    let role = "Admin";
    const admin = new User({
        _id: new mongoose.Types.ObjectId(),
        fullName: fullName,
        email: email,
        password: password,
        role: role,
        profileImage: "",
        userDetail: userDetail,
    });
    await admin.save();
    const token = jwt.sign(
        {
            email: admin.email,
            id: admin._id,
            role: "Admin",
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "12h",
        }
    );
    return {fullName, email, role, token};
};
exports.updateAdmin = async (findObj, setObj) => {
    return Admin.updateOne(findObj, {$set: setObj});
};
exports.profile = async (user) => {
    return Admin.findOne({user: user}).populate("user").populate("firm");
};
exports.foundAdminByEmail = async (email) => {
    return Admin.findOne({email: email});
};
