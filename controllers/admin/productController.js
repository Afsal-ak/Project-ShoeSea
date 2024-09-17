

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
//         salePrice = salePrice < 0 ? 0 : salePrice; // Ensure sale price is not negative

//         // Calculate tax
//         const taxAmount = req.body.taxType === 'percentage'
//             ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
//             : parseFloat(req.body.taxValue.trim());
//         const finalPrice = salePrice + taxAmount;

//         // Resize images and store paths
//         const imagePromises = req.files.map(async (file) => {
//             const imagePath = path.join('public', 'uploads', file.filename);
//             const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

//             // Resize image
//             await sharp(imagePath)
//                 .resize({ width: 400, height: 400 })
//                 .toFile(resizedImagePath);

//             // Optionally remove original image
//             fs.unlink(imagePath, (err) => {
//                 if (err) {
//                     console.error('Failed to delete original image', err);
//                 } else {
//                     console.log('Original image deleted successfully');
//                 }
//             });

//             // Return the path relative to the public directory
//             return resizedImagePath.replace('public/', '');
//         });

//         const resizedImageUrls = await Promise.all(imagePromises);

//         // Determine status based on quantity
//         let status = 'Available';
//         if (parseInt(req.body.quantity.trim(), 10) === 0) {
//             status = 'Out of Stock';
//         }

//         // Prepare product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//             brand: req.body.brand ? req.body.brand.trim() : '', // Optional
//             categoryId: req.body.categoryId, // Ensure you have categoryId in the request
//             regularPrice: parseFloat(req.body.regularPrice.trim()),
//             salePrice: finalPrice,
//             productOffer: parseFloat(req.body.discountValue.trim()) || 0,
//             tax: parseFloat(req.body.taxValue.trim())||0 ,
//             offerDescription: req.body.offerDescription || '', // Optional
//             quantity: parseInt(req.body.quantity.trim(), 10),
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls,//.map(url => url.replace('uploads/', 'uploads/')),
//             sizes: req.body.sizes || [], // Get sizes from the form
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

//             // Resize image
//             await sharp(imagePath)
//                 .resize({ width: 400, height: 400 })
//                 .toFile(resizedImagePath);

//             // Optionally remove original image
//             fs.unlink(imagePath, (err) => {
//                 if (err) {
//                     console.error('Failed to delete original image', err);
//                 } else {
//                     console.log('Original image deleted successfully');
//                 }
//             });

//             // Return the path relative to the public directory
//             return resizedImagePath.replace('public/', '');
//         });

//         const resizedImageUrls = await Promise.all(imagePromises);

//         // Determine status based on quantity
//         let status = 'Available';
//         if (parseInt(req.body.quantity.trim(), 10) === 0) {
//             status = 'Out of Stock';
//         }

//         // Prepare product data
//         const productData = {
//             productName: req.body.title.trim(),
//             description: req.body.description.trim(),
//             brand: req.body.brand ? req.body.brand.trim() : '', // Optional
//             categoryId: req.body.categoryId, // Ensure you have categoryId in the request
//             regularPrice: parseFloat(req.body.regularPrice.trim()),
//             salePrice: finalPrice,
//             productOffer: Math.round(parseFloat(req.body.discountValue.trim()) || 0), // Round discount value
//             tax: Math.round(parseFloat(req.body.taxValue.trim()) || 0), // Round tax value
//             offerDescription: req.body.offerDescription || '', // Optional
//             quantity: parseInt(req.body.quantity.trim(), 10),
//             colour: req.body.color.trim(),
//             productImages: resizedImageUrls,
//             sizes: req.body.sizes || [], // Get sizes from the form
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
        // Calculate salePrice based on discount
        let salePrice = parseFloat(req.body.regularPrice.trim());
        if (req.body.discountType === 'percentage' && req.body.discountValue > 0) {
            salePrice -= (salePrice * parseFloat(req.body.discountValue.trim()) / 100);
        } else if (req.body.discountType === 'flat' && req.body.discountValue > 0) {
            salePrice -= parseFloat(req.body.discountValue.trim());
        }
        salePrice = Math.round(salePrice < 0 ? 0 : salePrice); // Ensure sale price is not negative and round to nearest whole number

        // Calculate tax
        const taxAmount = req.body.taxType === 'percentage'
            ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
            : parseFloat(req.body.taxValue.trim());
        const finalPrice = Math.round(salePrice + taxAmount); // Round final price to nearest whole number

        // Resize images and store paths
        const imagePromises = req.files.map(async (file) => {
            const imagePath = path.join('public', 'uploads', file.filename);
            const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

            try {
                // Resize image
                await sharp(imagePath)
                    .resize({ width: 400, height: 400 })
                    .toFile(resizedImagePath);

                // Remove original image
                // fs.unlink(imagePath, (err) => {
                //     if (err) {
                //         console.error('Failed to delete original image', err);
                //     } else {
                //         console.log('Original image deleted successfully');
                //     }
                // });

                // Return the path relative to the public directory
                return resizedImagePath.replace('public/', '');
            } catch (error) {
                console.error('Error processing image', error);
                throw error;
            }
        });

        const resizedImageUrls = await Promise.all(imagePromises);

        // Determine status based on quantity
        let status = 'Available';
        if (parseInt(req.body.quantity.trim(), 10) === 0) {
            status = 'Out of Stock';
        }

        // Prepare product data
        const productData = {
            productName: req.body.title.trim(),
            description: req.body.description.trim(),
          //  brand: req.body.brand ? req.body.brand.trim() : '', // Optional
            categoryId: req.body.categoryId, // Ensure you have categoryId in the request
            regularPrice: parseFloat(req.body.regularPrice.trim()),
            salePrice: finalPrice,
            productOffer: Math.round(parseFloat(req.body.discountValue.trim()) || 0), // Round discount value
            tax: Math.round(parseFloat(req.body.taxValue.trim()) || 0), // Round tax value
            offerDescription: req.body.offerDescription || '', // Optional
            quantity: parseInt(req.body.quantity.trim(), 10),
            colour: req.body.color.trim(),
            productImages: resizedImageUrls,
            sizes: req.body.sizes || [], // Get sizes from the form
            status: status,
            // Add other fields as necessary
        };

        const product = new Product(productData);
        const savedProduct = await product.save();

        if (savedProduct) {
            res.redirect('/admin/products');
        } else {
            console.log('Error saving product');
            res.status(500).send('Error saving product');
        }
    } catch (error) {
        console.error(error.message);
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


// const addProducts=async(req,res)=>{
//     try {
        
//         const products=req.body;
//         const productExists=await Product.findOne({
//             productName:products.productName,

//         });

//        // if(!productExists){
//             const images = [];

//             if(req.files && req.files.length>0){
//                 for(let i=0;i<req.files.lenght;i++){
//                     const originalImagePath = req.files[i].path;

//                     const resizedImagePath=path.join('public','uploads','product-images',req.files[i].filename)
//                     await sharp (originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
//                     images.push(req.files[i].filename);
//                 }

//                 const categoryId=await Category.findOne({name:products.category})
            
//                 if(!categoryId){
//                     return res.status(400).join("Invalid category name")
//                 }

//                 const newProduct = new Product({
//                     productName:products.productName,
//                     description:products.description,
//                  //   brand:products.brand,
//                     category:categoryId._id,
//                     regularPrice:products.regularPrice,
//                     salesPrice:products.salePrice,
//                     createdOn:new Date(),
//                     quantity:products.quantity,
//                     size:products.size,
//                     color:products.color,
//                     productImages:images,
//                     status:"Available"

//                 });
//                 await newProduct.save()
//                 return res.redirect('/admin/products')
//             // }else{
//             //     return res.status(400).json("Product already exist, please try with another name")
//             // }
//         }
//     } catch (error) {
//         console.error("Error saving product",error);
//         return res.redirect('/admin/pageerror')
//     }
// }


const addProducts = async (req, res) => {
    try {
        const products = req.body;

        // Check if the product already exists
        const productExists = await Product.findOne({
            productName: products.productName
        });

        if (productExists) {
            return res.status(400).json("Product already exists, please try with another name");
        }

        const images = [];

        // Check if files are present
        if (req.files && req.files.length > 0) {
            // Ensure the directory exists, if not create it
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'product-images');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = req.files[i].path;
                const resizedImagePath = path.join(uploadDir, req.files[i].filename);

                // Resize the image
                await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath);
                images.push(req.files[i].filename);
            }
        } else {
            return res.status(400).json("No images uploaded");
        }

        // Find category by name
        const category = await Category.findOne({ categoryName: products.category });
        if (!category) {
            return res.status(400).json("Invalid category name");
        }

        // Create new product
        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            category: category._id,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            createdOn: new Date(),
            quantity: products.quantity,
            size: products.size,
            color: products.color,
            productImages: images,
            status: "Available"
        });
console.log(images)
        // Save product to database
        await newProduct.save();
        return res.redirect('/admin');

    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect('/admin/pageerror');
    }
};


const loadAddProduct = async (req, res) => {
    try {
    
        const categoryData = await Category.find({ isListed: true });
      
        res.render('./products/add-products', {
            cat: categoryData   });
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


const editProduct = async (req, res) => {
    const id = req.params.id;
    try {
        // Find the product by ID
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        let salePrice = parseFloat(req.body.regularPrice.trim());
        if (req.body.discountType === 'percentage' && req.body.discountValue > 0) {
            salePrice -= (salePrice * parseFloat(req.body.discountValue.trim()) / 100);
        } else if (req.body.discountType === 'flat' && req.body.discountValue > 0) {
            salePrice -= parseFloat(req.body.discountValue.trim());
        }
        salePrice = salePrice < 0 ? 0 : salePrice; // Ensure sale price is not negative

        // Calculate tax
        const taxAmount = req.body.taxType === 'percentage'
            ? salePrice * parseFloat(req.body.taxValue.trim()) / 100
            : parseFloat(req.body.taxValue.trim());
        const finalPrice = salePrice + taxAmount;

        // Handle image uploads and resizing
        let resizedImageUrls = [...product.productImages]; // Start with existing images

        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(async (file, index) => {
                const imagePath = path.join('public', 'uploads', file.filename);
                const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

                // Resize image
                await sharp(imagePath)
                    .resize({ width: 400, height: 400 })
                    .toFile(resizedImagePath);

                // Optionally remove the original image
                // fs.unlink(imagePath, (err) => {
                //     if (err) {
                //         console.error('Failed to delete original image', err);
                //     } else {
                //         console.log('Original image deleted successfully');
                //     }
                // });

                // Return the path relative to the public directory
                return resizedImagePath.replace('public/', '');
            });

            const newImageUrls = await Promise.all(imagePromises);

            // Replace images in the specific order
            for (let i = 0; i < newImageUrls.length; i++) {
                if (i < resizedImageUrls.length) {
                    resizedImageUrls[i] = newImageUrls[i]; // Replace existing image
                } else {
                    resizedImageUrls.push(newImageUrls[i]); // Append if more new images than existing
                }
            }
        }

        // Determine status based on quantity
        let status = 'Available';
        if (parseInt(req.body.quantity.trim(), 10) === 0) {
            status = 'Out of Stock';
        }

        // Prepare updated product data
        const productData = {
            productName: req.body.title.trim(),
            description: req.body.description.trim(),
            brand: req.body.brand ? req.body.brand.trim() : '', // Optional
            categoryId: req.body.categoryId, // Ensure you have categoryId in the request
            regularPrice: parseFloat(req.body.regularPrice.trim()),
            salePrice: finalPrice,
            productOffer: parseFloat(req.body.discountValue.trim()) || 0,
            tax: parseFloat(req.body.taxValue.trim()) || 0,
            offerDescription: req.body.offerDescription || '', // Optional
            quantity: parseInt(req.body.quantity.trim(), 10),
            colour: req.body.color.trim(),
            productImages: resizedImageUrls, // Updated image URLs
            sizes: req.body.sizes || [], // Get sizes from the form
            status: status,
            // Add other fields as necessary
        };

        // Update product in the database
        Object.assign(product, productData);
        const updatedProduct = await product.save();

        if (updatedProduct) {
            res.redirect('/admin/products');
        } else {
            console.log('Error updating product');
            res.status(500).send('Error updating product');
        }
    } catch (error) {
        console.error(error.message);
        res.redirect('/500');
    }
};

const deleteProductImage = async (req, res) => {
    try {
        const productId = req.params.productId;
        const imageUrl = req.body.imageUrl;

        // Find the product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Remove the image URL from the product's productImages array
        const updatedImages = product.productImages.filter(img => img !== imageUrl);
        product.productImages = updatedImages;

        // Save the updated product
        await product.save();

        // Delete the image file from the server
        const imagePath = path.join('public', imageUrl);
        await fs.unlink(imagePath);

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: 'Error deleting image' });
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
  


const loadEditProduct=async(req,res)=>{
    
    try {
        const id = req.params.id; // Get the product ID from the URL parameters
        const product = await Product.findById(id); // Fetch the product by ID

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Fetch categories for the select dropdown (assuming you have a Category model)
        const category = await Category.find(); // Adjust the path according to your project structure

        // Render the edit form with product data
        res.render('./products/edit-product', {
            product,
            cat:category
        });
    } catch (error) {
        console.error(error.message);
        res.redirect('/500'); // Redirect to a custom error page
    }
}



module.exports = {
    addNewProduct,
    addProducts,
    getAddProduct,
    loadAddProduct,
    productsList,
    blockProduct,
    unblockProduct,
    loadEditProduct,
    editProduct,
    deleteProductImage

};
