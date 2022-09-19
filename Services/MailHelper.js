// Libraries
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");
// Constants
const Message = require("../Constants/Message.js");

function createTransport() {
    console.log({MAIL_FROM: process.env.MAIL_FROM});
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        secureConnection: true,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
        },
    });
}

async function verifyTransport(transport) {
    let res;
    await transport.verify(function (error, success) {
        if (error) {
            console.log(error);
            res = error;
        } else {
            //res = success;
            console.log("Server is ready to take our messages");
        }
    });
}

function generateHtmlToSend(fileName, replacements) {
    const filePath = path.join(__dirname, "../Mails/" + fileName);
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);
    return template(replacements);
}

function setMailOptions(email, subject, fileName, replacements) {
    console.log({from: process.env.MAIL_FROM});
    return (mailOptions = {
        from: process.env.MAIL_FROM,
        to: email,
        subject: subject,
        html: generateHtmlToSend(fileName, replacements),
    });
}

async function sendEmail(subject, fileName, email, replacements) {
    const transport = createTransport();
    const transportVerify = await verifyTransport(transport);
    const mailOptions = setMailOptions(email, subject, fileName, replacements);
    await transport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
}

function sendForgotPasswordEmail(email, replacements) {
    sendEmail(
        Message.RESET_PASSWORD,
        "forgot-password.html",
        email,
        replacements
    );
}

module.exports = {sendForgotPasswordEmail};
