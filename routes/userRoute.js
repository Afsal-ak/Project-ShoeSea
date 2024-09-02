
// const express = require('express');
// const userRoute = express();
// const session = require('express-session');
// const flash = require('connect-flash');
// const authUser = require('../middlewares/userAuth');
// const userController = require('../controllers/user/userController');
// const profileController=require('../controllers/user/profileController')
// const cartController=require('../controllers/user/cartController')
// const orderController=require('../controllers/user/orderController')
// const passport = require('passport');
// require('dotenv').config();
// const path = require('path');


// userRoute.use(flash());

// // Add flash middleware to your routes
// userRoute.use((req, res, next) => {
//   res.locals.success_msg = req.flash('success_msg');
//   res.locals.error_msg = req.flash('error_msg');
//   next();
// });
// // Middleware
// userRoute.use(express.static('public'));
// userRoute.use(express.urlencoded({ extended: true }));
// userRoute.use(express.json());

// // Initialize session
// userRoute.use(session({
//   secret: process.env.SESSION_SECRET || 'your-session-secret',
//   resave: false,
//   saveUninitialized: false
// }));

// // Initialize flash
// userRoute.use(flash());

// userRoute.use('/public', express.static(path.join(__dirname, '../public')));
// userRoute.set('views', path.join(__dirname, '../views/user'));

// // Routes
// userRoute.get('/', userController.getHome);

// userRoute.get('/login', authUser.isLogout, userController.getLogin);
// userRoute.post('/login', authUser.isLogout, userController.postLogin);

// userRoute.get('/signup', authUser.isLogout, userController.getSignup);
// userRoute.post('/signup', authUser.isLogout, userController.postSignup);

// userRoute.post('/verify-otp', authUser.isLogout, userController.verifyOtp);
// userRoute.post('/resend-otp', authUser.isLogout, userController.resendOtp);

// userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
//   res.redirect('/home');
// });

// userRoute.get('/home', authUser.isLogin, userController.getHome, authUser.checkUserStatus);

// userRoute.get('/product-details/:id', userController.productDetails);

// userRoute.get('/logout', userController.getLogout);

// userRoute.get('/profile',authUser.isLogin,profileController.getUserProfile)
// userRoute.post('/update-profile',profileController.editProfile)

// userRoute.post('/change-password', profileController.changePassword);

// userRoute.get('/add-address',authUser.isLogin,profileController.getAddressForm)
// userRoute.post('/add-address',authUser.isLogin,profileController.addAddress)
// userRoute.get('/edit-address/:id',profileController.getEditAddressForm)
// userRoute.post('/edit-address/:id',profileController.updateAddress)
// userRoute.get('/delete-address/:id',profileController.deleteAddress)


// // Add cart routes
// userRoute.post('/cart/add', authUser.isLogin, cartController.addToCart);
// userRoute.get('/cart', authUser.isLogin, cartController.showCart);
// userRoute.get('/cart/delete', authUser.isLogin, cartController.deleteFromCart);
// userRoute.post('/cart/update', authUser.isLogin, cartController.updateQuantity);
// userRoute.get('/checkout',authUser.isLogin, orderController.getCheckoutPage);
// userRoute.post('/checkout', authUser.isLogin,orderController.getCheckoutPage);
// // Route to handle order placement (POST request)
// userRoute.post('/place-order', orderController.placeOrder);

// module.exports = userRoute;


const express = require('express');
const userRoute = express()// Use Router for better scoping
const session = require('express-session');
const flash = require('connect-flash');
const authUser = require('../middlewares/userAuth');
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const passport = require('passport');
require('dotenv').config();
const path = require('path');

// Middleware setup
userRoute.use(express.static('public'));
userRoute.use(express.urlencoded({ extended: true }));
userRoute.use(express.json());
userRoute.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));
userRoute.use(flash());

// Set global variables for flash messages
userRoute.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

userRoute.use('/public', express.static(path.join(__dirname, '../public')));
userRoute.set('views', path.join(__dirname, '../views/user'));

// User routes
userRoute.get('/', userController.getHome);

userRoute.get('/login', authUser.isLogout, userController.getLogin);
userRoute.post('/login', authUser.isLogout, userController.postLogin);

userRoute.get('/signup', authUser.isLogout, userController.getSignup);
userRoute.post('/signup', authUser.isLogout, userController.postSignup);

userRoute.post('/verify-otp', authUser.isLogout, userController.verifyOtp);
userRoute.post('/resend-otp', authUser.isLogout, userController.resendOtp);

userRoute.get('/forgot-password',authUser.isLogout,userController.getForgotPassword)
userRoute.post('/forgot-password',authUser.isLogout,userController.postForgotPassword)

userRoute.get('/forgot-otp',authUser.isLogout,userController.getForgotPasswordOtp)
userRoute.post('/forgot-otp',authUser.isLogout,userController.postForgotPasswordOtp)
userRoute.post('/forgot-otp/resend',authUser.isLogout,userController.resendForgotPasswordOtp)
userRoute.get('/new-password',authUser.isLogout,userController.getNewPassword)
userRoute.post('/new-password',authUser.isLogout,userController.postNewPassword)


// Google OAuth routes
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
  res.redirect('/home');
});

userRoute.get('/home', authUser.isLogin, userController.getHome, authUser.checkUserStatus);
userRoute.get('/products',userController.listProducts)
userRoute.get('/product-details/:id', userController.productDetails);
userRoute.get('/search',userController.search)
userRoute.get('/logout', userController.getLogout);

// Profile routes
userRoute.get('/account',profileController.getAccount)
userRoute.get('/profile', authUser.isLogin, profileController.getUserProfile);
userRoute.post('/update-profile', authUser.isLogin, profileController.editProfile);
userRoute.post('/change-password', authUser.isLogin, profileController.changePassword);

// Address routes
userRoute.get('/add-address', authUser.isLogin, profileController.getAddressForm);
userRoute.post('/add-address', authUser.isLogin, profileController.addAddress);
userRoute.get('/edit-address/:id', authUser.isLogin, profileController.getEditAddressForm);
userRoute.post('/edit-address/:id', authUser.isLogin, profileController.updateAddress);
userRoute.get('/delete-address/:id', authUser.isLogin, profileController.deleteAddress);

// Cart routes
userRoute.post('/cart/add', authUser.isLogin, cartController.addToCart);
userRoute.get('/cart', authUser.isLogin, cartController.showCart);
userRoute.get('/cart/delete', authUser.isLogin, cartController.deleteFromCart);
userRoute.post('/cart/update', authUser.isLogin, cartController.updateQuantity);

// Checkout and order routes
userRoute.get('/checkout', authUser.isLogin, orderController.getCheckoutPage);
userRoute.post('/checkout', authUser.isLogin, orderController.getCheckoutPage); // Make sure this is needed; typically GET is enough.
userRoute.get('/order-success', authUser.isLogin,orderController.getOrderSuccess)
userRoute.post('/place-order', authUser.isLogin, orderController.placeOrder); // Secure with isLogin
//userRoute.get('/buy-now/:productId',authUser.isLogin,orderController.buyNow)
//userRoute.get('/checkout/buy-now', authUser.isLogin, orderController.getBuyNowCheckout);


//order
userRoute.get('/order',orderController.orderList)
userRoute.post('order/cancel/:id')
userRoute.post('/order/:orderId/cancel', orderController.orderCancel);
userRoute.get('/order-details/:orderId',orderController.viewOrderDetails)
userRoute.post('/order/return/:orderId',orderController.returnOrder)



module.exports = userRoute;
