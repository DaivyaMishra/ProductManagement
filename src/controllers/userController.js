const UserModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { uploadFile } = require("../aws/aws.js");

const { isValidObjectId, isValid, isValidRequest, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid, imageValid } = require('../validators/validations.js')

exports.createUser = async function (req, res) {
    try {
        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

        const { fname, lname, email, profileImage, phone, password, address } = req.body;
        let files = req.files;

        if (!isValid(fname))
            return res.status(400).send({ status: false, message: "fname must be present it cannot remain empty" })
        if (!nameRegex(fname))
            return res.status(400).send({ status: false, message: "Please provide valid fname, it should not contains any special characters and numbers" });

        if (!isValid(lname))
            return res.status(400).send({ status: false, message: "lname must be present it cannot remain empty" })
        if (!nameRegex(lname))
            return res.status(400).send({ status: false, message: "Please provide valid lname, it should not contains any special characters and numbers" });

        const emailId = await UserModel.findOne({ email: email });

        if (emailId)
            return res.status(400).send({ status: false, message: "EmailId already taken" });

        if (!isValid(email))
            return res.status(400).send({ status: false, message: "EmailId must be present" });
        if (!mailRegex(email))
            return res.status(400).send({ status: false, message: "Please enter valid email" });


        if (files && files.length > 0) {
            var imageUrl = await uploadFile(files[0]);
            req.body.profileImage = imageUrl;
        } else {
            return res.status(400).send({ status: false, message: "File is required" })
        }

        // if (!imageValid(profileImage)) 
        //     return res.status(400).send({ status: false, message: "File format is not valid" });


        const phoneNo = await UserModel.findOne({ phone: phone });

        if (phoneNo)
            return res.status(400).send({ status: false, message: "Phone number is already taken" });

        if (!isValid(phone))
            return res.status(400).send({ status: false, message: "Phone number must be present" });
        if (!mobileRegex(phone))
            return res.status(400).send({ status: false, message: "Please provide valid mobile number" });

        if (!isValid(password))
            return res.status(400).send({ status: false, message: "Password must be present" });
        if (!passwordRegex(password))
            return res.status(400).send({ status: false, message: "Please enter a password which contains min 8 letters & max 15 letters, at least a symbol, upper and lower case letters and a number" });

        const encryptedPass = await bcrypt.hash(password, 10);
        req.body.password = encryptedPass;


        if (!address.shipping.street)
            // if (!isValid(address.shipping.street))
            return res.status(400).send({ status: false, message: "Shipping street name must be present" });
        if (!addressValid(address.shipping.street))
            return res.status(400).send({ status: false, message: "Please enter valid shipping street name" });

        if (!address.shipping.city)
            return res.status(400).send({ status: false, message: "Shipping city name must be present" });
        if (!nameRegex(address.shipping.city))
            return res.status(400).send({ status: false, message: "Please enter valid shipping city name" });

        if (!address.shipping.pincode)
            return res.status(400).send({ status: false, message: "Shipping pincode must be present" });
        if (!pinValid(address.shipping.pincode))
            return res.status(400).send({ status: false, message: "Shipping pincode is not valid" });


        if (!address.billing.street)
            return res.status(400).send({ status: false, message: "Billing street name must be present" });
        if (!addressValid(address.billing.street))
            return res.status(400).send({ status: false, message: "Please enter valid billing street name" });

        if (!address.billing.city)
            return res.status(400).send({ status: false, message: "Billing city name must be present" });
        if (!nameRegex(address.billing.city))
            return res.status(400).send({ status: false, message: "Please enter valid billing city name" });

        if (!address.billing.pincode)
            return res.status(400).send({ status: false, message: "Billing pincode must be present" });
        if (!pinValid(address.billing.pincode))
            return res.status(400).send({ status: false, message: "Billing pincode is not valid" });


        const savedData = await UserModel.create(req.body);
        return res.status(201).send({ status: true, message: 'Success', data: savedData })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ status: false, message: error.message });
    }
}

exports.loginUser = async function (req, res) {
    try {
        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });
        const { email, password } = req.body;

        if (!isValid(email))
            return res.status(400).send({ status: false, message: "EmailId must be present" });

        if (!isValid(password))
            return res.status(400).send({ status: false, message: "Password must be present" });

        let user = await UserModel.findOne({ email: email });
        if (!user)
            return res.status(400).send({ status: false, message: "Credential is not correct", });

        let isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) return res.status(404).send({ status: false, message: "Password is not correct" });


        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "Radon",
                organisation: "FunctionUp",
            },
            "Project5-group16",
            {
                expiresIn: '24h'
            }
        );
        const finalData = {};
        finalData.userId = user._id;
        finalData.token = token
        res.setHeader("x-api-key", token);
        res.status(200).send({ status: true, message: "User login successfull", data: finalData });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


exports.getUser = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!isValid(userId))
            return res.status(400).send({ status: false, message: "UserId must be present it cannot remain empty" });

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please provide valid userId" });

        if (req.decodedToken != userId) return res.status(403).send({ status: false, message: "Error, authorization failed" })

        const checkUserId = await UserModel.findById(userId);
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: "No User found" });
        } else {
            return res.status(200).send({ status: true, message: "User profile details", data: checkUserId })
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// exports.updateProfile = async function (req, res) {
//     try {
//         let userId = req.params.userId
//         let { fname, lname, email, profileImage, phone, password, address } = req.body;

//         const findUser = await UserModel.findById(userId)
//         if (!findUser) {
//             return res.status(404).send({ status: false, message: "No User found" });
//         }
//         const updatedProfile = await UserModel.findOneAndUpdate({ _id: findUser._id }, req.body, { new: true })
//         return res.status(200).send({ status: true, message: "Success", data: updatedProfile })
//     } catch {
//         return res.status(500).send({ status: false, message: error.message })
//     }
// }



exports.updateProfile = async function (req, res) {

    try {
        let files = req.files;
        let userId = req.params.userId;

        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });
            
            const findUser = await UserModel.findById(userId)
            if (!findUser) {
                return res.status(404).send({ status: false, message: "No User found" });
            }
        let { fname, lname, phone, email, password, address,profileImage } = req.body;
        
if(profileImage) {
        if (files && files.length > 0) {
            var imageUrl = await uploadFile(files[0]);
            req.body.profileImage = imageUrl;
        }
    }

        if (!nameRegex(fname))
            return res.status(400).send({ status: false, message: "Please provide valid fname, it should not contains any special characters and numbers" });

        if (!nameRegex(lname))
            return res.status(400).send({ status: false, message: "Please provide valid lname, it should not contains any special characters and numbers" });

        if (email) {
            if (!mailRegex(email))
                return res.status(400).send({ status: false, message: "Please enter valid email" });
            const emailId = await UserModel.findOne({ email: email });
            console.log(emailId)

            if (emailId)
                return res.status(400).send({ status: false, message: "EmailId already taken" });

            // if (!isValid(email))
            //     return res.status(400).send({ status: false, message: "EmailId must be present" });
        }
        if (phone) {

            if (!mobileRegex(phone))
                return res.status(400).send({ status: false, message: "Please provide valid mobile number" });

            const phoneNo = await UserModel.findOne({ phone: phone });

            if (phoneNo)
                return res.status(400).send({ status: false, message: "Phone number is already taken" });
            // if (!isValid(phone))
            //     return res.status(400).send({ status: false, message: "Phone number must be present" });

        }


        // //  ADDRESS
        // if (typeof address.shipping != "object" && typeof address.billing != "object")
        //     return res.status(400).send({ status: false, message: "address must be a type of object" });

        // if(address.shipping) {
        //     // if (!address.shipping.street)
        //             if (!isValid(address.shipping.street))
        //             return res.status(400).send({ status: false, message: "Shipping street name must be present" });

        //         if (!addressValid(address.shipping.street))
        //             return res.status(400).send({ status: false, message: "Please enter valid street name" });

        //         if (!nameRegex(address.shipping.city))
        //             return res.status(400).send({ status: false, message: "Please enter valid city name" });

        //         if (!pinValid(address.shipping.pincode))
        //             return res.status(400).send({ status: false, message: "Pincode is not valid" });
        // }

        // if(address.billing) {

        //         if (!addressValid(address.billing.street))
        //             return res.status(400).send({ status: false, message: "Please enter valid street name" });

        //         if (!nameRegex(address.billing.city))
        //             return res.status(400).send({ status: false, message: "Please enter valid city name" });

        //         if (!pinValid(address.billing.pincode))
        //             return res.status(400).send({ status: false, message: "Pincode is not valid" });
        // }

        const updatedProfile = await UserModel.findOneAndUpdate({ _id: findUser._id }, req.body, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updatedProfile })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};

//createuser me profileImage validation





