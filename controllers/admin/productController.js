

const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const addNewProduct = async (req, res) => {
    try {
        // Calculate salePrice based on discount
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

        // Resize images and store paths
        const imagePromises = req.files.map(async (file) => {
            const imagePath = path.join('public', 'uploads', file.filename);
            const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

            // Resize image
            await sharp(imagePath)
                .resize({ width: 400, height: 400 })
                .toFile(resizedImagePath);

            // Optionally remove original image
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Failed to delete original image', err);
                } else {
                    console.log('Original image deleted successfully');
                }
            });

            // Return the path relative to the public directory
            return resizedImagePath.replace('public/', '');
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
            brand: req.body.brand ? req.body.brand.trim() : '', // Optional
            categoryId: req.body.categoryId, // Ensure you have categoryId in the request
            regularPrice: parseFloat(req.body.regularPrice.trim()),
            salePrice: finalPrice,
            productOffer: parseFloat(req.body.discountValue.trim()) || 0,
            tax: parseFloat(req.body.taxValue.trim())||0 ,
            offerDescription: req.body.offerDescription || '', // Optional
            quantity: parseInt(req.body.quantity.trim(), 10),
            colour: req.body.color.trim(),
            productImages: resizedImageUrls,//.map(url => url.replace('uploads/', 'uploads/')),
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


const loadAddProduct = async (req, res) => {
    try {
    
        const categoryData = await Category.find({ isListed: true });
      
        res.render('./products/add-products', {
            category: categoryData   });
    } catch (error) {
        console.log(error.message);
        res.redirect('/500');
    }
};
const editProduct = async (req, res) => {
   const id=req.params.id
    try {
        // Find the product by ID
         const product = await Product.findById(id);
      
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
        let resizedImageUrls = product.productImages; // Start with existing images
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(async (file) => {
                const imagePath = path.join('public', 'uploads', file.filename);
                const resizedImagePath = path.join('public', 'uploads', `resized_${file.filename}`);

                // Resize image
                await sharp(imagePath)
                    .resize({ width: 400, height: 400 })
                    .toFile(resizedImagePath);

                // Optionally remove original image
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Failed to delete original image', err);
                    } else {
                        console.log('Original image deleted successfully');
                    }
                });

                // Return the path relative to the public directory
                return resizedImagePath.replace('public/', '');
            });

            resizedImageUrls = await Promise.all(imagePromises);
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
            category
        });
    } catch (error) {
        console.error(error.message);
        res.redirect('/500'); // Redirect to a custom error page
    }
}



module.exports = {
    addNewProduct,
    loadAddProduct,
    productsList,
    blockProduct,
    unblockProduct,
    loadEditProduct,
    editProduct

};
