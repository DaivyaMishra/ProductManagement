const OrderModel = require('../models/orderModel.js');
const UserModel = require('../models/userModel.js');
const CartModel = require('../models/cartModel.js');

const { isValidObjectId, isValid, isValidRequest } = require('../validators/validations.js');


//===================================================[API:FOR CREATING ORDER DB]===========================================================


const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        // finding user details
        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        const data = req.body;
        const { cartId } = data;

        //checking for the empty body
        if (!isValidRequest(data))
            return res.status(400).send({ status: true, message: "Request body cannot remain empty" });

        // validation for cartId
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "CartId is required" });
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` });

        //authorization
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        // finding cart details
        const findCart = await CartModel.findOne({ _id: cartId, userId: userId });
        if (!findCart)
            return res.status(404).send({ status: false, message: `Cart details are not found with the cartId: ${cartId}` });

        // if cart exist => getting the total number of quantity of products
        if (findCart) {
            let array = findCart.items
            var count = 0;
            for (let i = 0; i < array.length; i++) {
                if (array[i].quantity) {
                    count += findCart.items[i].quantity;
                }
            }
        }

        // for no products in the items or cart
        if (findCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        let response = {
            userId: findCart.userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: count
        };

        // creating the order
        const orderCreated = await OrderModel.create(response)

        // for the final response as per the readme file 
        let finalResponse = {
            _id: orderCreated._id,
            userId: orderCreated.userId,
            items: orderCreated.items,
            totalPrice: orderCreated.totalPrice,
            totalItems: orderCreated.totalItems,
            totalQuantity: orderCreated.totalQuantity,
            cancellable: orderCreated.cancellable,
            status: orderCreated.status,
            createdAt: orderCreated.createdAt,
            updatedAt: orderCreated.updatedAt
        }

        // just to update the cart DB after order is placed
        const updatedCart = await CartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true });
        return res.status(201).send({ status: true, message: 'Success', data: finalResponse });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//===================================================[API:FOR UPDATE ORDER]===========================================================


const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const { orderId, status } = data;

        //checking for the empty body
        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Please provide data in the request body" })

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        // validation for orderId
        if (!isValid(orderId))
            return res.status(400).send({ status: false, message: "OrderId is Required" });
        if (!isValidObjectId(orderId))
            return res.status(400).send({ status: false, message: "The given orderId is not in proper format" });

        // finding user details
        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        // Authorization 
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        // finding order details
        const findOrder = await OrderModel.findOne({ _id: orderId, userId: userId })
        if (!findOrder)
            return res.status(404).send({ status: false, message: `Order details is not found with the given OrderId: ${userId}` })


        if (findOrder.cancellable == true) {
            if (!isValid(status))
                return res.status(400).send({ status: false, message: "Status is required and the fields will be 'pending', 'completed', 'cancelled' only  " });

            // enum validation
            let statusIndex = ["pending", "completed", "cancelled"];
            if (statusIndex.indexOf(status) == -1)
                return res.status(400).send({ status: false, message: "Please provide status from these options only ('pending', 'completed' or 'cancelled')" });


            if (status == 'completed') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "Your order is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "Your order is cancelled, so you cannot change the status " });
                }
            }

            if (status == 'cancelled') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "Your order is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "Your order is already cancelled, because it is already cancelled" });
                }
            }
        }

        if (findOrder.cancellable == false) {

            if (!isValid(status))
                return res.status(400).send({ status: false, message: "Status is required and the fields will be 'pending', 'completed', 'cancelled' only" });

            if (status == 'completed') {
                if (findOrder.status == 'pending') {
                    const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updateStatus });
                }
                if (findOrder.status == 'completed') {
                    return res.status(400).send({ status: false, message: "The status is already completed" });
                }
                if (findOrder.status == 'cancelled') {
                    return res.status(400).send({ status: false, message: "The status is cancelled, you cannot change the status" });
                }
            }

            if (status == 'cancelled') {
                return res.status(400).send({ status: false, message: "Cannot be cancelled as it is not cancellable" })
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }