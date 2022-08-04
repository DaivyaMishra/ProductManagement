const UserModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { uploadFile } = require("../aws/aws.js");

const { isValidObjectId, isValid, isValidRequest, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid, imageValid } = require('../validators/validations.js');


//===================================================[API:FOR CREATING USER DB]===========================================================


const createUser = async function (req, res) {
    try {

        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

        let { fname, lname, email, phone, password, address } = req.body;
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
            if (!imageValid(files[0].originalname))
                return res.status(400).send({ status: false, message: "file format" })
            var imageUrl = await uploadFile(files[0]);
            req.body.profileImage = imageUrl;
        } else {
            return res.status(400).send({ status: false, message: "File is required" })
        }

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


        if (req.body.address) {
            req.body.address = JSON.parse(address)
            let { shipping, billing } = req.body.address

            if (!shipping)
                return res.status(400).send({ status: false, message: "Please enter shipping address" });
            if (shipping.street) {
                shipping.street = shipping.street.trim();
                if (!isValid(shipping.street))
                    return res.status(400).send({ status: false, message: "Shipping street name must be present" });
                if (!addressValid(shipping.street))
                    return res.status(400).send({ status: false, message: "Please enter valid shipping street name" });
            } else {
                return res.status(400).send({ status: false, message: "Shipping Street name is required" })
            }

            if (shipping.city) {
                shipping.city = shipping.city.trim();
                if (!isValid(shipping.city))
                    return res.status(400).send({ status: false, message: "Shipping city name must be present" });
                if (!nameRegex(shipping.city))
                    return res.status(400).send({ status: false, message: "Please enter valid shipping city name" });
            } else {
                return res.status(400).send({ status: false, message: "Shipping  City name is required" })
            }

            if (shipping.pincode) {
                if (!isValid(shipping.pincode))
                    return res.status(400).send({ status: false, message: "Shipping pincode must be present" });
                if (!pinValid(shipping.pincode))
                    return res.status(400).send({ status: false, message: "Shipping pincode is not valid" });
            } else {
                return res.status(400).send({ status: false, message: "Shipping  Pincode is required" })
            }


            if (!billing)
                return res.status(400).send({ status: false, message: "Please enter billing address" });
            if (billing.street) {
                billing.street = billing.street.trim();
                if (!isValid(billing.street))
                    return res.status(400).send({ status: false, message: "Billing street name must be present" });
                if (!addressValid(billing.street))
                    return res.status(400).send({ status: false, message: "Please enter valid billing street name" });
            } else {
                return res.status(400).send({ status: false, message: "Billing Street name is required" })
            }

            if (billing.city) {
                billing.city = billing.city.trim();
                if (!isValid(billing.city))
                    return res.status(400).send({ status: false, message: "Billing city name must be present" });
                if (!nameRegex(billing.city))
                    return res.status(400).send({ status: false, message: "Please enter valid billing city name" });
            } else {
                return res.status(400).send({ status: false, message: "Billing city name is required" })
            }

            if (billing.pincode) {
                if (!isValid(billing.pincode))
                    return res.status(400).send({ status: false, message: "Billing pincode must be present" });
                if (!pinValid(billing.pincode))
                    return res.status(400).send({ status: false, message: "Billing pincode is not valid" });
            } else {
                return res.status(400).send({ status: false, message: "Billing pincode is required" })
            }

        } else {
            return res.status(400).send({ status: false, message: "Please enter address" })
        }

        const savedData = await UserModel.create(req.body);
        return res.status(201).send({ status: true, message: 'Success', data: savedData })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ status: false, message: error.message });
    }
}

//===================================================[API:FOR CREATING LOGIN USER]===========================================================


const loginUser = async function (req, res) {
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

        let isValidPassword = await bcrypt.compare(password.trim(), user.password)
        if (!isValidPassword)
            return res.status(404).send({ status: false, message: "Password is not correct" });


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

//===================================================[API:FOR GETTING THE USER DETAILS]===========================================================


const getUser = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!isValid(userId))
            return res.status(400).send({ status: false, message: "UserId must be present it cannot remain empty" });

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please provide valid userId" });

        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" })

        const checkUserId = await UserModel.findById(userId);
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: "No User found" });
        }

        if (checkUserId) {
            return res.status(200).send({ status: true, message: "User profile details", data: checkUserId })
        }


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//===================================================[API:FOR UPDATE USER]===========================================================

const updateProfile = async function (req, res) {
    try {

        let files = req.files;
        let userId = req.params.userId;

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please provide valid userId" });

        let { fname, lname, email, phone, password, address } = req.body;

        if (!isValidRequest(req.body))
            return res.status(400).send({ status: false, message: "data for updation is required" });

        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        const findUser = await UserModel.findOne({ _id: userId });

        if (!findUser) {
            return res.status(404).send({ status: false, message: "No User found" });
        }

        if (fname) {
            if (!isValid(fname))
                return res.status(400).send({ status: false, message: "fname must be present it cannot remain empty" });
            if (!nameRegex(fname))
                return res.status(400).send({ status: false, message: "Please provide valid fname, it should not contains any special characters and numbers" });
            findUser.fname = fname;
        }

        if (lname) {
            if (!isValid(lname))
                return res.status(400).send({ status: false, message: "lname must be present it cannot remain empty" })
            if (!nameRegex(lname))
                return res.status(400).send({ status: false, message: "Please provide valid lname, it should not contains any special characters and numbers" });
            findUser.lname = lname;
        }

        if (email) {
            if (findUser.email === email)
                return res.status(400).send({ status: false, message: "EmailId already taken" });
            if (!mailRegex(email))
                return res.status(400).send({ status: false, message: "Please enter valid email" });
            findUser.email = email;
        }

        if (phone) {
            if (findUser.phone === phone)
                return res.status(400).send({ status: false, message: "Phone number is already taken" });
            if (!mobileRegex(phone))
                return res.status(400).send({ status: false, message: "Please provide valid mobile number" });
            findUser.phone = phone;
        }

        if (password) {
            if (!passwordRegex(password))
                return res.status(400).send({ status: false, message: "Please enter a password which contains min 8 letters & max 15 letters, at least a symbol, upper and lower case letters and a number" });

            let encryptedPassword = await bcrypt.hash(password, 10);
            findUser.password = encryptedPassword;

        }

        if (address) {
            address = JSON.parse(address)

            if (address.shipping) {
                if (address.shipping.street) {
                    address.shipping.street = address.shipping.street.trim();
                    if (!isValid(address.shipping.street))
                        return res.status(400).send({ status: false, message: "Shipping street name must be present" });
                    if (!addressValid(address.shipping.street))
                        return res.status(400).send({ status: false, message: 'Enter street' })

                    findUser.address.shipping.street = address.shipping.street
                }
                if (address.shipping.city) {
                    address.shipping.city = address.shipping.city.trim();
                    if (!isValid(address.shipping.city))
                        return res.status(400).send({ status: false, message: "Shipping city name must be present" });
                    if (!nameRegex(address.shipping.city))
                        return res.status(400).send({ status: false, message: "Please enter valid shipping city name" });

                    findUser.address.shipping.city = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!isValid(address.shipping.pincode))
                        return res.status(400).send({ status: false, message: "Shipping pincode must be present" });
                    if (!pinValid(address.shipping.pincode))
                        return res.status(400).send({ status: false, message: "Shipping pincode is not valid" });

                    findUser.address.shipping.pincode = address.shipping.pincode
                }
            }
            if (address.billing) {
                if (address.billing.street) {
                    address.billing.street = address.billing.street.trim();
                    if (!isValid(address.billing.street))
                        return res.status(400).send({ status: false, message: "Billing street name must be present" });
                    if (!addressValid(address.billing.street))
                        return res.status(400).send({ status: false, message: "Please enter valid billing street name" });

                    findUser.address.billing.street = address.billing.street
                }
                if (address.billing.city) {
                    address.billing.city = address.billing.city.trim();
                    if (!isValid(address.billing.city))
                        return res.status(400).send({ status: false, message: "Billing city name must be present" });
                    if (!nameRegex(address.billing.city))
                        return res.status(400).send({ status: false, message: "Please enter valid billing city name" });

                    findUser.address.billing.city = address.billing.city
                }
                if (address.billing.pincode) {
                    if (!isValid(address.billing.pincode))
                        return res.status(400).send({ status: false, message: "Billing pincode must be present" });
                    if (!pinValid(address.billing.pincode))
                        return res.status(400).send({ status: false, message: "Billing pincode is not valid" });

                    findUser.address.billing.pincode = address.billing.pincode
                }
            }
        }

        if (files && files.length > 0) {
            if (!imageValid(files[0].originalname))
                return res.status(400).send({ status: false, message: "File format is not valid" });

            var imageUrl = await uploadFile(files[0]);

            findUser.profileImage = imageUrl;
        }

        const updatedProfile = await UserModel.findOneAndUpdate({ _id: findUser._id }, findUser, { new: true });
        return res.status(200).send({ status: true, message: "Success", data: updatedProfile });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createUser, loginUser, getUser, updateProfile };