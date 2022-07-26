const UserModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { uploadFile } = require("../aws/aws.js");

const { isValidObjectId, isValid, isValidRequest, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid, imageValid } = require('../validators/validations.js');

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

exports.updateProfile = async function (req, res) {
    try {

        let files = req.files;
        let userId = req.params.userId;

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Please provide valid userId" });

        let { fname, lname, email, profileImage, phone, password, address } = req.body;

        const findUser = await UserModel.findOne({_id: userId});
        if (!findUser) {
            return res.status(404).send({ status: false, message: "No User found" });
        }

        if (req.decodedToken != userId) return res.status(403).send({ status: false, message: "Error, authorization failed" });

        if(fname) {
            if (!isValid(fname))
            return res.status(400).send({ status: false, message: "fname must be present it cannot remain empty" })
            if (!nameRegex(fname))
                return res.status(400).send({ status: false, message: "Please provide valid fname, it should not contains any special characters and numbers" });        
        }
        if(lname) {
            if (!isValid(lname))
            return res.status(400).send({ status: false, message: "lname must be present it cannot remain empty" })
        if (!nameRegex(lname))
            return res.status(400).send({ status: false, message: "Please provide valid lname, it should not contains any special characters and numbers" });

        }

        if(email) {
    
        if (findUser.email === email) 
        return res.status(400).send({ status: false, message: "EmailId already taken" });

        if (!mailRegex(email))
        return res.status(400).send({ status: false, message: "Please enter valid email" });
        }

        if(phone) {
            if (findUser.phone === phone)
            return res.status(400).send({ status: false, message: "Phone number is already taken" });

            if (!mobileRegex(phone))
            return res.status(400).send({ status: false, message: "Please provide valid mobile number" });
        }

        if(password) {
    
            if (!passwordRegex(password))
            return res.status(400).send({ status: false, message: "Please enter a password which contains min 8 letters & max 15 letters, at least a symbol, upper and lower case letters and a number" });

            var encryptedPassword = await bcrypt.hash(password, 10);
        }
        
        if(address){
            address = JSON.parse(address)
        
            if(address.shipping){
                if(address.shipping.street){
                    if(!addressValid(address.shipping.street)){
                        return res.status(400).send({ status: false, message: 'Enter street' })
                    }
                }
                if(address.shipping.city){
                    if(!nameRegex(address.shipping.city)){
                        return res.status(400).send({ status: false, message: 'Enter city' })
                    }
                }
                if(address.shipping.pincode){
                    if(!pinValid(address.shipping.pincode)){
                        return res.status(400).send({status: false, message: 'Enter pincode'})
                    }
               }
            }
            if(address.billing){
                if(address.billing.street){
                    if(!addressValid(address.billing.street)){
                        return res.status(400).send({ status: false, message: 'Enter street' })
                    }
                }
                if(address.billing.city){
                    if(!nameRegex(address.billing.city)){
                        return res.status(400).send({ status: false, message: 'Enter city' })
                    }
                }
                if(address.billing.pincode){
                    if(!pinValid(address.billing.pincode)){
                        return res.status(400).send({status: false, message: 'Enter pincode'})
                    }
                }
            }
        }

        if (files && files.length > 0) {
            var imageUrl = await uploadFile(files[0]);
        
        }
        const newData = {};
        newData.fname = fname;
        newData.lname = lname;
        newData.email = email;
        newData.profileImage = imageUrl;
        newData.phone = phone;
        newData.password = encryptedPassword;
        newData.address = {
            shipping:{
                street:address?.shipping?.street||findUser.address.shipping.street,
                city:address?.shipping?.city||findUser.address.shipping.city,
                pincode:address?.shipping?.pincode||findUser.address.shipping.pincode,

            },
            billing:{
                street:address?.billing?.street||findUser.address.billing.street,
                city:address?.billing?.city||findUser.address.billing.city,
                pincode:address?.billing?.pincode||findUser.address.billing.pincode,

            }
        }

        
        const updatedProfile = await UserModel.findOneAndUpdate({ _id: findUser._id }, newData, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updatedProfile })
    } catch(error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}