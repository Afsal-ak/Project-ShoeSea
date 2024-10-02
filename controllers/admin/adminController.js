

const bcrypt = require('bcrypt');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel')
const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')

const getAdminLogin = (req, res) => {
    try {
        if (req.session.isAuth && req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        const messages = req.flash('errors');
        res.render('adminlogin', { messages });
    } catch (error) {
        console.log(error.message);
    }
};

const postAdminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email, is_admin: true });
        if (!user) {
            req.flash('errors', 'Please Enter Correct Email and Password');
            return res.redirect('/admin/login');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            req.session.isAuth = true;
            req.session.adminId = user._id;
            console.log('Admin session created', req.session.adminId);
            return res.redirect('/admin/dashboard');
        } else {
            req.flash('error', 'Please Enter Correct Email and Password');
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const ogetAdminDashboard = async (req, res) => {
    try {
        if (!req.session.isAuth || !req.session.adminId) {
            return res.redirect('/admin/login');
        }

        const { filter, startDate: queryStartDate, endDate: queryEndDate } = req.query;
        let startDate, endDate;

        // Set date range based on filter type
        switch (filter) {
            case 'daily':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                break;
            case 'weekly':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                endDate = new Date();
                break;
            case 'monthly':
                startDate = new Date();
                startDate.setDate(1); // Start of the month
                endDate = new Date();
                break;
            case 'yearly':
                startDate = new Date();
                startDate.setMonth(0, 1); // Start of the year
                endDate = new Date();
                break;
            case 'custom':
                startDate = new Date(queryStartDate || '2024-01-01');
                endDate = new Date(queryEndDate || Date.now());
                break;
            default:
                startDate = new Date('2024-01-01');
                endDate = new Date();
        }

        // Top 10 Products aggregation (unchanged)
        const topProducts = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    productName: "$product.productName",
                    totalSold: 1
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Top 10 Categories aggregation (unchanged)
        const topCategories = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.categoryId',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails._id",
                    categoryName: { $first: "$categoryDetails.categoryName" },
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        // Top 10 Brands aggregation (unchanged)
        const topBrands = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            { $unwind: "$brandDetails" },
            {
                $group: {
                    _id: "$brandDetails.brand",
                    brandName: { $first: "$brandDetails.brand" },
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        // Adjust aggregation based on filter (daily, weekly, monthly, yearly)
        let groupId;
        let dateFormat;

        switch (filter) {
            case 'daily':
                groupId = { year: { $year: "$orderDate" }, month: { $month: "$orderDate" }, day: { $dayOfMonth: "$orderDate" } };
                dateFormat = sale => `${sale._id.year}-${sale._id.month}-${sale._id.day}`;
                break;
            case 'weekly':
                groupId = { year: { $year: "$orderDate" }, week: { $week: "$orderDate" } };
                dateFormat = sale => `Week ${sale._id.week}, ${sale._id.year}`;
                break;
            case 'monthly':
                groupId = { year: { $year: "$orderDate" }, month: { $month: "$orderDate" } };
                dateFormat = sale => `${sale._id.year}-${sale._id.month}`;
                break;
            case 'yearly':
                groupId = { year: { $year: "$orderDate" } };
                dateFormat = sale => `${sale._id.year}`;
                break;
            default:
                // Default case to handle any missing filter or invalid case
                groupId = { year: { $year: "$orderDate" } };
                dateFormat = sale => `${sale._id.year}`;
                break;
        }

        // Sales Data aggregation based on filter
        const salesData = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: groupId, totalSales: { $sum: "$totalAmount" } } },
            { $sort: { "_id": 1 } }
        ]);

        // User Data aggregation based on filter
        const userData = await User.aggregate([
            { $match: { registrationDate: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: groupId, totalUsers: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // Format the sales and user data for the frontend
        const formattedSalesData = salesData.map(sale => ({
            date: dateFormat(sale),
            totalSales: sale.totalSales
        }));

        const formattedUserData = userData.map(user => ({
            date: dateFormat(user),
            totalUsers: user.totalUsers
        }));

        // Render the data to the view
        res.render('dashboard', {
            topProducts,
            topCategories,
            topBrands,
            startDate,
            endDate,
            filter,
  formattedSalesData,
            userData: formattedUserData,
        });

    } catch (err) {
        console.error("Error loading dashboard:", err);
        res.status(500).send('Internal Server Error');
    }
};


const getAdminDashboard = async (req, res) => {
    try {
        if (!req.session.isAuth || !req.session.adminId) {
            return res.redirect('/admin/login');
        }

        const { filter, startDate: queryStartDate, endDate: queryEndDate } = req.query;
        let startDate, endDate;

         // Set date range based on filter type
         switch (filter) {
            case 'daily':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30); // Last 30 days
                endDate = new Date();
                break;
            case 'weekly':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7 * 12); // Last 12 weeks
                endDate = new Date();
                break;
            case 'monthly':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
                endDate = new Date();
                break;
            case 'yearly':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 5); // Last 5 years
                endDate = new Date();
                break;
            case 'custom':
                startDate = new Date(queryStartDate || '2024-01-01');
                endDate = new Date(queryEndDate || Date.now());
                break;
            default:
                startDate = new Date('2024-01-01');
                endDate = new Date();
        }

        // Existing aggregations (topProducts, topCategories, topBrands) remain unchanged
  // Top 10 Products aggregation (unchanged)
        const topProducts = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    productName: "$product.productName",
                    totalSold: 1
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Top 10 Categories aggregation (unchanged)
        const topCategories = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: "$productDetails" },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.categoryId',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $group: {
                    _id: "$categoryDetails._id",
                    categoryName: { $first: "$categoryDetails.categoryName" },
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        // Top 10 Brands aggregation (unchanged)
        const topBrands = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            { $unwind: "$brandDetails" },
            {
                $group: {
                    _id: "$brandDetails.brand",
                    brandName: { $first: "$brandDetails.brand" },
                    totalSales: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

       
        // Sales chart data aggregation based on the filter (sum of products.quantity)
        let salesChartData = [];
        switch (filter) {
            case 'daily':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" }, // Unwind products to access each one
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                            totalQuantity: { $sum: "$products.quantity" } // Sum of product quantities
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
                break;
            case 'weekly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" }, // Unwind products to access each one
                    {
                        $group: {
                            _id: { 
                                year: { $year: "$orderDate" },
                                week: { $week: "$orderDate" }
                            },
                            totalQuantity: { $sum: "$products.quantity" } // Sum of product quantities
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.week": 1 } }
                ]);
                break;
            case 'monthly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" }, // Unwind products to access each one
                    {
                        $group: {
                            _id: { 
                                year: { $year: "$orderDate" },
                                month: { $month: "$orderDate" }
                            },
                            totalQuantity: { $sum: "$products.quantity" } // Sum of product quantities
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } }
                ]);
                break;
            case 'yearly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" }, // Unwind products to access each one
                    {
                        $group: {
                            _id: { $year: "$orderDate" },
                            totalQuantity: { $sum: "$products.quantity" } // Sum of product quantities
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
                break;
        }

        // Format the sales chart data for frontend
        const formattedSalesChartData = salesChartData.map(item => {
            let label;
            switch (filter) {
                case 'daily':
                    label = new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    break;
                case 'weekly':
                    label = `W${item._id.week} ${item._id.year}`;
                    break;
                case 'monthly':
                    label = new Date(item._id.year, item._id.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    break;
                case 'yearly':
                    label = item._id.toString();
                    break;
            }
            return {
                label: label,
                value: item.totalQuantity || 0
            };
        });

        // Render the data to the view
        res.render('dashboard', {
            topProducts,
            topCategories,
            topBrands,
            startDate,
            endDate,
            filter,
            salesChartData: formattedSalesChartData
        });


    } catch (err) {
        console.error("Error loading dashboard:", err);
        res.status(500).send('Internal Server Error');
    }
};


const getSalesData = async (req, res) => {
    const { dateFilter, startDate, endDate } = req.body;

    let filter = {};
    const currentDate = new Date();
    
    // Build the filter query based on the date filter
    switch (dateFilter) {
        case 'daily':
            filter.orderDate = { $gte: new Date(currentDate.setHours(0, 0, 0, 0)) };
            break;
        case 'weekly':
            filter.orderDate = { $gte: new Date(currentDate.setDate(currentDate.getDate() - 7)) };
            break;
        case 'monthly':
            filter.orderDate = { $gte: new Date(currentDate.setMonth(currentDate.getMonth() - 1)) };
            break;
        case 'yearly':
            filter.orderDate = { $gte: new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)) };
            break;
        case 'custom':
            filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
            break;
    }

    // Fetch data based on filter
    const topProducts = await Order.aggregate([
        { $match: filter },
        { $unwind: "$products" },
        {
            $group: {
                _id: "$products.productId",
                totalSold: { $sum: "$products.quantity" },
            },
        },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
        { $project: { productName: "$productDetails.name", totalSold: 1 } },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
    ]);

    // Repeat similar aggregation for topCategories, topBrands, etc.
    
    res.render('adminDashboard', { topProducts });
};


//const getFilterSale=async()


const getUser = async (req, res) => {
    try {
        const activeUser = await User.find({ is_blocked: false });
        const blockedUser = await User.find({ is_blocked: true });
        const allUser = activeUser.concat(blockedUser);
        res.render('user-list', { users: allUser });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const blockUser = async (req, res) => {
    const id = req.query.id;
    try {
        const userData = await User.findByIdAndUpdate(id, { is_blocked: true });
        if (!userData) {
            return res.status(404).send('User not found');
        }
        console.log('Block success');
        res.redirect('/admin/users-list');
    } catch (error) {
        console.log('Block failed');
        console.error('Error blocking user:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const unblockUser = async (req, res) => {
    const id = req.query.id;
    try {
        const userData = await User.findByIdAndUpdate(id, { is_blocked: false });
        if (!userData) {
            return res.status(404).send('User not found');
        }
        return res.redirect('/admin/users-list');
    } catch (error) {
        console.log('Unblock failed');
        console.error('Error unblocking user:', error);
        return res.status(500).send('Internal Server Error');
    }
};


const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
         }
        console.log('Admin session destroyed');
        res.redirect('/admin/login');
    });
};
module.exports = {
    getAdminLogin,
    postAdminLogin,
    getAdminDashboard,
    getUser,
    blockUser,
    unblockUser,
    logout
};