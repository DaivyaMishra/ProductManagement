const OrderModel = require('../models/orderModel.js');
const UserModel = require('../models/userModel.js');
const ProductModel = require('../models/productModel.js');
const CartModel = require('../models/cartModel.js');
const jwt = require('jsonwebtoken');

const { isValidObjectId, isValid, isValidRequest, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid, imageValid, isValidSizes, alphaNumericValid } = require('../validators/validations.js');

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        const data = req.body;
        const { cartId } = data;
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` });
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "Please provide cartId" });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: "User not found which is provided by you" });

        if (req.decodedToken != userId._id)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        //const findProduct = await ProductModel.findOne({ _id: data.productId, isDeleted: false });
        const findCart = await CartModel.findOne({ userId: userId });
        if (!findCart)
            return res.status(404).send({ status: false, message: "Cart not found" })
        if (findCart) {

            let array = findCart.items
            var count = 0;
            for (let i = 0; i < array.length; i++) {
                if (array[i].quantity) {
                    count += findCart.items[i].quantity;


                }
            }

        }

        let response = {
            userId: findCart.userId,
            items: findCart.items,
            totalQuantity: count
        }



        const orderCreated = await OrderModel.create(response)
        return res.status(201).send({ status: true, message: 'Success', data: orderCreated })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateOrder = async function (req, res) {
    try {
      
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }