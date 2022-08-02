const express = require('express');
const router = express.Router();


//===============================================[ALL MODULES ARE REQUIRED HERE]===========================================================
const { createUser, loginUser, getUser, updateProfile } = require("../controllers/userController.js");
const { authentication } = require("../middleware/auth.js");


const { createProduct, getProductDetails, getProduct, deleteProduct, updateProduct } = require("../controllers/productController.js");
const { createCart, updateCart, getCart, deleteCart } = require("../controllers/cartController.js");


const { createOrder, updateOrder } = require("../controllers/orderController.js");

//===================================================[USER ROUTE HANDLER]===========================================================

router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/user/:userId/profile', authentication, getUser);
router.put('/user/:userId/profile', authentication, updateProfile);

//===================================================[PRODUCT ROUTE HANDLER]===========================================================

router.post('/products', createProduct);
router.get('/products', getProductDetails);
router.get('/products/:productId', getProduct);
router.delete('/products/:productId', deleteProduct);
router.put('/products/:productId', updateProduct);


//===================================================[CART ROUTE HANDLER]===========================================================
router.post('/users/:userId/cart', authentication, createCart);
router.put('/users/:userId/cart', authentication, updateCart);
router.get('/users/:userId/cart', authentication, getCart);
router.delete('/users/:userId/cart', authentication, deleteCart);


//===================================================[ORDER ROUTE HANDLER]===========================================================
 router.post('/users/:userId/orders', authentication, createOrder);
 router.put('/users/:userId/orders', authentication, updateOrder);


module.exports = router;