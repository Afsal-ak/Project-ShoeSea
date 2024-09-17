const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');

const listOffers = async (req, res) => {
    try {
        const itemsPerPage = 5; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page number
        const type = req.query.type || 'product'; // 'product' or 'category'

        let totalOffers, offers;

        if (type === 'product') {
            // Count the total number of product offers
            totalOffers = await Product.countDocuments({ productOffer: { $gt: 0 } });
            offers = await Product.find({ productOffer: { $gt: 0 } })
                .populate('categoryId')  // Assuming category is a reference in Product schema
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage);
        } else if (type === 'category') {
            // Count the total number of category offers
            totalOffers = await Category.countDocuments({ categoryOffer: { $gt: 0 } });
            offers = await Category.find({  })
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage);
        }

        const totalPages = Math.ceil(totalOffers / itemsPerPage);

        // Render the offer list
        res.render('offers-list', {
            offers,            // List of offers
            currentPage: page, // Current page number
            totalPages,        // Total number of pages
            successMessage: req.query.success || null, // Pass success message from query parameters
            type               // 'product' or 'category'
        });
    } catch (error) {
        console.error('Error listing offers:', error);
        res.redirect('/500'); // Redirect to error page in case of failure
    }
};

module.exports = {
    listOffers
};
