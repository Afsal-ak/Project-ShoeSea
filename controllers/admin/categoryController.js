

const Category = require('../../models/categoryModel');
const Product=require('../../models/productModel');

// Fetch and display categories with pagination
const getCategory = async (req, res,next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        const categoryFilter = {
            $or: [
                { categoryName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        const categoryData = await Category.find(categoryFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments(categoryFilter);
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('./category/category', {
            cta: categoryData,
            currentPage: page,
            totalPage: totalPages,
            totalCategories: totalCategories,
            searchQuery: searchQuery,
           errors: req.flash('errors'), // Handle flash message for,error
            message: req.flash('message') // Handle flash message for success
        });

    } catch (error) {
        console.log(error.message);
        next(error)
    }
};

const addCategory = async (req, res,next) => {
    try {
        const { categoryName, description, categoryOffer, offerExpiry } = req.body;

        // Case-insensitive check for existing category
        let categoryCheck = await Category.findOne({ categoryName: new RegExp('^' + categoryName + '$', 'i') });

        if (categoryCheck) {
            req.flash('errors', 'Category Name Already Exists');
            console.log('name already exists');
            return res.redirect('/admin/category');
        }

        // Create new category
        const categoryData = new Category({
            categoryName: categoryName,
            description: description,
            categoryOffer: categoryOffer || 0, // Default to 0 if not provided
            offerExpiry: offerExpiry || null     // Default to null if no expiry
        });

        await categoryData.save();
        req.flash('message', 'Category Successfully Created');
        return res.redirect('/admin/category');
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};

// Unlist category
const unListCategory = async (req, res,next) => {
    const id = req.query.id;
    try {
        const category = await Category.findByIdAndUpdate(id, { isListed: false });
        if (!category) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
        next(error)

    }
};

// List category
const listCategory = async (req, res,next) => {
    const id = req.query.id;
    try {
        const category = await Category.findByIdAndUpdate(id, { isListed: true });
        if (!category) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/category');
    } catch (error) {
        next(error)
    }
};


const getEditCategory = async (req, res,next) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/category');
        }

        res.render('./category/edit-category', {
            category: category,
            errors: req.flash('errors')[0] || '',  // Pass the error message or an empty string
            message: req.flash('message')[0] || ''  // Pass the success message or an empty string
        });
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const { categoryName, description, categoryOffer, offerExpiry } = req.body;

        // Check if another category with the same name exists (case-insensitive)
        const existingCategory = await Category.findOne({
            categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') }
        });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            req.flash('errors', 'Category name must be unique');
            return res.redirect(`/admin/edit-category/${categoryId}`);
        }

        // Proceed with updating the category
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            {
                categoryName,
                description,
                categoryOffer: categoryOffer || 0,  // Ensure this is set properly
                offerExpiry: offerExpiry || null     // Default to null if no expiry
            },
            { new: true }
        );

        if (!updatedCategory) {
            req.flash('errors', 'Failed to update category');
            return res.redirect('/admin/category');
        }

        // Fetch all products in this category to update their sale prices
        const products = await Product.find({ categoryId });

        for (const product of products) {
            const productOffer = product.productOffer || 0;
            const newCategoryOffer = updatedCategory.categoryOffer || 0;

            // Calculate the new sale price if the category offer is higher
            const highestOffer = Math.max(productOffer, newCategoryOffer);
            let salePrice = product.regularPrice;

            // Assuming sale price calculation is similar to what you have
            if (product.discountType === 'percentage') {
                salePrice -= (salePrice * highestOffer / 100);
            } else {
                salePrice -= highestOffer;
            }
            salePrice = Math.max(0, Math.round(salePrice)); 

            // Update the product's sale price
            product.salePrice = salePrice;
            await product.save();
        }

        req.flash('message', 'Category updated successfully');
        return res.redirect('/admin/category');
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};




module.exports = {
    getCategory,
    addCategory,
    listCategory,
    unListCategory,
    getEditCategory,
    updateCategory
};
