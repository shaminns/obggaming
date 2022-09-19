/* models */
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper")
//constants
const ResponseCode = require("../Constants/ResponseCode");
const Message = require("../Constants/Message");
//////Waheeb
exports.addCredit = async function (req, res) {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.body
    if (!request.userId || !request.credits) {
        response = await ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.MISSING_PARAMETER
        );
        return res.status(response.code).json(response);
    }
    let userRecord = await UserHelper.foundUserById(request.userId)
    let previousCredit = userRecord.userDetail.credits
    let updatedCredits = parseFloat(previousCredit) + parseFloat(request.credits)
    await UserHelper.updateCredit(request.userId, updatedCredits)
    let userData = await UserHelper.foundUserById(request.userId)
    response = await ResponseHelper.setResponse(
        ResponseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
    );
    response.userData = userData
    return res.status(response.code).json(response);
}
exports.checkPageNo = async (request) => {
    if (!request.pageNo) {
        return false;
    }
    return true;
};
