

const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// const addNewProduct = async (req, res) => {
//     try {
//         // Calculate salePrice based on discount
//         let salePrice = parseFloat(req.body.regularPrice.trim());
//         if (req.body.discountType === 'percentage' && req.body.discountValue > 0) {
//             salePrice -= (salePrice * parseFloat(req.body.discountValue.trim()) / 100);
//         } else if (req.body.discountType === 'flat' && req.body.discountValue > 0) {
//             salePrice -= parseFloat(req.body.discountValue.trim());
//         }
//         salePrice = Math.round(salePrice < 0 ? 0 : salePrice); // Ensure sale price is not negative and round to nearest whole number

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
//             : parseFloat(req.body.taxValue.trim());
//         const finalPrice = Math.round(salePrice + taxAmount); // Round final price to nearest whole number

//         // Resize images and store paths
//         const imagePromises = req.files.map(async (file) => {
//             const imagePath = path.join('public', 'uploads', file.filename);
//             const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//             try {
//                 // Resize image
//                 await sharp(imagePath)
//                     .resize({ width: 400, height: 400 })
//                     .toFile(resizedImagePath);

//                 // Remove original image
//                 // fs.unlink(imagePath, (err) => {
//                 //     if (err) {
//                 //         console.error('Failed to delete original image', err);
//                 //     } else {
//                 //         console.log('Original image deleted successfully');
//                 //     }
//                 // });

//                 // Return the path relative to the public directory
//                 return resizedImagePath.replace('public/', '');
//             } catch (error) {
//                 console.error('Error processing image', error);
//                 throw error;
//             }
//         });

//         const resizedImageUrls = await Promise.all(imagePromises);

//         // Determine status based on quantity
//         let status = 'Available';
//         if (parseInt(req.body.quantity.trim(), 10) === 0) {
//             status = 'Out of Stock';
//         }
//         const sizes = req.body.sizes.map(sizeEntry => ({
//             size: sizeEntry.size,
//             quantity: parseInt(sizeEntry.quantity, 10)
//         }));

//        // Ensure the total quantity across sizes does not exceed the original quantity
//         const totalQuantity = sizes.reduce((acc, curr) => acc + curr.quantity, 0);
//         if (totalQuantity > parseInt(req.body.quantity.trim(), 10)) {
//             return res.status(400).send('Total quantity of sizes exceeds the main quantity.');
//         }

//         // Prepare product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//           //  brand: req.body.brand ? req.body.brand.trim() : '', // Optional
//             categoryId: req.body.categoryId, // Ensure you have categoryId in the request
//             regularPrice: parseFloat(req.body.regularPrice.trim()),
//             salePrice: finalPrice,
//             productOffer: Math.round(parseFloat(req.body.discountValue.trim()) || 0), // Round discount value
//             tax: Math.round(parseFloat(req.body.taxValue.trim()) || 0), // Round tax value
//             offerDescription: req.body.offerDescription || '', // Optional
//             quantity: parseInt(req.body.quantity.trim(), 10),
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls,
//           //  sizes: req.body.sizes || [], // Get sizes from the form
//           sizes: sizes, // Add sizes and quantities

//             status: status,
//             // Add other fields as necessary
//         };

//         const product = new Product(productData);
//         const savedProduct = await product.save();

//         if (savedProduct) {
//             res.redirect('/admin/products');
//         } else {
//             console.log('Error saving product');
//             res.status(500).send('Error saving product');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.redirect('/500');
//     }
// };
const addNewProduct = async (req, res) => {
    try {
        // Validate input
        const regularPrice = parseFloat(req.body.regularPrice);
        const productOffer = parseFloat(req.body.productOffer) || 0;
        const taxValue = parseFloat(req.body.taxValue) || 0;

        if (isNaN(regularPrice) || regularPrice < 0) {
            req.flash('error', 'Invalid regular price');
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
        res.redirect('/500');
    }
};

const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }); // Fetch listed categories
        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "No categories found" });
        }

        res.render('./products/add-products', {
            cat: categories // Passing categories to the template
        });
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        res.status(500).send("Server Error");
    }
};






// const loadAddProduct = async (req, res) => {
//     try {
    
//         const categoryData = await Category.find({ isListed: true });
      
//         res.render('./products/add-products', {
//             cat: categoryData   });
//     } catch (error) {
//         console.log(error.message);
//         res.redirect('/500');
//     }
// };
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

// const editProduct = async (req, res) => {
//     const id = req.params.id;
//     try {
//         // Find the product by ID
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         let salePrice = parseFloat(req.body.regularPrice.trim());
//         if (req.body.discountType === 'percentage' && req.body.discountValue > 0) {
//             salePrice -= (salePrice * parseFloat(req.body.discountValue.trim()) / 100);
//         } else if (req.body.discountType === 'flat' && req.body.discountValue > 0) {
//             salePrice -= parseFloat(req.body.discountValue.trim());
//         }
//         salePrice = salePrice < 0 ? 0 : salePrice; // Ensure sale price is not negative

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
//             : parseFloat(req.body.taxValue.trim());
//         const finalPrice = salePrice + taxAmount;

//         // Handle image uploads and resizing
//         let resizedImageUrls = [...product.productImages]; // Start with existing images

//         if (req.files && req.files.length > 0) {
//             const imagePromises = req.files.map(async (file) => {
//                 const imagePath = path.join('public', 'uploads', file.filename);
//                 const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//                 // Resize image
//                 await sharp(imagePath)
//                     .resize({ width: 400, height: 400 })
//                     .toFile(resizedImagePath);

//                 // // Optionally remove original image
//                 // fs.unlink(imagePath, (err) => {
//                 //     if (err) {
//                 //         console.error('Failed to delete original image', err);
//                 //     } else {
//                 //         console.log('Original image deleted successfully');
//                 //     }
//                 // });

//                 // Return the path relative to the public directory
//                 return resizedImagePath.replace('public/', '');
//             });

//             const newImageUrls = await Promise.all(imagePromises);
//             resizedImageUrls = resizedImageUrls.concat(newImageUrls); // Append new images
//         }

//         // Determine status based on quantity
//         let status = 'Available';
//         if (parseInt(req.body.quantity.trim(), 10) === 0) {
//             status = 'Out of Stock';
//         }

//         // Prepare updated product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//             brand: req.body.brand ? req.body.brand.trim() : '', // Optional
//             categoryId: req.body.categoryId, // Ensure you have categoryId in the request
//             regularPrice: parseFloat(req.body.regularPrice.trim()),
//             salePrice: finalPrice,
//             productOffer: parseFloat(req.body.discountValue.trim()) || 0,
//             tax: parseFloat(req.body.taxValue.trim()) || 0,
//             offerDescription: req.body.offerDescription || '', // Optional
//             quantity: parseInt(req.body.quantity.trim(), 10),
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls, // Updated image URLs
//             sizes: req.body.sizes || [], // Get sizes from the form
//             status: status,
//             // Add other fields as necessary
//         };

//         // Update product in the database
//         Object.assign(product, productData);
//         const updatedProduct = await product.save();

//         if (updatedProduct) {
//             res.redirect('/admin/products');
//         } else {
//             console.log('Error updating product');
//             res.status(500).send('Error updating product');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.redirect('/500');
//     }
// };


// const editProduct = async (req, res) => {
//     const id = req.params.id;
//     try {
//         // Find the product by ID
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         let salePrice = parseFloat(req.body.regularPrice.trim());
//         if (req.body.discountType === 'percentage' && req.body.discountValue > 0) {
//             salePrice -= (salePrice * parseFloat(req.body.discountValue.trim()) / 100);
//         } else if (req.body.discountType === 'flat' && req.body.discountValue > 0) {
//             salePrice -= parseFloat(req.body.discountValue.trim());
//         }
//         salePrice = salePrice < 0 ? 0 : salePrice; // Ensure sale price is not negative

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
//             : parseFloat(req.body.taxValue.trim());
//         const finalPrice = salePrice + taxAmount;

//         // Handle image uploads and resizing
//         let resizedImageUrls = [...product.productImages]; // Start with existing images

//         if (req.files && req.files.length > 0) {
//             const imagePromises = req.files.map(async (file, index) => {
//                 const imagePath = path.join('public', 'uploads', file.filename);
//                 const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//                 // Resize image
//                 await sharp(imagePath)
//                     .resize({ width: 400, height: 400 })
//                     .toFile(resizedImagePath);

//                 // Optionally remove the original image
//                 // fs.unlink(imagePath, (err) => {
//                 //     if (err) {
//                 //         console.error('Failed to delete original image', err);
//                 //     } else {
//                 //         console.log('Original image deleted successfully');
//                 //     }
//                 // });

//                 // Return the path relative to the public directory
//                 return resizedImagePath.replace('public/', '');
//             });

//             const newImageUrls = await Promise.all(imagePromises);

//             // Replace images in the specific order
//             for (let i = 0; i < newImageUrls.length; i++) {
//                 if (i < resizedImageUrls.length) {
//                     resizedImageUrls[i] = newImageUrls[i]; // Replace existing image
//                 } else {
//                     resizedImageUrls.push(newImageUrls[i]); // Append if more new images than existing
//                 }
//             }
//         }

//         // Determine status based on quantity
//         let status = 'Available';
//         if (parseInt(req.body.quantity.trim(), 10) === 0) {
//             status = 'Out of Stock';
//         }

//         // Prepare updated product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//             brand: req.body.brand ? req.body.brand.trim() : '', // Optional
//             categoryId: req.body.categoryId, // Ensure you have categoryId in the request
//             regularPrice: parseFloat(req.body.regularPrice.trim()),
//             salePrice: finalPrice,
//             productOffer: parseFloat(req.body.discountValue.trim()) || 0,
//             tax: parseFloat(req.body.taxValue.trim()) || 0,
//             offerDescription: req.body.offerDescription || '', // Optional
//             quantity: parseInt(req.body.quantity.trim(), 10),
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls, // Updated image URLs
//           //  sizes: req.body.sizes || [], // Get sizes from the form
//             status: status,
//             // Add other fields as necessary
//         };

//         // Update product in the database
//         Object.assign(product, productData);
//         const updatedProduct = await product.save();

//         if (updatedProduct) {
//             res.redirect('/admin/products');
//         } else {
//             console.log('Error updating product');
//             res.status(500).send('Error updating product');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.redirect('/500');
//     }
// };

// const editProduct = async (req, res) => {
//     const id = req.params.id;
//     try {
//         // Find the product by ID
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         const regularPrice = parseFloat(req.body.regularPrice.trim());
//         const discountValue = parseFloat(req.body.discountValue.trim()) || 0;
//         const taxValue = parseFloat(req.body.taxValue.trim()) || 0;

//         if (isNaN(regularPrice) || regularPrice < 0) {
//             return res.status(400).send('Invalid regular price');
//         }

//         if (discountValue < 0) {
//             return res.status(400).send('Discount value cannot be negative');
//         }

//         if (taxValue < 0) {
//             return res.status(400).send('Tax value cannot be negative');
//         }

//         // Calculate salePrice based on discount
//         let salePrice = regularPrice;
//         if (req.body.discountType === 'percentage' && discountValue > 0) {
//             salePrice -= (salePrice * discountValue / 100);
//         } else if (req.body.discountType === 'flat' && discountValue > 0) {
//             salePrice -= discountValue;
//         }
//         salePrice = Math.max(0, Math.round(salePrice)); // Ensure sale price is not negative and round to nearest whole number

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * taxValue / 100
//             : taxValue;
//         const finalPrice = Math.round(salePrice + taxAmount); // Round final price to nearest whole number

//         // Handle image uploads and resizing
//         let resizedImageUrls = [...product.productImages]; // Start with existing images

//         if (req.files && req.files.length > 0) {
//             const imagePromises = req.files.map(async (file) => {
//                 const imagePath = path.join('public', 'uploads', file.filename);
//                 const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//                 // Resize image
//                 await sharp(imagePath)
//                     .resize({ width: 400, height: 400 })
//                     .toFile(resizedImagePath);

//                 return resizedImagePath.replace('public/', '');
//             });

//             const newImageUrls = await Promise.all(imagePromises);
//             resizedImageUrls = resizedImageUrls.concat(newImageUrls); // Append new images
//         }

//         // Handle sizes and calculate total quantity
//         const sizes = req.body.sizes || [];
//         let totalQuantity = 0; // Initialize total quantity
//         const sizesData = sizes.map(sizeEntry => {
//             const quantity = parseInt(sizeEntry.quantity) || 0;
//             totalQuantity += quantity; // Sum the quantity for total calculation
//             return {
//                 size: sizeEntry.size,
//                 quantity: quantity
//             };
//         });

//         // Ensure the total quantity reflects the sum of sizes
//         if (totalQuantity === 0) {
//             return res.status(400).send('Total quantity must be greater than zero');
//         }

//         // Determine status based on total quantity
//         const status = totalQuantity === 0 ? 'Out of Stock' : 'Available';

//         // Prepare updated product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//             brand: req.body.brand ? req.body.brand.trim() : '',
//             categoryId: req.body.categoryId,
//             regularPrice: regularPrice,
//             salePrice: finalPrice,
//             productOffer: Math.round(discountValue),
//             tax: Math.round(taxValue),
//             offerDescription: req.body.offerDescription || '',
//             quantity: totalQuantity, // Use total quantity calculated from sizes
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls,
//             sizes: sizesData, // Include sizes in the product data
//             status: status,
//         };

//         // Update product in the database
//         Object.assign(product, productData);
//         const updatedProduct = await product.save();

//         if (updatedProduct) {
//             res.redirect('/admin/products');
//         } else {
//             res.status(500).send('Error updating product');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.redirect('/500');
//     }
// };
// const editProduct = async (req, res) => {
//     const id = req.params.id;
//     try {
//         // Find the product by ID
//         const product = await Product.findById(id);
//         if (!product) {
//             req.flash('error', 'Product not found');
//             return res.redirect('/admin/products');
//         }

//         // Validate input
//         const regularPrice = parseFloat(req.body.regularPrice);
//         const productOffer = parseFloat(req.body.productOffer) || 0;
//         const taxValue = parseFloat(req.body.taxValue) || 0;

//         if (isNaN(regularPrice) || regularPrice < 0) {
//             req.flash('error', 'Invalid regular price');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         if (productOffer < 0) {
//             req.flash('error', 'Product offer cannot be negative');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         if (taxValue < 0) {
//             req.flash('error', 'Tax value cannot be negative');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         // Validate product name
//         const productName = req.body.productName?.trim();
//         if (!productName) {
//             req.flash('error', 'Product name is required');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         // Check for duplicate product name
//         const existingProduct = await Product.findOne({ productName, _id: { $ne: id } });
//         if (existingProduct) {
//             req.flash('error', 'A product with the same name already exists.');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         // Fetch the category offer after validating other data
//         const category = await Category.findById(req.body.categoryId).select('offer').lean();
//         const categoryOffer = category?.offer || 0;

//         // Calculate final offer to apply
//         const finalOffer = Math.max(productOffer, categoryOffer); // Use whichever offer is larger

//         // Calculate sale price
//         let salePrice = regularPrice;
//         if (req.body.discountType === 'percentage') {
//             salePrice -= (salePrice * finalOffer / 100);
//         } else {
//             salePrice -= finalOffer;
//         }
//         salePrice = Math.max(0, Math.round(salePrice)); // Ensure sale price is not negative

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * taxValue / 100
//             : taxValue;
//         const finalPrice = Math.round(salePrice + taxAmount); // Final price including tax

//         // Handle image uploads and resizing
//         let resizedImageUrls = [...product.productImages]; // Start with existing images
//         if (req.files && req.files.length > 0) {
//             const imagePromises = req.files.map(async (file) => {
//                 const imagePath = path.join('public', 'uploads', file.filename);
//                 const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//                 await sharp(imagePath)
//                     .resize({ width: 400, height: 400 })
//                     .toFile(resizedImagePath);

//                 return resizedImagePath.replace('public/', '');
//             });
//             const newImageUrls = await Promise.all(imagePromises);
//             resizedImageUrls = resizedImageUrls.concat(newImageUrls); // Append new images
//         }

//         // Handle sizes and calculate total quantity
//         const sizes = req.body.sizes || [];
//         let totalQuantity = 0;
//         const sizesData = sizes.map(sizeEntry => {
//             const quantity = parseInt(sizeEntry.quantity) || 0;
//             totalQuantity += quantity;
//             return {
//                 size: sizeEntry.size,
//                 quantity: quantity
//             };
//         });

//         // Ensure the total quantity reflects the sum of sizes
//         if (totalQuantity === 0) {
//             req.flash('error', 'Total quantity must be greater than zero');
//             return res.redirect(`/admin/edit-product/${id}`);
//         }

//         // Determine status based on total quantity
//         const status = totalQuantity === 0 ? 'Out of Stock' : 'Available';

//         // Prepare updated product data
//         const productData = {
//             productName: productName,
//             description: req.body.description?.trim() || '',
//             brand: req.body.brand?.trim() || '',
//             categoryId: req.body.categoryId,
//             regularPrice: regularPrice,
//             salePrice: finalPrice,
//             productOffer: Math.round(productOffer),
//             tax: Math.round(taxValue),
//             offerDescription: req.body.offerDescription || '',
//             quantity: totalQuantity,
//             colour: req.body.color?.trim() || '',
//             productImages: resizedImageUrls,
//             sizes: sizesData,
//             status: status,
//         };

//         // Update product in the database
//         Object.assign(product, productData);
//         await product.save();

//         req.flash('success', 'Product updated successfully');
//         res.redirect('/admin/products');
//     } catch (error) {
//         console.error(error.message);
//         req.flash('error', 'An error occurred while updating the product');
//         res.redirect('/500');
//     }
// };
const editProduct = async (req, res) => {
    const id = req.params.id;
    try {
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Validate input
        const regularPrice = parseFloat(req.body.regularPrice);
        const productOffer = parseFloat(req.body.productOffer) || 0;
        const taxValue = parseFloat(req.body.taxValue) || 0;

        if (isNaN(regularPrice) || regularPrice < 0) {
            req.flash('error', 'Invalid regular price');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        if (productOffer < 0) {
            req.flash('error', 'Product offer cannot be negative');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        if (taxValue < 0) {
            req.flash('error', 'Tax value cannot be negative');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Validate product name
        const productName = req.body.productName?.trim();
        if (!productName) {
            req.flash('error', 'Product name is required');
            return res.redirect(`/admin/edit-product/${id}`);
        }

        // Check for duplicate product name
        const existingProduct = await Product.findOne({ productName, _id: { $ne: id } });
        if (existingProduct) {
            req.flash('error', 'A product with the same name already exists.');
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
            totalQuantity += quantity;
            return {
                size: sizeEntry.size,
                quantity: quantity
            };
        });

        // Ensure the total quantity reflects the sum of sizes
        if (totalQuantity === 0) {
            req.flash('error', 'Total quantity must be greater than zero');
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
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'An error occurred while updating the product');
        res.redirect('/500');
    }
};


// const deleteProductImage = async (req, res) => {
//     const { id } = req.params;
//     const { imageUrl } = req.body; // This is the URL passed from the form

//     try {
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).send('Product not found');
//         }

//         // Remove the image from the product's images array
//         //product.productImages = product.productImages.filter(img => img !== imageUrl); // Adjusted to match your array
//         product.productImages.pull(imageUrl)
//         console.log(`Images after delete: ${product.productImages.length}`);

//         await product.save()
//         // If you are storing images locally, delete the file
//         const fs = require('fs');
//         const localImagePath = path.join(__dirname, '..', 'public', imageUrl); // Adjust to get the correct path

//         // Check if the file exists before attempting to delete
//         if (fs.existsSync(localImagePath)) {
//             fs.unlinkSync(localImagePath); // Delete the file from the filesystem
//         } else {
//             console.error('File not found:', localImagePath);
//         }
      
//         await product.save();
//         console.log('2 Image URL to delete:', imageUrl);
//         console.log('2 Current Images:', product.productImages);
        
//         req.flash('success_msg', 'Image deleted successfully');
//         res.redirect(`/admin/edit-product/${id}`);
//     } catch (error) {
//         console.error('Error deleting image:', error);
//         res.status(500).json({ success: false, message: 'Error deleting image' });
//     }
// };


const deleteProductImage = async (req, res) => {
    const { id } = req.params;
    const { imageUrl } = req.body;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Remove the image URL from the product's images array
        product.productImages = product.productImages.filter(img => img !== imageUrl);

        // Save the updated product
        await product.save();

        // Optionally, delete the image file from your server
        const imagePath = path.join('public', imageUrl);
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

// Function to list products
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


const blockProduct=async(req,res)=>{

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

const unblockProduct=async(req,res)=>{
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
  

const loadEditProduct = async (req, res) => {
    try {
        const id = req.params.id; // Get the product ID from the URL parameters
        const product = await Product.findById(id); // Fetch the product by ID

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products'); // Redirect to products list
        }

        // Fetch categories for the select dropdown
        const categories = await Category.find({isListed:true}); // Adjust the path according to your project structure

        // Render the edit form with product data
        res.render('./products/edit-product', {
            product,
            cat:categories,
            messages: req.flash('error') // Pass flash messages to the template
        });
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'An error occurred while loading the product');
        res.redirect('/500'); // Redirect to a custom error page
    }
};



module.exports = {
    addNewProduct,
    getAddProduct,
    loadAddProduct,
    productsList,
    blockProduct,
    unblockProduct,
    loadEditProduct,
    editProduct,
    deleteProductImage

};
