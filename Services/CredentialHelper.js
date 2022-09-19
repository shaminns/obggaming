const userConst = require("../Constants/User.js");
exports.emailCheck = function emailCheck(emailAddress) {
    if (!emailAddress.match(userConst.mailFormat)) {
        return false;
    } else {
        return true;
    }
};
exports.passwordCheck = function passwordCheck(passwordCheck) {
    if (!passwordCheck.match(userConst.passwordFormat)) {
        return false;
    } else {
        return true;
    }
};
exports.userNameCheck = function userNameCheck(userNameCheck) {
    if (!userNameCheck.match(userConst.userNameFormat)) {
        return false;
    } else {
        return true;
    }
};
exports.fullNameCheck = function fullNameCheck(fullNameCheck) {
    if (!fullNameCheck.match(userConst.fullNameFormat)) {
        return false;
    } else {
        return true;
    }
};