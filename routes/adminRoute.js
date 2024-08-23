

// const fs = require('fs')
// const express = require('express');
// const flash = require('connect-flash');
// const path = require('path');

// const adminRoute = express();
// adminRoute.use(express.static(path.join(__dirname, '../public/uploads'))); // Ensure correct path for uploads
// adminRoute.use('/public', express.static(path.join(__dirname, '../public'))); // Ensure correct path for public
// adminRoute.set('view engine', 'ejs');
// adminRoute.set('views', path.join(__dirname, '../views/admin')); // Ensure correct path for views

// adminRoute.use(flash());

// const authAdmin = require('../middlewares/adminAuth');
// const adminController = require('../controllers/adminController');
// const categoryController = require('../controllers/categoryController');
// const productController = require('../controllers/productController');

// const multer = require('multer');


// // Set up multer storage configuration
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '../public/uploads')); // Path to save uploaded files
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname)); // Filename format
//     }
// });

// const upload = multer({ storage: storage });


// // Admin Login Routes
// adminRoute.get('/login',authAdmin.isLogout, adminController.getAdminLogin);
// adminRoute.post('/login',authAdmin.isLogout, adminController.postAdminLogin);

// adminRoute.get('/', (req, res) => {
//     return res.redirect('/admin/login');
// });

// // Admin Home
// adminRoute.get('/dashboard', authAdmin.isLogin, adminController.getAdminDashboard);

// // Customer Management
// adminRoute.get('/users-list', authAdmin.isLogin, adminController.getUser);

// // Delete User Route
// adminRoute.get('/block-user', authAdmin.isLogin, adminController.blockUser);
// adminRoute.get('/unblock-user', authAdmin.isLogin, adminController.unblockUser);

// // Categories
// adminRoute.get('/category', authAdmin.isLogin,categoryController.getCategory);
// adminRoute.post('/addCategory',authAdmin.isLogin, categoryController.addCategory);
// adminRoute.get('/listCategory', authAdmin.isLogin,categoryController.listCategory);
// adminRoute.get('/unlistCategory', authAdmin.isLogin, categoryController.unListCategory);
// adminRoute.get('/edit-category/:id',authAdmin.isLogin, categoryController.getEditCategory);
// adminRoute.post('/edit-category/:id', authAdmin.isLogin,categoryController.updateCategory);

// adminRoute.get('/add-products',authAdmin.isLogin, productController.loadAddProduct)
// adminRoute.post('/add-products', authAdmin.isLogin,upload.array('images', 5), productController.addNewProduct)
// adminRoute.get('/products', authAdmin.isLogin,productController.productsList)

// adminRoute.get('/block-product', authAdmin.isLogin,productController.blockProduct)
// adminRoute.get('/unblock-product', authAdmin.isLogin,productController.unblockProduct)


// adminRoute.get('/edit-product/:id', authAdmin.isLogin, productController.loadEditProduct);
// adminRoute.post('/edit-product/:id',authAdmin.isLogin, upload.array('images', 5), productController.editProduct);



// adminRoute.get('/logout', adminController.logout);

// module.exports = adminRoute;



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

adminRoute.use(express.static(path.join(__dirname, '../public/uploads')));
adminRoute.use('/public', express.static(path.join(__dirname, '../public')));
adminRoute.set('view engine', 'ejs');
adminRoute.set('views', path.join(__dirname, '../views/admin'));

const authAdmin = require('../middlewares/adminAuth');
const adminController = require('../controllers/admin/adminController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');

// Apply checkAuth middleware to all routes
adminRoute.use(authAdmin.checkAuth);

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
adminRoute.post('/add-products', authAdmin.isLogin, upload.array('images', 5), productController.addNewProduct);
adminRoute.get('/products', authAdmin.isLogin, productController.productsList);
adminRoute.get('/block-product', authAdmin.isLogin, productController.blockProduct);
adminRoute.get('/unblock-product', authAdmin.isLogin, productController.unblockProduct);
adminRoute.get('/edit-product/:id', authAdmin.isLogin, productController.loadEditProduct);
adminRoute.post('/edit-product/:id', authAdmin.isLogin, upload.array('images', 5), productController.editProduct);

adminRoute.get('/logout', authAdmin.isLogin, adminController.logout);

module.exports = adminRoute;