const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const UserModel = require("../controllers/userController.js");

const { isValidObjectId } = require('../validators/validations.js')

// exports.authentication = async function(req, res, next) {
//     try {
// const userId = req.params.userId;
// if(!isValidObjectId(userId))
// return res.status(400).send({status: false, message: "Please provide valid format of userId"});

//         let token = req.SetAuthorization["Token"];
//         if(!token)
//         return res.status(400).send({status:false, message: "Token must be present"});

//         //let decodedToken = 
//         jwt.verify(token, "Project5-group16", (err, decoded) => {
//             if(err) {
//                 return res.status(401).send({status: false, message: err.message});
//             } else {
//                 req.token = decoded
//             }
//         });

//         next();

//     } catch (error) {
//         return res.status(500).send({ status: false, message: error.message });
//     }
// }



const authentication = async function (req, res, next) {
    try {

        let token = req.headers["Authorization"] || req.headers["authorization"];

        if (!token) return res.status(401).send({ status: false, message: "Missing authentication token in request" });

        let Bearer = token.split(' ');

        let decodedToken = jwt.verify(Bearer[1], "Project5-group16")    //(err, decoded) => {
        //                 if(err) {
        //                     console.log(err)
        //                     return res.status(401).send({status: false, message: err.message});
        //                 } else {
        //                     req.token = decoded.userId
        //                 }})
        req.decodedToken = decodedToken.userId;
        next();

    } catch (error) {
        if (error.message == 'invalid token') return res.status(401).send({ status: false, message: "invalid token" });

        if (error.message == "jwt expired") return res.status(401).send({ status: false, message: "please login one more time, token is expired" });

        if (error.message == "invalid signature") return res.status(401).send({ status: false, message: "invalid signature" });

        return res.status(500).send({ status: false, message: error.message });
    }
};



module.exports = { authentication };
