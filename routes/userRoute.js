
const express = require('express');
const userRoute = express()// Use Router for better scoping
const session = require('express-session');
const flash = require('connect-flash');
const authUser = require('../middlewares/userAuth');

const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
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

// Checkout and order routes
//userRoute.get('/checkout', authUser.isLogin, orderController.getCheckoutPage);
//userRoute.post('/checkout', authUser.isLogin, orderController.getCheckoutPage); // Make sure this is needed; typically GET is enough.
userRoute.get('/order-success', authUser.isLogin,orderController.getOrderSuccess)
//userRoute.post('/place-order', authUser.isLogin, orderController.placeOrder); // Secure with isLogin
userRoute.get('/buy-now',authUser.isLogin,orderController.buyNow)
//userRoute.get('/checkout/buy-now', authUser.isLogin, orderController.getBuyNowCheckout);



// Show checkout page
userRoute.get('/checkout',authUser.isLogin, orderController.checkoutPage);

// Apply coupon
userRoute.post('/apply-coupon',authUser.isLogin, orderController.applyCoupon);

userRoute.post('/remove-coupon',authUser.isLogin, orderController.removeCoupon);

// Process checkout
userRoute.post('/checkout/cod',authUser.isLogin, orderController.processCheckout);


// Create Razorpay Order
userRoute.post('/create-razorpay-order', authUser.isLogin,orderController.createRazorpayOrder);

// Process online payment (verify and complete order)
userRoute.post('/verify-razorpay-payment', authUser.isLogin,orderController.verifyRazorpayPayment);

userRoute.post('/checkout/online-payment',authUser.isLogin, orderController.processOnlinePaymentCheckout);

// userRoute.post('/prepare-checkout',orderController.prepareCheckout)
// userRoute.post('/create-order',orderController.createOrder)

//userRoute.post('/verify-razorpay-payment', orderController.verifyRazorpayPayment);

// Route to display order success page

//order
userRoute.get('/order',authUser.isLogin,orderController.orderList)
userRoute.post('/order/:orderId/cancel',authUser.isLogin, orderController.orderCancel);
userRoute.get('/order-details/:orderId',authUser.isLogin,orderController.viewOrderDetails)
userRoute.post('/order/return/:orderId',authUser.isLogin,orderController.returnOrder)

//wishlist
userRoute.get('/wishlist',authUser.isLogin,wishlistController.getWishlist)
userRoute.post('/wishlist/add',authUser.isLogin,wishlistController.addWishlist)
userRoute.post('/wishlist/remove',authUser.isLogin,wishlistController.removeWishlist)

//coupon
userRoute.get('/coupons',authUser.isLogin,orderController.getCoupons)
userRoute.post('/coupons/apply',authUser.isLogin,orderController.applyCoupon)

//wallet
userRoute.get('/wallet',authUser.isLogin,userController.getWallet)


userRoute.use(express.json()); // Add this if not already present

// Simulated in-memory data
let products = [
  { id: 1, name: 'Product 1', quantity: 5 },
  { id: 2, name: 'Product 2', quantity: 10 }
];

// Route to serve the HTML page
userRoute.get('/carts', (req, res) => {
  res.render('fetch.ejs')
});

// Route to handle quantity update via fetch
userRoute.post('/update-quantity/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const { quantity } = req.body;

  const product = products.find(p => p.id === productId);
  if (product) {
    product.quantity = parseInt(quantity, 10);
    res.json({ message: 'Quantity updated', product });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

module.exports = userRoute;
