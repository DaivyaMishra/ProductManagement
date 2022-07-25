const UserModel = require('../models/userModel.js');
const Validators = require('../validators/validations.js');
const { uploadFile } = require("../aws/aws.js");
const bcrypt = require('bcrypt');

const { isValidObjectId, objectValue, forBody, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid } = require('../validators/validations.js')

exports.createUser = async function (req, res) {
    try {
        const { fname, lname, email, profileImage, phone, password, address } = req.body;
        // let street = address.shipping.street;
        // console.log(address);
        // let city = address.shipping.city;
        console.log(address.shipping.street)
    
        let files = req.files;
        if (files && files.length > 0) {
            var imageUrl = await uploadFile(files[0]);
            req.body.profileImage = imageUrl;
        }
        const encryptedPass = await bcrypt.hash(password, 10);
        req.body.password = encryptedPass;

        if (!objectValue(fname))
            return res.status(400).send({ status: false, message: "fname must be required it cannot remain empty" })
        if (!nameRegex(fname))
            return res.status(400).send({ status: false, message: "Please provide valid fname, it should not contains any special characters and numbers" });

        if (!objectValue(lname))
            return res.status(400).send({ status: false, message: "lname must be required it cannot remain empty" })
        if (!nameRegex(lname))
            return res.status(400).send({ status: false, message: "Please provide valid lname, it should not contains any special characters and numbers" });


        const emailId = await UserModel.findOne({ email: email });

        if (emailId)
            return res.status(400).send({ status: false, message: "EmailId already taken" });

        if (!objectValue(email))
            return res.status(400).send({ status: false, message: "EmailId must be present" });

        if (!mailRegex(email))
            return res.status(400).send({ status: false, message: "Please enter valid email" });

        const phoneNo = await UserModel.findOne({ phone: phone });

        if (phoneNo)
            return res.status(400).send({ status: false, message: "Phone number is already taken" });

        if (!objectValue(phone))
            return res.status(400).send({ status: false, message: "Phone number must be present" });

        if (!mobileRegex(phone))
            return res.status(400).send({ status: false, message: "Please provide valid mobile number" });

        if (!objectValue(password))
            return res.status(400).send({ status: false, message: "Password must be present" });

        if (!passwordRegex(password))
            return res.status(400).send({ status: false, message: "Please enter a password which contains min 8 letters & max 15 letters, at least a symbol, upper and lower case letters and a number" });


//  ADDRESS
        // if (typeof address.shipping != "object" && typeof address.shipping != "object")
        //     return res.status(400).send({ status: false, message: "address must be a type of object" });

        let add = JSON.parse(address)
        console.log(add)
        if(typeof add != "object")
             return res.status(400).send({ status: false, message: "address must be a type of object" });

        if (!objectValue(street))
            return res.status(400).send({ status: false, message: "Street name must be present" });

        // if (!addressValid(address.shipping.street))
        //     return res.status(400).send({ status: false, message: "Please enter valid street name" });


        // if (!objectValue(address.shipping.city))
        //     return res.status(400).send({ status: false, message: "City name must be present" }); 

        // if (!nameRegex(address.shipping.city))
        //     return res.status(400).send({ status: false, message: "Please enter valid city name" });



        // if (!objectValue(address.shipping.pincode))
        //     return res.status(400).send({ status: false, message: "Pincode must be present" });

        // if (!pinValid(address.shipping.pincode))
        //     return res.status(400).send({ status: false, message: "Pincode is not valid" });




        // if (!objectValue(address.billing.street))
        //     return res.status(400).send({ status: false, message: "Street name must be present" });

        // if (!addressValid(address.billing.street))
        //     return res.status(400).send({ status: false, message: "Please enter valid street name" });


        // if (!objectValue(address.billing.city))
        //     return res.status(400).send({ status: false, message: "City name must be present" });

        // if (!nameRegex(address.billing.city))
        //     return res.status(400).send({ status: false, message: "Please enter valid city name" });

        // if (!objectValue(address.billing.pincode))
        //     return res.status(400).send({ status: false, message: "Pincode must be present" });

        // if (!pinValid(address.billing.pincode))
        //     return res.status(400).send({ status: false, message: "Pincode is not valid" });




        const savedData = await UserModel.create(req.body);
        return res.status(201).send({ status: true, message: 'Success', data: savedData })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

exports.loginUser = async function (req, res) {
    const { email, password } = req.body;
    let user = await UserModel.findOne({ email: email, password: password });
    if (!user)
        return res.status(400).send({ status: false, msg: "username or the password is not correct", });


    let token = jwt.sign(
        {
            userId: user._id.toString(),
            batch: "Radon",
            organisation: "FunctionUp",
        },
        "Project5-group16",
        {
            expiresIn: '2m'
        }
    );

    res.setHeader("x-api-key", token);
    res.status(200).send({ status: true, message: "Login successful", token: token });
}

exports.getUser = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!objectValue(userId))
            return res.status(400).send({ status: false, message: "UserId must be present it cannot remain empty" });

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please provide valid userId" });

        const checkUserId = await UserModel.findById(userId);
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: "No User found" });
        } else {
            return res.status(200).send({ status: true, message: "User profile details", data: checkUserId })
        }
        //let { _id, fname, lname, email, profileImage, phone, password, createdAt, updatedAt } = checkUserId
        // let getData = { _id, fname, lname, email, profileImage, phone, password, createdAt, updatedAt }
        //return res.status(200).send({status: true, message: "User profile details", data: getData})

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

exports.updateProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        let { fname, lname, email, profileImage, phone, password, address } = req.body
        const findUser = await UserModel.findById(userId)
        if (!findUser) {
            return res.status(404).send({ status: false, message: "No User found" });
        }
        const updatedProfile = await UserModel.findOneAndUpdate({ _id: findUser._id }, req.body, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updatedProfile })
    } catch {
        return res.status(500).send({ status: false, message: error.message })
    }
}