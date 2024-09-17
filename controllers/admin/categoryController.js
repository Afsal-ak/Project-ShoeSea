

const Category = require('../../models/categoryModel');


// Fetch and display categories with pagination
const getCategory = async (req, res) => {
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
           error: req.flash('error'), // Handle flash message for,error
            message: req.flash('message') // Handle flash message for success
        });

    } catch (error) {
        console.log(error.message);
        res.redirect('/pageerror');
    }
};

// // Add a new category and handle,error
// const addCategory = async (req, res) => {
//     try {
//         const { categoryName, description } = req.body;

//         let categoryCheck = await Category.findOne({ categoryName });
//         if (categoryCheck) {
//             req.flash('error', 'Category Name Already Exists');
//             return res.redirect('/admin/category');
//         }

//         const categoryData = new Category({
//             categoryName: categoryName,
//             description: description
//         });

//         await categoryData.save();
//         req.flash('message', 'Category Successfully Created');
//         return res.redirect('/admin/category');
//     } catch (error) {
//         console.error(error.message);
//         req.flash('error', 'Internal Server,essages');
//         return res.redirect('/admin/category');
//     }
// };


// const addCategory = async (req, res) => {
//     try {
//         const { categoryName, description } = req.body;

//         // Case-insensitive check for existing category
//         let categoryCheck = await Category.findOne({ categoryName: new RegExp('^' + categoryName + '$', 'i') });
//         if (categoryCheck) {
//             req.flash('error', 'Category Name Already Exists');
//             return res.redirect('/admin/category');
//         }

//         const categoryData = new Category({
//             categoryName: categoryName,
//             description: description,
//             category
//         });

//         await categoryData.save();
//         req.flash('message', 'Category Successfully Created');
//         return res.redirect('/admin/category');
//     } catch (error) {
//         console.error(error.message);
//         req.flash('error', 'Internal Server Error');
//         return res.redirect('/admin/category');
//     }
// };
const addCategory = async (req, res) => {
    try {
        const { categoryName, description, categoryOffer, offerExpiry } = req.body;

        // Case-insensitive check for existing category
        let categoryCheck = await Category.findOne({ categoryName: new RegExp('^' + categoryName + '$', 'i') });

        if (categoryCheck) {
            req.flash('error', 'Category Name Already Exists');
            console.log('name already exists')
            return res.redirect('/admin/category');
        }

        // Create new category
        const categoryData = new Category({
            categoryName: categoryName,
            description: description,
            categoryOffer: categoryOffer || 0, // Default to 0 if not provided
            offerExpiry: offerExpiry || null  // Default to null if no expiry
        });

        await categoryData.save();
        req.flash('message', 'Category Successfully Created');
        return res.redirect('/admin/category');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Internal Server Error');
        return res.redirect('/admin/category');
    }
};

// Unlist category
const unListCategory = async (req, res) => {
    const id = req.query.id;
    try {
        const category = await Category.findByIdAndUpdate(id, { isListed: false });
        if (!category) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};

// List category
const listCategory = async (req, res) => {
    const id = req.query.id;
    try {
        const category = await Category.findByIdAndUpdate(id, { isListed: true });
        if (!category) {
            return res.status(404).send('Category not found');
        }
        return res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
};



// const getEditCategory=async(req,res)=>{
//     const id =req.query.id
//     try {
//         const category=await Category.findById({_id:id})
      
//         if (!category) {
//             return res.status(404).render('edit-category', { error: 'Category not found' });
//         }
//         res.render('editCategory', { category });
     
//     } catch (error) {
//         console.log(error.message)
//         res.status(500).render('edit-category', { error: 'Server error' });
//     }

// }

// const updateCategory=async(req,res)=>{
//     try {
//         const id=req.params.id
//         const {categoryName,description}=req.body
//         const existingCategory=await Category.findOne({name:categoryName})

//         if(existingCategory){
//             return res.status(400).josn({error:'category alreday exist'})
//         }
//         const updateCategory=await Category.findByIdAndUpdate(id,{
//             name:categoryName,
//             description:description,
//         },{new:true})
//         if(updateCategory){
//             res.redirect('/admin/category')
//         }
//     } catch (error) {
//         console.log(error.message)
//     }
// }

// // Display the edit form
// const getEditCategory = async (req, res) => {
//     try {
//         const categoryId = req.params.id;
//         const category = await Category.findById(categoryId);

//         if (!category) {
//             req.flash('error', 'Category not found');
//             return res.redirect('/admin/category');
//         }

//         res.render('edit-category', {
//             category: category
//         });
//     } catch (error) {
//         console.error(error.message);
//         req.flash('error', 'Internal Server Error');
//         return res.redirect('/admin/category');
//     }
// };


const getEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/category');
        }

        res.render('./category/edit-category', {
            category: category,
            error: req.flash('error')[0] || '',  // Pass the error message or an empty string
            message: req.flash('message')[0] || ''  // Pass the success message or an empty string
        });
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Internal Server Error');
        return res.redirect('/admin/category');
    }
};


// const updateCategory = async (req, res) => {
//     try {
//         const categoryId = req.params.id;
//         const { categoryName, description } = req.body;

//         // Check if another category with the same name exists
//         const existingCategory = await Category.findOne({ categoryName });

//         if (existingCategory && existingCategory._id.toString() !== categoryId) {
//             req.flash('error', 'Category name must be unique');
//             return res.redirect(`/admin/edit-category/${categoryId}`);
//         }

//         // Proceed with updating the category
//         const updatedCategory = await Category.findByIdAndUpdate(
//             categoryId,
//             { categoryName, description },
//             { new: true }
//         );

//         if (!updatedCategory) {
//             req.flash('error', 'Failed to update category');
//             return res.redirect('/admin/category');
//         }

//         req.flash('message', 'Category updated successfully');
//         return res.redirect('/admin/category');
//     } catch (error) {
//         console.error(error.message);
//         req.flash('error', 'Internal Server Error');
//         return res.redirect('/admin/category');
//     }
// };
const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { categoryName, description, categoryOffer, offerExpiry } = req.body;

        // Check if another category with the same name exists
        const existingCategory = await Category.findOne({ categoryName });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            req.flash('error', 'Category name must be unique');
            return res.redirect(`/admin/edit-category/${categoryId}`);
        }

        // Proceed with updating the category
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            {
                categoryName,
                description,
                categoryOffer: categoryOffer || 0,  // Default to 0 if not provided
                offerExpiry: offerExpiry || null     // Default to null if no expiry
            },
            { new: true }
        );

        if (!updatedCategory) {
            req.flash('error', 'Failed to update category');
            return res.redirect('/admin/category');
        }

        req.flash('message', 'Category updated successfully');
        return res.redirect('/admin/category');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Internal Server Error');
        return res.redirect('/admin/category');
    }
};


module.exports = {
    getCategory,
    addCategory,
    listCategory,
    unListCategory,
   // addOffer,
   // removeOffer,
    getEditCategory,
    updateCategory
};
