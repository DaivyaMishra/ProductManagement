const CartModel = require('../models/cartModel.js');
const UserModel = require('../models/userModel.js');
const ProductModel = require('../models/productModel.js');
const jwt = require('jsonwebtoken');

const { isValidObjectId, isValid, isValidRequest, isValidremoveProduct } = require('../validators/validations.js');





// exports.createCart = async function (req, res) {
//     try {
//         let userId = req.params.userId;
//         let data = req.body;
//         const { productId, cartId } = data;

//         if (!isValidRequest(data)) 
//             return res.status(400).send({ status: true, message: "Request body cannot remain empty" });

//         if (!isValidObjectId(productId))
//             return res.status(400).send({ status: true, message: "Valid ProductId is required" });


//         if (!isValidObjectId(userId))
//             return res.status(400).send({ status: false, message: "Please provide valid format of userId" });


//         const findUser = await UserModel.findOne({ _id: userId });
//         if (!findUser)
//             return res.status(404).send({ status: false, message: "User not found go and create your id first" });

//         // if (req.decodedToken != userId._id) 
//         //     return res.status(403).send({ status: false, message: "Error, authorization failed" });

//         const findProduct = await ProductModel.findOne({ _id: productId, isDeleted: false });
//         if (!findProduct)
//         return res.status(404).send({ status: false, message: "Product not found go and select the product" });

//         const findCart = await CartModel.findOne({ userId: userId });
//         if (!findCart){
//             let cartData = {
//                 "userId": userId,
//                 "items": [{
//                     "productId": productId,
//                     "quantity": 1
//                 }],
//                 "totalPrice": findProduct.price,
//                 "totalItems": 1
//             }

//             const cartCreated = await CartModel.create(cartData);
//             return res.status(201).send({ status: true, message: cartCreated });

//         } else {
//             if(findCart._id != cartId)
//             return res.status(404).send({status: false, message: "cartId provided doesnot belongs to this user"})
//             if(findCart.items.length > 0) {
//                 let noProductId = true;
//                 for(let i = 0; i < findCart.items.length; i++) {
//                     if(findCart.items[i].productId == productId){
//                     findCart.items[i].quantity++;
//                  noProductId = false;
//                     }

//                 }
//                 if(noProductId) {
//                     let obj = {}
//                     obj.productId = findProduct._id,
//                     obj.quantity = 1
//                     findCart.items.push(obj)
//                 }
//             } else {
//                 let obj = {}
//                 obj.productId = findProduct._id,
//                 obj.quantity = 1
//                 findCart.items.push(obj);
//             }
// findCart.totalPrice = findCart.totalPrice + findProduct.price;
// findCart.totalItems = findCart.items.length;
// findCart.save();
// return res.status(200).send({ status: true, data: findCart });

//         }

//     } catch (error) {
//         return res.status(500).send({ status: false, message: error.message })
//     }
// }













const createCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        const { productId, cartId } = data;

        if (!isValidRequest(data))
            return res.status(400).send({ status: true, message: "Request body cannot remain empty" });

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: true, message: `The given productId: ${productId} is not in proper format` });
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: "User not found which is provided by you" });

        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        const findProduct = await ProductModel.findOne({ _id: data.productId, isDeleted: false });
        if (!findProduct)
            return res.status(404).send({ status: false, message: "Product not found go and select the product" });

        const findCart = await CartModel.findOne({ userId: userId });

        if (!findCart) {
            if (cartId)
                return res.status(404).send({ status: false, message: `Cart not exists for this userId: ${userId}` });

            let cartData = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalPrice: findProduct.price,
                totalItems: 1
            };

            const cartCreated = await CartModel.create(cartData);
            return res.status(201).send({ status: true, message: "Success", data: cartCreated });
        }
        if (findCart) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: `The given cartId: ${data.cartId} is not in proper format` });
            if (!isValid(cartId))
                return res.status(400).send({ status: false, message: "Please provide cartId" });
            if (findCart._id.toString() != cartId)
                return res.status(404).send({ status: false, message: `cartId provided does not belongs to this user with userId: ${userId}` });


            const array = findCart.items;
            for (let i = 0; i < array.length; i++) {
                if (array[i].productId == productId) {
                    array[i].quantity++;
                    const updatedCart = await CartModel.findOneAndUpdate(
                        { userId: userId },
                        { items: array, totalPrice: findCart.totalPrice + findProduct.price },
                        { new: true })
                    return res.status(201).send({ status: true, message: "Success", data: updatedCart });

                    }
            }


            let obj = {}
            // $addToSet: { items: { 
            //     productId: productId, 
            //     quantity: 1 } },
            obj.productId = findProduct._id,
            obj.quantity = 1,

            findCart.items.push(obj);

            findCart.totalPrice = findCart.totalPrice + findProduct.price;
            findCart.totalItems = findCart.items.length;
            findCart.save();
            //const response = await findCart.findOneAndUpdate({_id: cartId}, findCart, {new: true})
            return res.status(201).send({ status: true, message: 'Success', data: findCart });

        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const updateCart = async function (req, res) {
    try {
        userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is invalid` })
        }

        const searchUser = await UserModel.findOne({ _id: userId })
        if (!searchUser) return res.status(404).send({ status: false, message: "User does not exist" })

        if (req.decodedToken != userId) return res.status(403).send({ status: false, message: "Error, authorization failed" })

        const data = req.body;
        if (!isValidRequest(data)) return res.status(400).send({ status: false, message: "data in request body required" })

        let { cartId, productId, removeProduct } = data;

        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "enter a cardId" })
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: `${cartId} is invalid` })
        const searchCart = await CartModel.findOne({ _id: cartId })
        if (!searchCart) return res.status(404).send({ status: false, message: "cart does not exist" })

        if (!isValid(productId)) return res.status(400).send({ status: false, message: "Enter the productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: `${cartId} is invalid` })
        const searchProduct = await ProductModel.findOne({ _id: productId })
        if (!searchProduct) return res.status(404).send({ status: false, message: "product does not exist" })

        if (searchProduct.isDeleted === true) return res.status(400).send({ status: false, message: "Product is already deleted" })

        if (!isValid(removeProduct)) return res.status(400).send({ status: false, message: "removeProduct is required" })

        if (!isValidremoveProduct(removeProduct)) return res.status(400).send({ status: false, message: "enter valid removeproduct" })

        let cart = searchCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * searchProduct.price 

                if (removeProduct == 0) {
                    const productRemove = await CartModel.findOneAndUpdate(
                        { _id: cartId },
                        {
                            $pull: { items: { productId: productId } },
                            totalPrice: searchCart.totalPrice - priceChange, 
                            totalItems: searchCart.totalItems - 1 
                        },
                        { new: true })
                    return res.status(200).send({ status: true, message: "Removed product successfully", data: productRemove })
                }

                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await CartModel.findOneAndUpdate(
                            { _id: cartId },
                            {
                                $pull: { items: { productId } },
                                totalPrice: searchCart.totalPrice - priceChange, 
                                totalItems: searchCart.totalItems - 1  
                            },
                            { new: true })
                        return res.status(200).send({ status: true, message: "Successfully removed product or cart is empty", data: priceUpdate })
                    }

                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await CartModel.findByIdAndUpdate(
                        { _id: cartId },
                        {
                            items: cart,
                            totalPrice: searchCart.totalPrice - searchProduct.price 
                        },
                        { new: true })
                    return res.status(200).send({ status: true, message: "sucessfully decremented the product", data: updatedCart })
                }
            }
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send({ status: false, message: error.message });
    }
}

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "enter valid userId" });
        }

        let checkUserId = await UserModel.findOne({ _id: userId })
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: `User doesn't exist by ${userId}` })
        }
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        let data = await CartModel.findOne({ userId })
        if (!data) {
            return res.status(404).send({ status: false, message: `Cart does not Exist with user id :${userId}` })
        }

        res.status(200).send({ status: true, data: data })

    } catch (err) {
        res.status(500).send({ err: err.message });
    }
};

const deleteCart = async function (req, res) {
    try {

        // Validate params
        userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is invalid` })
        }

        //  To check user is present or not
        const userSearch = await UserModel.findById({ _id: userId })
        if (!userSearch) {
            return res.status(404).send({ status: false, message: "User doesnot exist" })
        }

        // AUTHORISATION
        // if (req.decodedToken != userId) return res.status(403).send({ status: false, message: "Error, authorization failed" })

        // To check cart is present or not
        const cartSearch = await CartModel.findOne({ userId })
        if (!cartSearch) {
            return res.status(404).send({ status: false, message: "cart doesnot exist" })
        }

        const cartdelete = await CartModel.findOneAndUpdate({ userId },
            {
                $set:
                {
                    items: [],
                    totalItems: 0,
                    totalPrice: 0
                }
            },
            { new: true })
        return res.status(204).send({ status: true, message: "Cart deleted" })

    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }