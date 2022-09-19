require("dotenv").config();
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
exports.sendEmail = function sendEmail(
    email,
    subject,
    message,
    handlebarTemplateName,
    replacements
) {
    //step1
    let transporter = nodemailer.createTransport({
        // service: "gmail",
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    var options = {
        viewEngine: {
            extname: '.handlebars',
            layoutsDir: './Mails/',
            defaultLayout: handlebarTemplateName,
        },
        viewPath: './Mails/'
    }
    transporter.use('compile', hbs(options));
    //step2
    let mailOption = {
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        text: message,
        // attachments: [
        //     {
        //         filename: "Logo.png",
        //         path: 'localhost:4000/Assets/Logo.png',
        //         cid: 'Logo'
        //     },
        // ],
        template: handlebarTemplateName,//'forgot-password-new',
        context: replacements
    };
    //step3
    transporter.sendMail(mailOption, function (err, data) {
        if (err) {
            console.log(err)
            console.log("Error !!!\n\nEmail not sent ");
        } else {
            console.log("Email Sent ");
        }
    });
};
//
//send simple email without template
exports.sendSimpleEmail = function sendEmail(
    email,
    subject,
    message,
    replacements
) {
    //step1
    let transporter = nodemailer.createTransport({
        // service: "gmail",
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    // var options = {
    //     viewEngine: {
    //         extname: '.handlebars',
    //         layoutsDir: './Mails/',
    //         defaultLayout: handlebarTemplateName,
    //     },
    //     viewPath: './Mails/'
    // }
    // transporter.use('compile', hbs(options));
    //step2
    let mailOption = {
        from: process.env.EMAIL,
        to: process.env.EMAIL_TO,
        subject: subject,
        text: message,
        // attachments: [
        //     {
        //         filename: "Logo.png",
        //         path: 'localhost:4000/Assets/Logo.png',
        //         cid: 'Logo'
        //     },
        // ],
        context: replacements
    };
    //step3
    transporter.sendMail(mailOption, function (err, data) {
        if (err) {
            console.log(err)
            console.log("Error !!!\n\nEmail not sent ");
        } else {
            console.log("Email Sent ");
        }
    });
};
//