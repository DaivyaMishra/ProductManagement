const CartModel = require('../models/cartModel.js');
const UserModel = require('../models/userModel.js');
const ProductModel = require('../models/productModel.js');

const { isValidObjectId, isValid, isValidRequest, isValidremoveProduct } = require('../validators/validations.js');


//===================================================[API:FOR CREATING CART DB]===========================================================


const createCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let data = req.body;
        const { productId, cartId } = data;

        // validation for empty body
        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        // validation for productId
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" });
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` });

        // finding the user
        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        //authorizatiion
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        // finding the product
        const findProduct = await ProductModel.findOne({ _id: data.productId, isDeleted: false });
        if (!findProduct)
            return res.status(404).send({ status: false, message: "Product details are not found please select the product items" });

        // finding the cart with userID
        const findCart = await CartModel.findOne({ userId: userId });

        // if cart is not present
        if (!findCart) {
            if (cartId)
                return res.status(404).send({ status: false, message: `Cart not exists for this userId: ${userId}` });

            // creatiging the new Cart
            let cartData = {
                userId: userId,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalPrice: findProduct.price,
                totalItems: 1
            };

            //  creating the cart and populate the product details
            await CartModel.create(cartData);
            const finalCart = await CartModel.findOne(cartData).populate({ path: 'items.productId', select: { '_id': 1, 'title': 1, 'price': 1, 'productImage': 1, 'description': 1 } })
            return res.status(201).send({ status: true, message: "Success", data: finalCart });
        }

        // cart is already present
        if (findCart) {
            if (!isValid(cartId))
                return res.status(400).send({ status: false, message: "Please provide cartId" });
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: `The given cartId: ${data.cartId} is not in proper format` });
            if (findCart._id.toString() != cartId)
                return res.status(400).send({ status: false, message: `cartId provided does not belongs to this user with userId: ${userId}` });

            // updating the same prduct quantity
            const array = findCart.items;
            for (let i = 0; i < array.length; i++) {
                if (array[i].productId == productId) {
                    array[i].quantity++;
                    const updatedCart = await CartModel.findOneAndUpdate(
                        { userId: userId },
                        { items: array, totalPrice: findCart.totalPrice + findProduct.price },
                        { new: true }).populate({ path: 'items.productId', select: { _id: 1, title: 1, price: 1, productImage: 1, description: 1 } });

                    return res.status(200).send({ status: true, message: "Success", data: updatedCart });

                }
            }

            // adding the new product to the cart
            let obj = {}
            obj.productId = findProduct._id,
                obj.quantity = 1,
                findCart.items.push(obj);

            // updating the total price and total items 
            findCart.totalPrice = findCart.totalPrice + findProduct.price;
            findCart.totalItems = findCart.items.length;
            findCart.save();
            return res.status(200).send({ status: true, message: 'Success', data: findCart });

        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


//===================================================[API:FOR UPDATE CART]===========================================================


const updateCart = async function (req, res) {
    try {
        userId = req.params.userId

        // validation for userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `${userId} is invalid` })

        // seaarching the user Id
        const searchUser = await UserModel.findOne({ _id: userId })
        if (!searchUser)
            return res.status(404).send({ status: false, message: "User does not exist" })

        //Authorization 
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" })

        const data = req.body;
        let { cartId, productId, removeProduct } = data;

        // checking body for empty or not 
        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Request body cannot remain empty" })

        // validation for productId
        if (!isValid(productId))
            return res.status(400).send({ status: false, message: "Please provide productId" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `The given productId: ${productId} is not in proper format` })

        const searchProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!searchProduct)
            return res.status(404).send({ status: false, message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists` });

        // validation for cartId
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "Please provide cartId" })
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` })

        //checking cart details available or not 
        const searchCart = await CartModel.findOne({ _id: cartId })
        if (!searchCart)
            return res.status(404).send({ status: false, message: `Cart does not exists with this provided cartId: ${cartId}` })

        //check for the empty items i.e., cart is now empty
        if (searchCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        // validatiion for removeProduct
        if (!isValid(removeProduct))
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        if (!isValidremoveProduct(removeProduct))
            return res.status(400).send({ status: false, message: "Enter valid removeproduct it can be only be '0' & '1'" })

        let cart = searchCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * searchProduct.price

                // directly remove a product from the cart ireespective of its quantity
                if (removeProduct == 0) {
                    const productRemove = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: productRemove })
                }

                // remove the product when its quantity is 1
                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: searchCart.totalPrice - priceChange, totalItems: searchCart.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, message: 'Success', data: priceUpdate })
                    }

                    // decrease the products quantity by 1
                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await CartModel.findByIdAndUpdate({ _id: cartId }, { items: cart, totalPrice: searchCart.totalPrice - searchProduct.price }, { new: true })
                    return res.status(200).send({ status: true, message: 'Success', data: updatedCart })
                }
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


//===================================================[API:FOR GETTING THE CART DETAILS]===========================================================


const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        // validation for userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });
        }

        let checkUserId = await UserModel.findOne({ _id: userId })
        if (!checkUserId) {
            return res.status(404).send({ status: false, message: `User details are not found with this userId ${userId}` })
        }

        //authorization
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        let getData = await CartModel.findOne({ userId });
        if (getData.items.length == 0)
            return res.status(400).send({ status: false, message: "No items present" });

        if (!getData) {
            return res.status(404).send({ status: false, message: `Cart does not Exist with this userId :${userId}` })
        }

        res.status(200).send({ status: true, message: 'Success', data: getData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};


//===================================================[API:FOR DELETING THE CART DETAILS]===========================================================


const deleteCart = async function (req, res) {
    try {

        // Validate params
        userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` })
        }

        //  To check user is present or not
        const userSearch = await UserModel.findById({ _id: userId })
        if (!userSearch) {
            return res.status(404).send({ status: false, message: `User details are not found with this userId ${userId}` })
        }

        // AUTHORISATION
        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" })

        // To check cart is present or not
        const cartSearch = await CartModel.findOne({ userId })
        if (!cartSearch) {
            return res.status(404).send({ status: false, message: "Cart details are not found " })
        }

        const cartDelete = await CartModel.findOneAndUpdate({ userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })
        return res.status(204).send({ status: true, message: 'Success', data: "Cart is deleted successfully" })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart }