

const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');


const productsList = async (req, res) => {


    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';


        const productFilter = {
            $or: [
                { productName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { brand: { $regex: searchQuery, $options: 'i' } },
                //    { regularPrice: { $regex: searchQuery, $options: 'i' } },
                //     { salePrice: { $regex: searchQuery, $options: 'i' } },
                //    { productOffer: { $regex: searchQuery, $options: 'i' } },
                { status: { $regex: searchQuery, $options: 'i' } },
                { 'categoryId.categoryName': { $regex: searchQuery, $options: 'i' } } // Assuming categoryId is populated
            ]
        };

        // If searchQuery is a number, apply filters to the number fields
        const numberQuery = parseFloat(searchQuery);
        if (!isNaN(numberQuery)) {
            productFilter.$or.push(
                { regularPrice: numberQuery },
                { salePrice: numberQuery },
                { productOffer: numberQuery }
            );
        }
        const productData = await Product.find(productFilter)
            .populate('categoryId')  // Ensure category is populated
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);



        const totalProducts = await Product.countDocuments(productFilter);
        const totalPages = Math.ceil(totalProducts / limit);




        res.render('./products/products', {
            products: productData,
            currentPage: page,
            totalPage: totalPages,
            totalProducts: totalProducts,
            searchQuery: searchQuery,
            error: req.flash('error'),
            message: req.flash('message')
        });

    } catch (error) {
        console.error(error);
        req.flash('error', 'Failed to retrieve products.');
        res.redirect('/admin/products');
    }
}



const loadAddProduct = async (req, res) => {
    try {
        const categoryData = await Category.find({ isListed: true });

        // Get flash messages
        const errorMessage = req.flash('error'); // Get any error messages

        res.render('./products/add-products', {
            cat: categoryData,
            messages: {
                error: errorMessage.length > 0 ? errorMessage[0] : null // Pass the first error message, if any
            }
        });
    } catch (error) {
        console.log(error.message);
        res.redirect('/500');
    }
};



const addNewProduct = async (req, res) => {
    try {
        // Validate input
        const regularPrice = parseFloat(req.body.regularPrice);
        const productOffer = parseFloat(req.body.productOffer) || 0;
        const taxValue = parseFloat(req.body.taxValue) || 0;
        console.log(req.body, 'add')
        if (isNaN(regularPrice) || regularPrice < 0) {
            req.flash('error', ' Regular pricecannot be negative ');
            return res.redirect('/admin/add-products');
        }

        if (productOffer < 0) {
            req.flash('error', 'Product offer cannot be negative');
            return res.redirect('/admin/add-products');
        }

        if (taxValue < 0) {
            req.flash('error', 'Tax value cannot be negative');
            return res.redirect('/admin/add-products');
        }

        // Check if the product with the same name already exists
        const productName = req.body.productName?.trim(); // Use optional chaining to avoid accessing undefined
        if (!productName) {
            req.flash('error', 'Product name is required');
            return res.redirect('/admin/add-products');
        }

        const existingProduct = await Product.findOne({ productName });
        if (existingProduct) {
            req.flash('error', 'A product with the same name already exists.');
            return res.redirect('/admin/add-products');
        }

        // Fetch the category offer and handle offer comparison
        const categoryOffer = await Category.findById(req.body.categoryId).select('offer').lean();
        const finalOffer = Math.max(productOffer, categoryOffer?.offer || 0); // Use whichever offer is larger

        // Apply the offer to calculate the sale price
        let salePrice = regularPrice;
        if (req.body.discountType === 'percentage') {
            salePrice -= (salePrice * finalOffer / 100);
        } else {
            salePrice -= finalOffer;
        }
        salePrice = Math.max(0, Math.round(salePrice)); // Ensure sale price is not negative

        // Calculate tax
        const taxAmount = req.body.taxType === 'percentage'
            ? salePrice * taxValue / 100
            : taxValue;
        const finalPrice = Math.round(salePrice + taxAmount); // Final price including tax

        // Handle sizes
        const sizes = req.body.sizes || [];
        let totalQuantity = 0;
        const sizesData = sizes.map(sizeEntry => {
            const quantity = parseInt(sizeEntry.quantity) || 0;
            if (quantity < 0) {
                req.flash('error', 'Quantity for size ' + sizeEntry.size + ' cannot be negative');
                throw new Error('Negative quantity not allowed');
            }
            totalQuantity += quantity;
            return {
                size: sizeEntry.size,
                quantity: quantity
            };
        });

        // Ensure the total quantity reflects the sum of sizes
        if (totalQuantity === 0) {
            req.flash('error', 'Total quantity must be greater than zero');
            return res.redirect('/admin/add-products');
        }

        // Resize images and store paths
        const imagePromises = req.files.map(async (file) => {
            const imagePath = path.join('public', 'uploads', file.filename);
            const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

            try {
                await sharp(imagePath)
                    .resize({ width: 400, height: 400 })
                    .toFile(resizedImagePath);
                return resizedImagePath.replace('public/', ''); // Return path relative to 'public/'
            } catch (error) {
                console.error('Error processing image', error);
                throw error;
            }
        });

        const resizedImageUrls = await Promise.all(imagePromises);

        // Determine status based on quantity
        const status = totalQuantity === 0 ? 'Out of Stock' : 'Available';

        // Prepare product data
        const productData = {
            productName: productName,
            description: req.body.description?.trim() || '', // Default empty string if undefined
            categoryId: req.body.categoryId,
            brand: req.body.brand?.trim() || '', // Handle brand safely
            regularPrice: regularPrice,
            salePrice: finalPrice,
            productOffer: Math.round(productOffer),
            tax: Math.round(taxValue),
            offerDescription: req.body.offerDescription?.trim() || '', // Default empty string if undefined
            quantity: totalQuantity,
            colour: req.body.color?.trim() || '', // Handle color safely
            productImages: resizedImageUrls,
            sizes: sizesData,
            status: status,
        };

        console.log(req.body);

        // Save the product to the database
        const product = new Product(productData);
        const savedProduct = await product.save();

        if (savedProduct) {
            req.flash('success', 'Product added successfully');
            res.redirect('/admin/products');
        } else {
            req.flash('error', 'Error saving product');
            res.redirect('/admin/add-products');
        }
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'An error occurred while adding the product');
        // next(error)
        res.redirect('/500');
    }
};



const loadEditProduct = async (req, res) => {
    try {
        const id = req.params.id; // Get the product ID from the URL parameters
        const product = await Product.findById(id); // Fetch the product by ID

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products'); // Redirect to products list
        }

        // Fetch categories for the select dropdown
        const categories = await Category.find({ isListed: true }); // Adjust the path according to your project structure

        // Render the edit form with product data
        res.render('./products/edit-product', {
            product,
            cat: categories,
            message: req.flash('errors') // Pass flash messages to the template
        });
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'An error occurred while loading the product');
        res.redirect('/500'); // Redirect to a custom error page
    }
};


const editProduct = async (req, res) => {
    const id = req.params.id;
    try {
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
            req.flash('errors', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Validate input
        const regularPrice = parseFloat(req.body.regularPrice);
        const productOffer = parseFloat(req.body.productOffer) || 0;
        const taxValue = parseFloat(req.body.taxValue) || 0;

        if (isNaN(regularPrice) || regularPrice < 0) {
            req.flash('errors', 'Invalid regular price');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        if (productOffer < 0) {
            req.flash('errors', 'Product offer cannot be negative');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        if (taxValue < 0) {
            req.flash('errors', 'Tax value cannot be negative');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Validate product name
        const productName = req.body.productName?.trim();
        if (!productName) {
            req.flash('errors', 'Product name is required');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Check for duplicate product name
        const existingProduct = await Product.findOne({ productName, _id: { $ne: id } });
        if (existingProduct) {
            req.flash('errors', 'A product with the same name already exists.');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Fetch the category offer as a percentage
        const category = await Category.findById(req.body.categoryId).select('categoryOffer').lean();
        const categoryOffer = category?.categoryOffer || 0;

        // Determine the effective offer to apply (higher of product offer or category offer)
        const effectiveOffer = Math.max(productOffer, categoryOffer);

        // Calculate sale price based on effective offer
        let salePrice = regularPrice;
        if (req.body.discountType === 'percentage') {
            salePrice -= (salePrice * effectiveOffer / 100);
        } else {
            salePrice -= effectiveOffer; // If it's a flat amount, apply it directly
        }
        salePrice = Math.max(0, Math.round(salePrice)); // Ensure sale price is not negative

        // Calculate tax
        const taxAmount = req.body.taxType === 'percentage'
            ? salePrice * taxValue / 100
            : taxValue;
        const finalPrice = Math.round(salePrice + taxAmount); // Final price including tax

        // Handle image uploads and resizing
        let resizedImageUrls = [...product.productImages]; // Start with existing images
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(async (file) => {
                const imagePath = path.join('public', 'uploads', file.filename);
                const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

                await sharp(imagePath)
                    .resize({ width: 400, height: 400 })
                    .toFile(resizedImagePath);

                return resizedImagePath.replace('public/', '');
            });
            const newImageUrls = await Promise.all(imagePromises);
            resizedImageUrls = resizedImageUrls.concat(newImageUrls); // Append new images
        }

        // Handle sizes and calculate total quantity
        const sizes = req.body.sizes || [];
        let totalQuantity = 0;
        const sizesData = sizes.map(sizeEntry => {
            const quantity = parseInt(sizeEntry.quantity) || 0;

            // Validate for negative quantity
            if (quantity < 0) {
                req.flash('errors', `Quantity for size ${sizeEntry.size} cannot be negative`);
                throw new Error('Negative size quantity detected');
            }

            totalQuantity += quantity;
            return {
                size: sizeEntry.size,
                quantity: quantity
            };
        });

        // Ensure the total quantity reflects the sum of sizes
        if (totalQuantity === 0) {
            req.flash('errors', 'Total quantity must be greater than zero');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Determine status based on total quantity
        const status = totalQuantity === 0 ? 'Out of Stock' : 'Available';

        // Prepare updated product data
        const productData = {
            productName: productName,
            description: req.body.description?.trim() || '',
            brand: req.body.brand?.trim() || '',
            categoryId: req.body.categoryId,
            regularPrice: regularPrice,
            salePrice: finalPrice,
            productOffer: Math.round(productOffer),
            tax: Math.round(taxValue),
            offerDescription: req.body.offerDescription || '',
            quantity: totalQuantity,
            colour: req.body.color?.trim() || '',
            productImages: resizedImageUrls,
            sizes: sizesData,
            status: status,
        };

        // Update product in the database
        Object.assign(product, productData);
        await product.save();

        req.flash('success', 'Product updated successfully');
        return res.redirect(`/admin/edit-product/${id}`);
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'An error occurred while updating the product');
        res.redirect('/500');
    }
};


const deleteProductImage = async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Ensure the product has more than one image
        if (product.productImages.length <= 1) {
            return res.status(400).json({ success: false, message: 'Cannot delete the last image of the product' });
        }

        // Remove the image URL from the product's images array
        product.productImages = product.productImages.filter(img => img !== imageUrl);

        // Save the updated product
        await product.save();

        // Optionally, delete the image file from your server
        const imagePath = path.join(imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Failed to delete image file:', err);
            }
        });

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
};



const blockProduct = async (req, res) => {

    const id = req.query.id;

    try {
        const product = await Product.findByIdAndUpdate(id, { is_blocked: true });
        if (!product) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/products');
    } catch (error) {

    }

}

const unblockProduct = async (req, res) => {
    const id = req.query.id;
    try {
        const product = await Product.findByIdAndUpdate(id, { is_blocked: false });
        if (!product) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/products');

    } catch (error) {
        console.error(error.message)
    }
}

 
module.exports = {
    productsList,
    loadAddProduct,
    addNewProduct,
    blockProduct,
    unblockProduct,
    loadEditProduct,
    editProduct,
    deleteProductImage
};
