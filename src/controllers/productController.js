const ProductModel = require('../models/productModel.js');
const { uploadFile } = require("../aws/aws.js");

const { isValidObjectId, isValid, isValidRequest, addressValid, imageValid, isValidSizes, nameRegex, alphaNumericValid } = require('../validators/validations.js');


//===================================================[API:FOR CREATING PRODUCT DB]===========================================================

const createProduct = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        let files = req.files;

        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Product data is required" });


        if (await ProductModel.findOne({ title: data.title })) {
            return res.status(400).send({ status: false, message: "Product already exists" });
        }
        //validation for title
        if (!isValid(data.title))
            return res.status(400).send({ status: false, message: "Title is required" });
        if (!alphaNumericValid(data.title))
            return res.status(400).send({ status: false, message: "Please provide valid title-name of the prodduct" });

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
        if (isNaN(Number(data.price)))            // apply regex
            return res.status(400).send({ status: false, message: "Price should be Number" });

        //validations for currencyId
        if (!isValid(data.currencyId))
            return res.status(400).send({ status: false, message: "CurrencyId is required" });
        // if (!(data.currencyId == "INR"))
        //     return res.status(400).send({ status: false, message: "CurrencyId shoould INR" });

        // validations for currencyFormat
        // if (!isValid(data.currencyFormat))
        //     return res.status(400).send({ status: false, message: "Currency Format is required" });
        // if (!(data.currencyFormat == "₹"))
        //     return res.status(400).send({ status: false, message: "CurrencyFormat should be '₹'" });

        if(data.currencyId === 'INR' || data.currencyId === 'USD') {
            return res.status(400).send({status: false , message: "only this"})
        }




        //validation for isFreeShipping
        if (data.isFreeShipping) {
            if (!isValid(data.isFreeShipping))
                return res.status(400).send({ status: false, message: "FreeShipping is required" });
            if (!((data.isFreeShipping == "true") || (data.isFreeShipping == "false")))
                return res.status(400).send({ status: false, message: "isFreeShipping is boolean" });
        }

        if (data.style)
            if (!nameRegex(data.style))
                return res.status(400).send({ status: false, message: "Please provide valid style-name of the prodduct" });

        // validations for availableSize
        if (data.availableSizes) {
            let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            data.availableSizes = data.availableSizes.split(',').map(x => x.trim())
            for (i = 0; i < data.availableSizes.length; i++) {
                if (!(existingSize.includes(data.availableSizes[i].trim()))) {
                    return res.send({ status: false, message: "Size should be in 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" })
                }
            }
        }
        // if (!data.availableSizes)
        //     return res.status(400).send({ status: false, message: "Please provide the required size" });

        // let sizeArr = { $in: data.availableSizes.split(",") }
        // if (sizeArr.length == 1) {
        //     if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[0]) == -1) {
        //         return res.status(400).send({ satus: false, message: "Available sizes should be among S,XS,M,X,L,XXL,XL" });
        //     }
        // }
        // else {
        //     for (let i = 0; i < sizeArr.length; i++) {
        //         if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[i]) === -1) {
        //             return res.status(400).send({ status: false, message: "Available sizes should be among S,XS,M,X,L,XXL,XL" });
        //         }
        //     }
        // }

        if (data.installments) {
            if (!Number.isInteger(Number(data.installments)))
                return res.status(400).send({ status: false, message: "Enter valid Installments(i.e. it must be a whole number)" });
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

        let savedData = await ProductModel.create(data);
        return res.status(201).send({ status: true, message: "Success", data: savedData });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//===================================================[API:FOR GETTING LIST OF ALL PRODUCTS]===========================================================


const getProductDetails = async function (req, res) {
    try {
        let data = req.query;
        let filter = { isDeleted: false };

        if (Object.keys(data).length !== 0) {

            let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;

            if (size) {

                if (Array.isArray(isValidSizes(size))) {
                    filter.size = { $in: isValidSizes(size) }
                } else {
                    let givenSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                    return res.status(400).send({ status: false, message: `size should be one these only ${givenSizes}` })
                }

                filter.availableSizes = size.trim();

            }

            if (name) {
                if (!addressValid(name))
                    return res.status(400).send({ status: false, message: "Product title is required111" });
                if (!isValid(name))
                    return res.status(400).send({ status: false, message: "Product title is required" });

                filter["title"] = name;
                filter.title = { $regex: name };
            };


            if (priceGreaterThan || priceLessThan) {
                filter.price = {}

                if (priceGreaterThan) {
                    if (isNaN(priceGreaterThan))
                        return res.status(400).send({ status: false, message: "Product title is required priceGreaterThan" });

                    priceGreaterThan = Number(priceGreaterThan)
                    filter.price.$gt = priceGreaterThan;
                }
                if (priceLessThan) {
                    if (isNaN(priceLessThan))
                        return res.status(400).send({ status: false, message: "Product title is required  priceLessThan" });

                    priceLessThan = Number(priceLessThan)
                    filter.price.$lt = priceLessThan;
                }
            }

            if ((priceGreaterThan && priceLessThan) && (priceGreaterThan > priceLessThan))
                return res.status(404).send({ status: false, message: "Invalid price range" });

            if (priceSort) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: true, message: 'In price sort it contains only 1 & -1' });
                }

                const products = await ProductModel.find(filter).sort({ price: priceSort });

                if (!products) return res.status(404).send({ status: false, message: 'No products found' })
                return res.status(200).send({ status: true, message: 'Success', data: products });
            }
        }

        const findData = await ProductModel.find(filter);
        if (findData.length == 0)
            return res.status(404).send({ status: false, message: 'No findData found' });

        return res.status(200).send({ status: true, message: "Success", data: findData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//===================================================[API:FOR GETTING LIST OF ALL PRODUCT BY PRODUCTID]===========================================================


const getProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not valid PRODUCT ID` })
        }

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
        let productId = req.params.productId;
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "enter valid productid" })
        console.log(productId)
        const findProduct = await ProductModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) 
        return res.status(404).send({ status: false, message: "product not available" })

        let requestBody = req.body;
        let files = req.files;

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = requestBody

        if (!files && !isValidRequest(requestBody))
            return res.status(400).send({ status: false, message: "Updates a product at least one or more fields" });

        if (title) {
            if (findProduct.title === title.trim())
                return res.status(400).send({ status: false, message: "title is already present" });
            // if (!isValid(title))
            //     return res.status(400).send({ status: false, message: "title is required" });
            if (!alphaNumericValid(title))
                return res.status(400).send({ status: false, message: "enter valid title name" });
            //findProduct.title = title;
        }
        // no need to validate

        // if (description) {
            
        //     // if (!isValid(description))
        //     //     return res.status(400).send({ status: false, message: "description is required" });
        //     if (!alphaNumericValid(description))
        //         return res.status(400).send({ status: false, message: "enter valid description" });
        //     //findProduct.description = description
        // }


        if (price) {
            if (isNaN(price))
                return res.status(400).send({ status: false, message: "enter valid price" })
            if (price == 0)
                return res.status(400).send({ status: false, message: "price shoould not zero" })
            //findProduct.price = price
        }

        if (currencyId) {
            if (!(currencyId == "INR"))
                return res.status(400).send({ status: false, message: "currencyId shoould INR" })
            // currencyId = currencyId
        }

        if (currencyFormat) {
            if (!(currencyFormat == "₹"))
                return res.status(400).send({ status: false, message: "currencyFormat should be '₹'" })
            //findProduct.currencyId = currencyId
        }

        if (availableSizes) {
            //console.log(availableSizes)
            let existingSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            availableSizes = availableSizes.split(',').map(x => x.trim())
            for (i = 0; i < availableSizes.length; i++) {
                if (!(existingSize.includes(availableSizes[i].trim()))) {
                    return res.send({ status: false, message: "Size should be in 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" })
                }
            }
            // for (let i = 0; i < findProduct.availableSizes.length; i++) {
            //     var arr = [];
            //     if (findProduct.availableSizes.indexOf(requestBody.availableSizes) == -1);

            // }
            // //console.log(findProduct)
            // findProduct.availableSizes(...requestBody.availableSizes)
            //findProduct.availableSizes = requestBody.availableSizes
        }

        if (isFreeShipping) {

            if (!((isFreeShipping == "true") || (isFreeShipping == "false")))
                // if(typeof isFreeShipping !== "boolean")
                return res.status(400).send({ status: false, message: "isFreeShipping must be a type of boolean" })
            // findProduct.isFreeShipping = isFreeShipping
        }

        if (style) {
            if (!nameRegex(style)) return res.status(400).send({ status: false, message: "Enter valid style" });
            // findProduct.style = style
        }

        if (installments) {
            if (!Number.isInteger(Number(installments))) return res.status(400).send({ status: false, message: "enter valid installments" })
            // findProduct.installments = installments
        }


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
        newData.availableSizes = availableSizes;
        newData.installments = installments;


        const updateProduct = await ProductModel.findOneAndUpdate({ _id: productId }, newData, { new: true })
        //         {$set:{
        //             title:title,
        //             description:description,
        //         price:price,
        //         currencyId:currencyId,
        //         currencyFormat:currencyFormat,
        //         style:style,
        //         availableSizes:availableSizes,
        //         installments:installments,
        //         productImage:productImage
        //     }, 
        //    $push:{ availableSizes : req.body.availableSizes }

        // },
        return res.status(200).send({ status: true, message: "Success", data: updateProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//===================================================[API:FOR DELETE PRODUCT BY PRODUCT ID]===========================================================

const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId;

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Please provide valid format of productId" });

        const deletedProduct = await ProductModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true });
        if (!deletedProduct)
            return res.status(404).send({ status: false, message: `No product is found with this Id: ${productId}, or it must be deleted` })

        return res.status(200).send({ status: true, message: "Success", data: "Product is deleted successfully" })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




module.exports = { createProduct, getProductDetails, deleteProduct, updateProduct, getProduct }