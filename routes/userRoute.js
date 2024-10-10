
const express = require('express');
const userRoute = express()// Use Router for better scoping
const session = require('express-session');
const flash = require('connect-flash');
const authUser = require('../middlewares/userAuth');

const User = require('../models/userModel')
const userController = require('../controllers/user/userController');
const productController =  require('../controllers/user/productController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController')
const wishlistController = require('../controllers/user/wishlistController')
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
//for checking if user is blocked or not
userRoute.use(authUser.checkUserStatus)
userRoute.use(authUser.userMiddleware);

// Set global variables for flash messages
userRoute.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});
// Middleware to add common variables
userRoute.use((req, res, next) => {
  res.locals.searchQuery = req.query.search || ''; // default value
  // Add other common variables if needed
  next();
});

// Example route that triggers an error
userRoute.get('/error-test', (req, res) => {
  throw new Error('This is a test error!'); // This will be caught by the error handler
});
 

userRoute.use('/public', express.static(path.join(__dirname, '../public')));
userRoute.set('views', path.join(__dirname, '../views/user'));

// User routes
userRoute.get('/', productController.getHome);

userRoute.get('/login', authUser.isLogout, userController.getLogin);
userRoute.post('/login', authUser.isLogout, userController.postLogin);

userRoute.get('/signup', authUser.isLogout, userController.getSignup);
userRoute.post('/signup', authUser.isLogout, userController.postSignup);

userRoute.get('/logout', userController.getLogout);

userRoute.post('/verify-otp', authUser.isLogout, userController.verifyOtp);
userRoute.post('/resend-otp', authUser.isLogout, userController.resendOtp);

userRoute.get('/forgot-password',authUser.isLogout,userController.getForgotPassword)
userRoute.post('/forgot-password',authUser.isLogout,userController.postForgotPassword)

userRoute.get('/forgot-otp',authUser.isLogout,userController.getForgotPasswordOtp)
userRoute.post('/forgot-otp',authUser.isLogout,userController.postForgotPasswordOtp)
userRoute.post('/forgot-otp/resend',authUser.isLogout,userController.resendForgotPasswordOtp)
userRoute.get('/new-password',authUser.isLogout,userController.getNewPassword)
userRoute.post('/new-password',authUser.isLogout,userController.postNewPassword)


//Google OAuth routes

userRoute.get('/auth/google',passport.authenticate('google', { scope: ['profile', 'email'] }));

userRoute.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {

  req.session.userId = req.user.id;
  //for assigning referalcode to google auth users
  userController.assignReferralCodesToUsers(); 
  res.redirect('/home');
});





//product routes
userRoute.get('/home', authUser.isLogin, productController.getHome, authUser.checkUserStatus);
userRoute.get('/products',productController.listProducts)
userRoute.get('/product-details/:id', productController.productDetails);
userRoute.get('/search',productController.search)

// Profile routes
userRoute.get('/account',authUser.isLogin,profileController.getAccount)
userRoute.get('/profile', authUser.isLogin, profileController.getUserProfile);
userRoute.post('/update-profile', authUser.isLogin, profileController.editProfile);
userRoute.post('/change-password', authUser.isLogin, profileController.changePassword);

userRoute.get('/verify-email-otp', authUser.isLogin, profileController.getVerifyEmailOtpPage);  // Render OTP page
userRoute.post('/verify-email-otp', authUser.isLogin, profileController.verifyEmailOtp);
userRoute.post('/verify-email-otp/resend', authUser.isLogin, profileController.resendEmailOtp);

// Address routes
userRoute.get('/address',authUser.isLogin,profileController.getAddress)
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


//checkout routes

// Show checkout page
userRoute.get('/checkout',authUser.isLogin, checkoutController.checkoutPage);

// Process checkout for cash on delivery
userRoute.post('/checkout/cod',authUser.isLogin, checkoutController.orderCashOnDelivery);
userRoute.post('/checkout/wallet',authUser.isLogin, checkoutController.walletPayment);
// Create Razorpay Order
userRoute.post('/create-razorpay-order', authUser.isLogin,checkoutController.createRazorpayOrder);
userRoute.post('/verify-razorpay-payment', authUser.isLogin,checkoutController.verifyRazorpayPayment);
userRoute.post('/checkout/online-payment',authUser.isLogin, checkoutController.processOnlinePaymentCheckout);
userRoute.post('/checkout/failed-payment',authUser.isLogin, checkoutController.failedOnlinePaymentCheckout);


// Apply coupon
userRoute.post('/apply-coupon',authUser.isLogin, checkoutController.applyCoupon);
userRoute.post('/remove-coupon',authUser.isLogin, checkoutController.removeCoupon);

// order success
userRoute.get('/order-success', authUser.isLogin,checkoutController.getOrderSuccess)
userRoute.get('/payment-failed', authUser.isLogin,checkoutController.getPaymentFailed)
userRoute.post('/order/:id/retry-payment',authUser.isLogin, checkoutController.retryPayments);

// Define the route to verify Razorpay payment
userRoute.post('/order/:id/verify-razorpay-payment', authUser.isLogin, checkoutController.verifyRazorpayPayment);


//order
userRoute.get('/order',authUser.isLogin,orderController.orderList)
userRoute.post('/order/:orderId/cancel',authUser.isLogin, orderController.orderCancel);
userRoute.get('/order-details/:orderId',authUser.isLogin,orderController.viewOrderDetails)
userRoute.post('/order/return/:orderId',authUser.isLogin,orderController.returnOrder)
userRoute.post('/order/:orderId/:productId/return', orderController.returnSingleProduct);
userRoute.post('/order/:orderId/:productId/cancel', orderController.cancelSingleProduct);


//wishlist
userRoute.get('/wishlist',authUser.isLogin,wishlistController.getWishlist)
userRoute.post('/wishlist/add',authUser.isLogin,wishlistController.addWishlist)
userRoute.post('/wishlist/remove',authUser.isLogin,wishlistController.removeWishlist)

//coupon
userRoute.get('/coupons',authUser.isLogin,checkoutController.getCoupons)
userRoute.post('/coupons/apply',authUser.isLogin,checkoutController.applyCoupon)

//wallet
userRoute.get('/wallet',authUser.isLogin,userController.getWallet)

//invoice download
userRoute.get('/download-Invoice/:orderId',orderController.downloadInvoice)

userRoute.use(express.json()); // Add this if not already present


userRoute.use(userController.errorHandler)


module.exports = userRoute;
