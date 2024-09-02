const Product = require('../../models/productModel');

// Function to list stocks with pagination
const listStock = async (req, res) => {
    try {
        const itemsPerPage = 10; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page number
        const totalProducts = await Product.countDocuments({ is_blocked: false });
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        const products = await Product.find({ is_blocked: false })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // Ensure all required data is passed to the EJS template
        res.render('stock-list', {
            products,           // List of products
            currentPage: page,  // Current page number
            totalPages,         // Total number of pages
            successMessage: req.query.success || null // Pass success message from query parameters
        });
    } catch (error) {
        console.error('Error listing stock:', error);
        res.redirect('/500'); // Redirect to error page in case of failure
    }
};

// Function to add stocks
const addStocks = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        product.quantity += parseInt(quantity, 10);
        product.status = product.quantity <= 0 ? 'Out of Stock' : 'Available'; // Update status based on new quantity

        await product.save();

        // Redirect to stock list page with a success message and maintain pagination
        const currentPage = parseInt(req.query.page) || 1; // Keep consistent with pagination
        res.redirect(`/admin/stocks?page=${currentPage}&success=Stock added successfully!`);
    } catch (error) {
        console.error('Error adding stock:', error);
        res.redirect('/500'); // Redirect to error page in case of failure
    }
};

module.exports = {
    listStock,
    addStocks
};
