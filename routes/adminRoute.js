

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');

const adminRoute = express();

// Session middleware
adminRoute.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

adminRoute.use(flash());
adminRoute.set('views', path.join(__dirname, 'views')); // Ensure this path is correct

adminRoute.use(express.static(path.join(__dirname, '../public/uploads')));
adminRoute.use('/public', express.static(path.join(__dirname, '../public')));
adminRoute.set('view engine', 'ejs');
adminRoute.set('views', path.join(__dirname, '../views/admin'));

const authAdmin = require('../middlewares/adminAuth');
const adminController = require('../controllers/admin/adminController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');
const orderController=require('../controllers/admin/orderController')
const stockController=require('../controllers/admin/stockController')
const couponController=require('../controllers/admin/couponController')
const salesController=require('../controllers/admin/salesController')
const offerController=require('../controllers/admin/offerController')

// Apply checkAuth middleware to all routes
adminRoute.use(authAdmin.checkAuth);


// Set up connect-flash
adminRoute.use(flash());

// Make flash messages available globally
adminRoute.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    next();
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
adminRoute.use(authAdmin.checkAuth);

// Routes
adminRoute.get('/login', authAdmin.isLogout, adminController.getAdminLogin);
adminRoute.post('/login', authAdmin.isLogout, adminController.postAdminLogin);

adminRoute.get('/', (req, res) => {
    if (req.session.isAuth && req.session.adminId) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

// // Routes
// adminRoute.get('/login', adminController.getAdminLogin);
// adminRoute.post('/login', adminController.postAdminLogin);

// adminRoute.get('/', (req, res) => {
//     if (req.session.isAuth && req.session.adminId) {
//         res.redirect('/admin/dashboard');
//     } else {
//         res.render('adminlogin');
//     }
// });

adminRoute.get('/dashboard', authAdmin.isLogin, adminController.getAdminDashboard);
adminRoute.get('/users-list', authAdmin.isLogin, adminController.getUser);
adminRoute.get('/block-user', authAdmin.isLogin, adminController.blockUser);
adminRoute.get('/unblock-user', authAdmin.isLogin, adminController.unblockUser);

// Category routes
adminRoute.get('/category', authAdmin.isLogin, categoryController.getCategory);
adminRoute.post('/addCategory', authAdmin.isLogin, categoryController.addCategory);
adminRoute.get('/listCategory', authAdmin.isLogin, categoryController.listCategory);
adminRoute.get('/unlistCategory', authAdmin.isLogin, categoryController.unListCategory);
adminRoute.get('/edit-category/:id', authAdmin.isLogin, categoryController.getEditCategory);
adminRoute.post('/edit-category/:id', authAdmin.isLogin, categoryController.updateCategory);

// Product routes
adminRoute.get('/add-products', authAdmin.isLogin, productController.loadAddProduct);
//adminRoute.get('/add-products', authAdmin.isLogin, productController.getAddProduct);

adminRoute.post('/add-products', authAdmin.isLogin, upload.array('images', 4), productController.addNewProduct);
adminRoute.get('/products', authAdmin.isLogin, productController.productsList);
adminRoute.get('/block-product', authAdmin.isLogin, productController.blockProduct);
adminRoute.get('/unblock-product', authAdmin.isLogin, productController.unblockProduct);
adminRoute.get('/edit-product/:id', authAdmin.isLogin, productController.loadEditProduct);
adminRoute.post('/edit-product/:id', authAdmin.isLogin, upload.array('images', 4), productController.editProduct);
adminRoute.post('/edit-product/:id/delete-image', authAdmin.isLogin, productController.deleteProductImage);

//order
adminRoute.get('/orders',orderController.listOrder)

adminRoute.get('/orders/:id',orderController.viewOrder)
adminRoute.post('/orders/deliver/:id',orderController.orderDelivered)
adminRoute.post('/orders/cancel/:id',orderController.orderCancel)
adminRoute.post('/orders/ship/:id',orderController.orderShipped)


//stock 
adminRoute.get('/stocks',stockController.listStock)
adminRoute.post('/stocks/add',stockController.addStocks)

//coupon
adminRoute.get('/coupons',couponController.getCouponList)
adminRoute.get('/coupons/create',couponController.getCreateCoupon)
adminRoute.post('/coupons/create',couponController.postCreateCoupon)
adminRoute.post('/coupons/block/:id',couponController.blockCoupon)
adminRoute.post('/coupons/unblock/:id',couponController.unBlockCoupon)



//sales
adminRoute.get('/sales-report', salesController.getSalesReport);
//adminRoute.get('/download-report', salesController.downloadReport);
adminRoute.get('/download-report-pdf', salesController.downloadPdf);
adminRoute.get('/download-report-excel', salesController.downloadExcel);

//adminRoute.get('/download-excel', salesController.excelDownload)
//offer
adminRoute.get('/offers',offerController.listOffers)

//referral
adminRoute.get('/referral',offerController.getReferralOffer)

adminRoute.get('/add-referral',offerController.addReferralCode)
adminRoute.post('/add-referral-offer',offerController.postAddReferralCode)
adminRoute.get('/block-referral/:id',offerController.blockReferral)
adminRoute.get('/unblock-referral/:id',offerController.unBlockReferral)


adminRoute.get('/logout', authAdmin.isLogin, adminController.logout);

module.exports = adminRoute;