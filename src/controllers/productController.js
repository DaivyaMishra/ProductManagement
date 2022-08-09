const ProductModel = require('../models/productModel.js');
const { uploadFile } = require("../aws/aws.js");

const { isValidObjectId, isValid, isValidRequest, imageValid, isValidSizes, nameRegex, alphaNumericValid } = require('../validators/validations.js');


//===================================================[API:FOR CREATING PRODUCT DB]===========================================================

const createProduct = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));  // for form data
        let files = req.files;

        // validation for empty body
        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Product data is required" });

        //validation for title
        if (!isValid(data.title))
            return res.status(400).send({ status: false, message: "Title is required" });
        if (!alphaNumericValid(data.title))
            return res.status(400).send({ status: false, message: "Please provide valid title-name of the prodduct" });
        // uniqueness of the title
        if (await ProductModel.findOne({ title: data.title })) {
            return res.status(400).send({ status: false, message: "Product already exists" });
        }


        //validation for description
        if (!isValid(data.description))
            return res.status(400).send({ status: false, message: "Description is required " });
        if (!alphaNumericValid(data.description))
            return res.status(400).send({ status: false, message: "Please provide valid description" });

        //validation for price
        if (!isValid(data.price))
            return res.status(400).send({ status: false, message: "Price is required " });
        if (data.price <= 0)
            return res.status(400).send({ status: false, message: "Price cannot be zero" });
        if (isNaN(Number(data.price)))
            return res.status(400).send({ status: false, message: "Price should be Number" });

        //validations for currencyId
        if (!isValid(data.currencyId))
            return res.status(400).send({ status: false, message: "CurrencyId is required" });
        if (!(data.currencyId == "INR"))
            return res.status(400).send({ status: false, message: "CurrencyId shoould INR" });

        // validations for currencyFormat
        if (!isValid(data.currencyFormat))
            return res.status(400).send({ status: false, message: "currencyFormat is required" });
        if (!(data.currencyFormat == "₹"))
            return res.status(400).send({ status: false, message: "CurrencyFormat should be '₹'" });

        //validation for isFreeShipping
        if (data.hasOwnProperty("isFreeShipping")) {
            if (!isValid(data.isFreeShipping))
                return res.status(400).send({ status: false, message: "FreeShipping is required" });
            if (!((data.isFreeShipping == "true") || (data.isFreeShipping == "false")))
                return res.status(400).send({ status: false, message: "isFreeShipping is boolean" });
        }

        if (data.hasOwnProperty("style")) {
            if (!isValid(data.style))
                return res.status(400).send({ status: false, message: "Product style-name is required" });
            if (!nameRegex(data.style))
                return res.status(400).send({ status: false, message: "Please provide valid style-name of the prodduct" });
        }

        if (data.hasOwnProperty("installments")) {
            if (!isValid(data.installments))
                return res.status(400).send({ status: false, message: "Product installments is required" });
            if (!Number.isInteger(Number(data.installments)))
                return res.status(400).send({ status: false, message: "Enter valid Installments(i.e. it must be a whole number)" });
        }

        // validations for availableSize
        if (data.hasOwnProperty("availableSizes")) {
            if (!isValid(data.availableSizes))
                return res.status(400).send({ status: false, message: "Product availableSizes is required" });
            data.availableSizes = data.availableSizes.toUpperCase();

            let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            data.availableSizes = data.availableSizes.split(',').map(x => x.trim())
            for (i = 0; i < data.availableSizes.length; i++) {
                if (!(existingSize.includes(data.availableSizes[i].trim()))) {
                    return res.status(400).send({ status: false, message: "Size should be in 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" })
                }
            }
        }

        //validations for product image
        if (data.hasOwnProperty("productImage") || !files) {
            return res.status(400).send({ status: false, message: "productImage is required" });
        }
        if (files.length == 0) {
            return res.status(400).send({ status: false, message: "No product image found" });
        }
        if (!imageValid(files[0].originalname)) {
            return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
        }

        //uploading the photo
        let fileUrl = await uploadFile(files[0]);
        data.productImage = fileUrl;


        // creating the collection
        let savedData = await ProductModel.create(data);

        const finalResponse = {
            _id: savedData._id,
            title: savedData.title,
            description: savedData.description,
            price: savedData.price,
            currencyId: savedData.currencyId,
            currencyFormat: savedData.currencyFormat,
            isFreeShipping: savedData.isFreeShipping,
            productImage: savedData.productImage,
            style: savedData.style,
            availableSizes: savedData.availableSizes,
            installments: savedData.installments,
            deletedAt: savedData.deletedAt,
            isDeleted: savedData.isDeleted,
            createdAt: savedData.createdAt,
            updatedAt: savedData.updatedAt
        }
        return res.status(201).send({ status: true, message: "Success", data: finalResponse });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//===================================================[API:FOR GETTING LIST OF ALL PRODUCTS]===========================================================


const getProductDetails = async function (req, res) {
    try {
        let data = req.query;
        let filter = { isDeleted: false };

        // validation for the empty body
        if (isValidRequest(data)) {

            let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;

            // validation for size
            if (size) {
                size = size.toUpperCase()
                if (!(isValidSizes(size))) {
                    let givenSizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']
                    return res.status(400).send({ status: false, message: `size should be one these only ${givenSizes}` })

                } else {
                    size = size.split(',')
                    filter.availableSizes = { $in: size }

                }
            }
            // validation for name
            if (name) {
                if (!isValid(name))
                    return res.status(400).send({ status: false, message: "Product title is required" });
                if (!alphaNumericValid(name))
                    return res.status(400).send({ status: false, message: "Product title should be valid" });

                filter.title = { $regex: name }; // check the substring
            };

            // validation for price
            if (priceGreaterThan || priceLessThan) {
                filter.price = {}

                if (priceGreaterThan) {
                    if (isNaN(priceGreaterThan))
                        return res.status(400).send({ status: false, message: "priceGreaterThan is required and should be valid" });

                    priceGreaterThan = Number(priceGreaterThan)
                    filter.price.$gte = priceGreaterThan;
                }
                if (priceLessThan) {
                    if (isNaN(priceLessThan))
                        return res.status(400).send({ status: false, message: "priceLessThan  is required and should be valid" });

                    priceLessThan = Number(priceLessThan)
                    filter.price.$lte = priceLessThan;
                }
            }

            if ((priceGreaterThan && priceLessThan) && (priceGreaterThan > priceLessThan))
                return res.status(400).send({ status: false, message: "Invalid price range" });

            // validation for price sorting
            if (priceSort) {
                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: 'In price sort it contains only 1 & -1' });
                }

                const products = await ProductModel.find(filter).sort({ price: priceSort });

                if (!products) return res.status(404).send({ status: false, message: 'No products found' })
                return res.status(200).send({ status: true, message: 'Success', data: products });
            }
        }

        // find collection without filters
        const findData = await ProductModel.find(filter).sort({ price: 1 });
        if (findData.length == 0)
            return res.status(404).send({ status: false, message: 'No products found' });

        return res.status(200).send({ status: true, message: "Success", data: findData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//===================================================[API:FOR GETTING LIST OF ALL PRODUCT BY PRODUCTID]===========================================================


const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId

        // validation for productID
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not valid PRODUCT ID` })
        }

        // finding the product with db call
        const getDetails = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!getDetails) {
            return res.status(404).send({ status: false, message: `Product with ID: ${productId} is not FOUND` })
        }

        return res.status(200).send({ status: true, message: "Success", data: getDetails })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


//===================================================[API:FOR UPDATE PRODUCT]===========================================================

const updateProduct = async function (req, res) {
    try {
        let requestBody = JSON.parse(JSON.stringify(req.body));
        let files = req.files;
        let productId = req.params.productId;

        // validation for product ID
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Enter valid productid" })

        // checking product existing or not
        const findProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct)
            return res.status(404).send({ status: false, message: "Product not available" })

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = requestBody

        //checking for the empty body
        if (!files && !isValidRequest(requestBody))
            return res.status(400).send({ status: false, message: "Updates a product at least one or more fields" });

        // validation for the title
        if (requestBody.hasOwnProperty("title")) {
            if (!isValid(title))
                return res.status(400).send({ status: false, message: "Product title is required" });
            if (findProduct.title === title.trim())
                return res.status(400).send({ status: false, message: "title is already present" });
            if (!alphaNumericValid(title))
                return res.status(400).send({ status: false, message: "Enter valid title name" });
        }

        // validation for the description
        if (requestBody.hasOwnProperty("description")) {
            if (!isValid(description))
                return res.status(400).send({ status: false, message: "Product description is required" });
            if (!alphaNumericValid(description))
                return res.status(400).send({ status: false, message: "Enter valid description" });
        }

        // validation for the price
        if (requestBody.hasOwnProperty("price")) {
            if (!isValid(price))
                return res.status(400).send({ status: false, message: "Product price is required" });
            if (isNaN(price))
                return res.status(400).send({ status: false, message: "Enter valid price" })
            if (price <= 0)
                return res.status(400).send({ status: false, message: "Price should not zero" })
        }

        // validation for the currencyId
        if (requestBody.hasOwnProperty("currencyId")) {
            if (!isValid(currencyId))
                return res.status(400).send({ status: false, message: "currencyId is required" });
            if (!(currencyId == "INR"))
                return res.status(400).send({ status: false, message: "currencyId shoould INR" })
        }

        // validation for the currencyFormat
        if (requestBody.hasOwnProperty("currencyFormat")) {
            if (!isValid(currencyFormat))
                return res.status(400).send({ status: false, message: "currencyFormat is required" });
            if (!(currencyFormat == "₹"))
                return res.status(400).send({ status: false, message: "currencyFormat should be '₹'" })
        }

        // validation for the availableSizes
        let size = {}
        if (requestBody.hasOwnProperty("availableSizes")) {
            availableSizes = availableSizes.toUpperCase()
            if (!isValid(availableSizes))
                return res.status(400).send({ status: false, message: "availableSizes is required" });

            let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            availableSizes = availableSizes.split(',').map(x => x.trim())
            for (i = 0; i < availableSizes.length; i++) {
                if (!existingSize.includes(availableSizes[i])) {
                    return res.status(400).send({ status: false, message: `${existingSize}` })
                }
            }
            size.availableSizes = { $each: availableSizes }
        }

        // validation for the isFreeShipping
        if (requestBody.hasOwnProperty("isFreeShipping")) {
            if (!isValid(isFreeShipping))
                return res.status(400).send({ status: false, message: "FreeShipping is required" });
            if (!((isFreeShipping == "true") || (isFreeShipping == "false")))
                return res.status(400).send({ status: false, message: "isFreeShipping must be a type of boolean" })
        }

        // validation for the style
        if (requestBody.hasOwnProperty("style")) {
            if (!isValid(style))
                return res.status(400).send({ status: false, message: "Product style-name is required" })
            if (!nameRegex(style))
                return res.status(400).send({ status: false, message: "Enter valid style" });
        }

        // validation for the installments
        if (requestBody.hasOwnProperty("installments")) {
            if (!isValid(installments))
                return res.status(400).send({ status: false, message: "installments is required" })
            if (!Number.isInteger(Number(installments)))
                return res.status(400).send({ status: false, message: "enter valid installments" })
        }

        // validation for the files/ productImage
        if (files && files.length > 0) {
            if (files.length == 0)
                return res.status(400).send({ status: false, message: "No product image found" });
            if (!imageValid(files[0].originalname)) {
                return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
            }
            var fileUrl = await uploadFile(files[0]);
        }

        const newData = {};
        newData.title = title;
        newData.description = description;
        newData.price = price;
        newData.currencyId = currencyId;
        newData.currencyFormat = currencyFormat;
        newData.isFreeShipping = isFreeShipping;
        newData.productImage = fileUrl;
        newData.style = style;
        newData.installments = installments;

        const updateProduct = await ProductModel.findOneAndUpdate({ _id: productId }, { $set: newData, $addToSet: size }, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updateProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//===================================================[API:FOR DELETE PRODUCT BY PRODUCT ID]===========================================================


const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId;

        // validation of productId
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Please provide valid format of productId" });

        // updating isDeleted key
        const deletedProduct = await ProductModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true });
        if (!deletedProduct)
            return res.status(404).send({ status: false, message: `No product is found with this Id: ${productId}, or it must be deleted` })

        return res.status(200).send({ status: true, message: "Success", data: "Product is deleted successfully" })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { createProduct, getProductDetails, getProductById, updateProduct, deleteProduct }