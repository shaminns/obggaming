const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserHelper = require("./UserHelper.js");
const crypto = require("crypto");
const moment = require("moment");

async function bcryptPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function comparePassword(enteredPassword, userPassword) {
    return await bcrypt.compare(enteredPassword, userPassword);
}

async function passwordForgotten(payload, user) {
    let today = Date.now();
    let expirationDate = new Date(today);
    expirationDate.setDate(today.getDate + 60);
    await jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expirationDate.getDate, 20),
    });
    let token = crypto.randomBytes(20).toString("hex");
    await UserHelper.updateToken(user._id, token);
    user.save();
    // let Expiry = Date.now() + 3600000;
    // 	await UserHelper.updateUser(user._id,Expiry);
    return token;
}

function escapeLike(string) {
    return string
        .replace("#", "\\#")
        .replace("$", "\\$")
        .replace("%", "\\%")
        .replace("+", "\\+")
        .replace("_", "\\_");
}

function getRandomCode() {
    return Math.floor(Math.random() * (999999 - 111111) + 111111);
}

function isValueSet(value) {
    return !(value === "" || value == null || undefined);
}

function isValueNotSet(value) {
    return value == "" || value == null || value == undefined;
}

function getPageSize() {
    return 10;
}

function getSkipCount(pageNo, pageSize) {
    return (pageNo - 1) * pageSize;
}

function checkPageLowerLimit(pageNo) {
    return pageNo < 1 ? 1 : pageNo;
}

function getPaginationDetails(pageNo) {
    return {
        pageNo: pageNo < 1 ? 1 : pageNo,
        pageSize: 10,
        skip: (pageNo - 1) * 10,
    };
}

function getPaginationDetailsForLeagueSchedule(pageNo) {
    return {
        pageNo: pageNo < 1 ? 1 : pageNo,
        pageSize: 15,
        skip: (pageNo - 1) * 15,
    };
}

function makePaginationObject(
    pageNo,
    pageSize,
    skip,
    total,
    currentPageRecords
) {
    return {
        currentPage: pageNo,
        pageSize: pageSize,
        from: skip == 0 ? 1 : skip + 1,
        to: currentPageRecords + (pageNo == 1 ? 0 : (pageNo - 1) * pageSize),
        total: total,
    };
}

function getFrontAppUrl() {
    return process.env.MODE === "DEV"
        ? process.env.FRONT_APP_URL_DEV
        : process.env.FRONT_APP_URL_PRO;
}

function getFrontAppResetUrl() {
    return process.env.MODE === "DEV"
        ? process.env.FRONT_APP_RESET_PASSWORD_URL_DEV
        : process.env.FRONT_APP_RESET_PASSWORD_URL_PRO;
}

function getBackAppUrl() {
    return process.env.MODE === "DEV"
        ? process.env.BACK_APP_URL_DEV
        : process.env.BACK_APP_URL_PRO;
}

function makeImagePath(dir, name) {
    return dir + "/" + name;
}

function passwordGenerator() {
    return "AK" + Math.floor(Math.random() * (999999 - 111111) + 111111);
}

function dateTimeToUtc(date) {
    return moment(date).utc().format("MMM DD YYYY hh:mm a")
}

module.exports = {
    getFrontAppResetUrl,
    bcryptPassword,
    getPageSize,
    getSkipCount,
    checkPageLowerLimit,
    makePaginationObject,
    getPaginationDetails,
    getFrontAppUrl,
    getBackAppUrl,
    escapeLike,
    makeImagePath,
    isValueSet,
    passwordGenerator,
    comparePassword,
    getRandomCode,
    passwordForgotten,
    getPaginationDetailsForLeagueSchedule,
    dateTimeToUtc,
};
