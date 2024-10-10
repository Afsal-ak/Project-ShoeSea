

const bcrypt = require('bcrypt');
const User = require('../../models/userModel');
const Order = require('../../models/orderModel')
const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel')

const getAdminLogin = (req, res,next) => {
    try {
        if (req.session.isAuth && req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        const messages = req.flash('errors');
        res.render('adminlogin', { messages });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
};

const postAdminLogin = async (req, res,next) => {
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
        next(error)
    }
};


const getAdminDashboard = async (req, res, next) => {
    try {
        if (!req.session.isAuth || !req.session.adminId) {
            return res.redirect('/admin/login');
        }

        const { filter: queryFilter, startDate: queryStartDate, endDate: queryEndDate } = req.query;
        const filter = queryFilter || 'today'; // Set default filter to 'today'
        let startDate, endDate;

        // Set date range based on filter type
        switch (filter) {
            case 'today':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
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

        // Top 10 Products aggregation
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

        // Top 10 Categories aggregation
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

        // Top 10 Brands aggregation
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
            case 'today':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: { $hour: "$orderDate" },
                            totalQuantity: { $sum: "$products.quantity" }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
                break;
            case 'daily':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                            totalQuantity: { $sum: "$products.quantity" }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
                break;
            case 'weekly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: { 
                                year: { $year: "$orderDate" },
                                week: { $week: "$orderDate" }
                            },
                            totalQuantity: { $sum: "$products.quantity" }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.week": 1 } }
                ]);
                break;
            case 'monthly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: { 
                                year: { $year: "$orderDate" },
                                month: { $month: "$orderDate" }
                            },
                            totalQuantity: { $sum: "$products.quantity" }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } }
                ]);
                break;
            case 'yearly':
                salesChartData = await Order.aggregate([
                    { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: { $year: "$orderDate" },
                            totalQuantity: { $sum: "$products.quantity" }
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
                case 'today':
                    label = `${item._id}:00`;
                    break;
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

    } catch (error) {
        console.error("Error loading dashboard:", error);
        next(error);
    }
};



const getUser = async (req, res,next) => {
    try {
        const activeUser = await User.find({ is_blocked: false });
        const blockedUser = await User.find({ is_blocked: true });
        const allUser = activeUser.concat(blockedUser);
        res.render('user-list', { users: allUser });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
};

const blockUser = async (req, res,next) => {
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
        next(error)
    }
};

const unblockUser = async (req, res,next) => {
    const id = req.query.id;
    try {
        const userData = await User.findByIdAndUpdate(id, { is_blocked: false });
        if (!userData) {
            return res.status(404).send('User not found');
        }
        return res.redirect('/admin/users-list');
    } catch (error) {
        console.error('Error unblocking user:', error);
        next(error)
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