const fs = require("fs");
const moment = require("moment");

// Helpers
const ResponseHelper = require("../Services/ResponseHelper");
const InventoryHelper = require("../Services/InventoryHelper");
const UserHelper = require("../Services/UserHelper");

// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");

//Middleware
const tokenExtractor = require("../Middleware/TokenExtracter");

exports.add = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse();
    let request = req.body
    let imagePath

    if (!request.name || !req.file) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.MISSING_PARAMETER
        );
        return res.status(response.code).json(response);
    }

    else {
        if (!(req.file.mimetype == 'image/jpeg' || req.file.mimetype == 'image/png')) {
            fs.unlinkSync(req.file.path)
            response = ResponseHelper.setResponse(
                ResponseCode.NOT_SUCCESS,
                Message.IMAGE_TYPE_ERROR
            );
            return res.status(response.code).json(response);
        }
        imagePath = req.file.path
    }

    if (await InventoryHelper.findInventoryByName(request.name.toLowerCase().trim()) != null) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.NAME_ALREADY_EXIST
        );
        return res.status(response.code).json(response);
    }
    await InventoryHelper.add(request.name.toLowerCase().trim(), imagePath)
    let result = await InventoryHelper.findAll();
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result)
    return res.status(response.code).json(response);
}

exports.update = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    let imagePath

    if (!request._id || !request.name) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.MISSING_PARAMETER
        );
        return res.status(response.code).json(response);
    }

    let inventoryDetail = await InventoryHelper.findInventoryById(request._id)
    if (inventoryDetail == null) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.INVENTORY_NOT_FOUND
        );
        return res.status(response.code).json(response);
    }
    imagePath = inventoryDetail.link

    if (req.file) {
        if (!(req.file.mimetype == 'image/jpeg' || req.file.mimetype == 'image/png')) {
            fs.unlinkSync(req.file.path)
            response = ResponseHelper.setResponse(
                ResponseCode.NOT_SUCCESS,
                Message.IMAGE_TYPE_ERROR
            );
            return res.status(response.code).json(response);
        }
        imagePath = req.file.path;
    }

    let inventoryNameCheck = await InventoryHelper.findInventoryByName(request.name.toLowerCase().trim())
    if (inventoryNameCheck != null && request._id != inventoryNameCheck._id) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.NAME_ALREADY_EXIST
        );
        return res.status(response.code).json(response);
    }

    await InventoryHelper.update(request, imagePath)
    let result = await InventoryHelper.findAll();
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result)
    return res.status(response.code).json(response);
}

exports.delete = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body
    if (!request._id) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.MISSING_PARAMETER
        );
        return res.status(response.code).json(response);
    }
    await InventoryHelper.delete(request._id)
    let result = await InventoryHelper.findAll();
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result)
    return res.status(response.code).json(response);
}

exports.list = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()

    if (!req.headers.authorization) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_FOUND,
            Message.TOKEN_NOT_FOUND
        );
        return res.status(response.code).json(response);
    }
    let token = req.headers.authorization;
    let userId = await tokenExtractor.getInfoFromToken(token);
    if (userId == null) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_AUTHORIZE,
            Message.INVALID_TOKEN
        );
        return res.status(response.code).json(response);
    }

    let userData = await UserHelper.foundUserById(userId)
    let result = [];

    if (userData?.role == "User")
        result = await InventoryHelper.findUserInventory(userId);
    else
        result = await InventoryHelper.findAllWithName(req.query.name);

    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result)
    return res.status(response.code).json(response);

}
exports.addToUser = async (req, res) => {
    let response = ResponseHelper.getDefaultResponse()
    let request = req.body;

    if (!request.userId || !request.inventoryId) {
        response = ResponseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            Message.MISSING_PARAMETER
        );
        return res.status(response.code).json(response);
    }

    await InventoryHelper.addInventoryToUser(request.userId, request.inventoryId)
    let result = await InventoryHelper.findAll();
    response = ResponseHelper.setResponse(ResponseCode.SUCCESS, Message.REQUEST_SUCCESSFUL, result)
    return res.status(response.code).json(response);
}
