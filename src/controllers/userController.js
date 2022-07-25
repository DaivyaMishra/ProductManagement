const UserModel = require('../models/userModel.js');
const Validators = require('../validators/validations.js');
const { uploadFile } = require("../aws/aws.js");

exports.createUser = async function(req, res) {
    try {
        const {fname, lname,email, profileImage, phone, password, address} = req.body;

        const savedData = await UserModel.create(req.body);
        return res.status(201).send({status: true, message: 'Success', data: savedData})
    } catch (error) {
        
    }
}
