const exceptionFunc = (req, res) => async (controller, method, error) => {
    try {
        return await controller[method](req, res);
    } catch (e) {
        console.log("error : ", e)
        return res.status(500).json({
            code: 500,
            message: error
        });
    }
}
module.exports = {exceptionFunc};
