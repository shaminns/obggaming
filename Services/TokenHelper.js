// JWT
const jwt = require("jsonwebtoken");
// Helpers
const UserHelper = require("../Services/UserHelper");
const ResponseCode = require("../Constants/ResponseCode");
const Message = require("../Constants/Message");
const ResponseHelper = require("./ResponseHelper");
exports.tokenCreater = async (email) => {
    return jwt.sign(
        {
            iss: "battleGround",
            sub: email,
            iat: new Date().getTime(), // current time
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 60 minutes
        },
        process.env.JWT_SECRET
    );
};
exports.decodeToken = async (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return err;
    }
};
exports.validationForPasswordChange = async (req, userId, token) => {
    const foundUser = await UserHelper.foundUserById(userId);
    if (
        foundUser.userDetail.resetPasswordToken === token &&
        foundUser.userDetail.resetPasswordToken !== ""
    ) {
        //     return true;
        // }
        this.decodeToken(token).then(values => {
            console.log("value", values.exp > Math.floor(Date.now() / 1000))
            if (values.exp > Math.floor(Date.now() / 1000)) {
                console.log("Success")
                return true
                // return {
                //     message: "Success",
                //     status: true
                // };
            }
            if (values.exp < Math.floor(Date.now() / 1000)) {
                console.log("token expire")
                // return {
                //     message: "Token Expired",
                //     status: false
                // }
                return false
            }
        });
    }
};
exports.getIdFromToken = async (userEmail, res) => {
    let user = await UserHelper.foundUserByEmail(userEmail);
    const token = jwt.sign(
        {
            email: user.email,
            id: user._id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "12h",
        }
    );
    if (token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return null;
        }
    }
    const tokenParts = token.split(".");
    const encodedToken = tokenParts[1];
    const rawToken = atob(encodedToken);
    const tokenDetails = JSON.parse(rawToken);
    if (!tokenDetails && !tokenDetails.id) {
        let response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.INVALID_TOKEN
        );
        return res.status(response.code).json(response);
    }
    return tokenDetails.id;
};
exports.getInfoFromToken = async (token, res) => {
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return null;
        }
    }
    const tokenParts = token.split(".");
    const encodedToken = tokenParts[1];
    const rawToken = atob(encodedToken);
    const tokenDetails = JSON.parse(rawToken);
    // if (Date.now() >= tokenDetails.exp * 1000) {
    //   console.log("less");
    // }
    if (!tokenDetails && !tokenDetails.id) {
        let response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.INVALID_TOKEN
        );
        return res.status(response.code).json(response);
    }
    return tokenDetails.id;
};
