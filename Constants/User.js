const mailFormat = /^[a-zA-Z0-9_\\..-\\+]+@[a-zA-Z0-9-]+(\.[a-z]{2,})+$/;
const passwordFormat = /^(?=.*?[A-Z])(?=.*?[#?!@$%^&*-]).{8,}$/;
const userNameFormat = /^[a-zA-Z0-9_.-]+$/
const fullNameFormat = /^[a-zA-Z ]+$/
const searchFormat = /^[a-zA-Z0-9_.-]*$/
module.exports = {
    mailFormat: mailFormat,
    passwordFormat: passwordFormat,
    userNameFormat: userNameFormat,
    fullNameFormat: fullNameFormat,
    searchFormat: searchFormat
};
