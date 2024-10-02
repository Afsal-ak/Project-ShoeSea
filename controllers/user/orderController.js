const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Coupon = require('../../models/couponModel')

const Razorpay=require('razorpay');
const crypto = require('crypto');
const { trusted } = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs')
require('dotenv').config();

const razorpay= new Razorpay({

    key_id: process.env.RAZORPAY_ID_KEY,  
    key_secret: process.env.RAZORPAY_SECRET_KEY

})


const getOrderSuccess = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;

        if (!userId || !orderId) {
            req.flash('error_msg', 'Invalid request');
            return res.redirect('/home');
        }

        const user = await User.findById(userId);
        const order = await Order.findById(orderId).populate('products.productId');

        if (!user || !order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/home');
        }

        res.render('order-success', { user, order });
    } catch (error) {
        console.error('Error loading order success page:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/home');
    }
}

const getPaymentFailed = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;

        if (!userId || !orderId) {
            req.flash('error_msg', 'Invalid request');
            return res.redirect('/home');
        }

        const user = await User.findById(userId);
        const order = await Order.findById(orderId).populate('products.productId');

        if (!user || !order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/home');
        }

        res.render('payment-failed', { user, order });
    } catch (error) {
        console.error('Error loading order success page:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/home');
    }
}

const orderList = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error_msg', 'Please log in to view your order history.');
            return res.redirect('/login');
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Number of orders per page
        const skip = (page - 1) * limit;

        // Fetch total orders count for the logged-in user
        const totalOrders = await Order.countDocuments({ userId });

        // Fetch orders for the logged-in user, populate products, and apply pagination
        const orders = await Order.find({ userId })
            .populate({ path: 'products.productId', select: 'productName salePrice' })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);

        // Render the order list page with the orders and pagination data
        res.render('order-list', { orders, currentPage: page, totalPages, limit });

    } catch (error) {
        console.error('Error fetching order history:', error.message);
        req.flash('error_msg', 'Unable to fetch order history.');
        res.redirect('/');
    }
};


const orderCancel = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.params.orderId; // Fix to correctly extract orderId from req.params

        if (!userId) {
            req.flash('error_msg', 'User not authenticated.');
            return res.redirect('/login');
        }

        // Fetch the order for the logged-in user
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/order');
        }

        // Check if the order can be cancelled
        if (order.status === 'Cancelled' || order.status === 'Delivered') {
            req.flash('error_msg', 'Order cannot be cancelled.');
            return res.redirect('/order');
        }

        // Update order status to 'Cancelled'
        order.status = 'Cancelled';  // Corrected to assignment operator

        await order.save();  

        for (const productItem of order.products){
            const product=await Product.findById(productItem.productId)

            if(product){
                product.quantity+=productItem.quantity
                await product.save()
            }
        }

        req.flash('success_msg', 'Order cancelled successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        console.error('Error cancelling order:', error);
        req.flash('error_msg', 'Failed to cancel the order.');
        res.redirect('/order');
    }
};


const viewOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error_msg', 'Please log in to view order details.');
            return res.redirect('/login');
        }

        const order = await Order.findOne({ _id: orderId, userId })
            .populate('products.productId');

        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/order');
        }

        res.render('order-details', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        req.flash('error_msg', 'Failed to fetch order details.');
        res.redirect('/order');
    }
};


const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body; 

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status !== 'Delivered') {
            return res.status(400).send('Order cannot be returned');
        }

        // Store the return reason and update the order status
        order.returnReason = reason;
        order.status = 'Returned';

        const user = await User.findById(order.userId);
        user.walletBalance += order.totalAmount;

        user.walletTransaction.push({
            date:Date.now(),
            type:'credit',
            amount:order.totalAmount,
            description:"Product Returned"
        })

        await order.save();
        await user.save();

        for (const productItems of order.products) {
            const product = await Product.findById(productItems.productId);
            if (product) {
                product.quantity += productItems.quantity;
                await product.save();
            }
        }

        req.flash('success_msg', 'Order returned successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};


const getCoupons = async (req, res) => {
    try {
        const userId = req.session.userId; // Retrieve user ID from session
        const user = await User.findById(userId); // Ensure user is logged in

        if (!user) {
            return res.redirect('/login'); // Redirect to login if user is not authenticated
        }

        const page = parseInt(req.query.page) || 1; // Get current page from query params or default to 1
        const limit = 5; // Number of coupons to display per page
        const skip = (page - 1) * limit; // Calculate the number of documents to skip

        // Fetch all active coupons that are not expired with pagination
        const coupons = await Coupon.find({ isActive: true, expirationDate: { $gte: new Date() } })
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCoupons = await Coupon.countDocuments({ isActive: true, expirationDate: { $gte: new Date() } });
        const totalPages = Math.ceil(totalCoupons / limit);

        // Render the coupons page and pass the coupons data to the view
        res.render('coupons', { coupons, page, totalPages });
    } catch (error) {
        console.error('Error fetching coupons:', error.message);
        res.status(500).send('An error occurred while fetching coupons.');
    }
}


const checkoutPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('cart.productId');
        const address = await Address.find({ userId });
        const coupons = await Coupon.find({isActive:true, expirationDate:{ $gte: new Date() }})

        let totalAmount = user.cart.reduce((total, item) => {
            return total + (item.productId.salePrice * item.quantity);
        }, 0);

        const coupon = req.session.coupon || null; // Get the applied coupon from the session

        let discountedTotal = totalAmount;
        if (coupon) {
            discountedTotal = totalAmount - coupon.discountAmount;
        }


        res.render('checkout', {
            user,
            userCart: user,
            totalAmount,
            discountedTotal, // Pass discounted total to the template
            coupon: req.session.coupon, // Pass the coupon details from the session
            userAddress: address,
            coupons,
            error: req.flash('error') // Pass flash errors

            
        });
    } catch (error) {
        console.error('Error showing checkout page:', error.message);
        res.redirect('/500');
    }
};


// // Apply Coupon
const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/login');
        }

        const coupon = await Coupon.findOne({ 
            name: couponCode,
            isActive: 'true',
            expirationDate: { $gte: new Date() }
        });

        if (!coupon) {
            req.flash('error_msg', 'Invalid or expired coupon');
            return res.redirect('/checkout');
        }

        // Get the user's cart
        const userCart = await User.findById(userId).populate('cart.productId');

        if (!userCart) {
            req.flash('error_msg', 'Your cart is empty.');
            return res.redirect('/checkout');
        }

        // Calculate the total cart amount
        const cartTotal = userCart.cart.reduce((total, item) => {
            return total + (item.productId.salePrice * item.quantity);
        }, 0);

        // Calculate the discount and new total
        const discountAmount = coupon.offerPrice;
        const discountedTotal = Math.max(cartTotal - discountAmount, 0); // Ensure the total doesn't go below zero

        // Store coupon and discount details in session
        req.session.coupon = {
            code: coupon.name,
            discountAmount,
            cartTotal,
            discountedTotal
        };

        res.redirect('/checkout');
    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.redirect('/500');
    }
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Ensure the user is logged in
        if (!userId) {
            return res.redirect('/login');
        }

        // Check if a coupon is applied
        if (req.session.coupon) {
            // Remove the coupon from the session
            req.session.coupon = null;

            // Set a flash message to confirm the coupon has been removed
            req.flash('success_msg', 'Coupon removed successfully.');
        } else {
            // Set a flash message if no coupon was applied
            req.flash('error_msg', 'No coupon was applied.');
        }

        // Redirect back to the checkout page
        res.redirect('/checkout');
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        res.redirect('/500'); // Handle any server errors
    }
};

const orderCashOnDelivery = async (req, res) => {
    try {
        const { paymentMethod, addressId, useWallet } = req.body; // 'useWallet' checkbox input from frontend
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If no address is selected, fetch default address
        let address;
        if (!addressId) {
            address = await Address.findOne({ userId }); 
            if (!address) {
                return res.status(400).json({ message: 'No address available. Please add an address.' });
            }
        } else {
            address = await Address.findById(addressId);
        }

        // Calculate total quantity and amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        let finalAmount = totalAmount;
        let discount = 0;

        // Apply coupon if available
        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (!appliedCoupon) {
                req.session.coupon = null;
                req.flash('error_msg', 'Invalid or expired coupon');
                return res.redirect('/checkout');
            }
            if (totalAmount < appliedCoupon.minimumPrice) {
                req.flash('error_msg', `Minimum order amount for this coupon is ₹${appliedCoupon.minimumPrice}`);
                return res.redirect('/checkout');
            }

            if (appliedCoupon.discountType === 'flat') {
                discount = appliedCoupon.offerPrice;
                finalAmount = Math.max(totalAmount - discount, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                discount = totalAmount * (appliedCoupon.offerPrice / 100);
                finalAmount = Math.max(totalAmount - discount, 0);
            }
        }

        // Wallet Deduction Logic
        let walletUsed = 0;
        if (useWallet && user.walletBalance > 0) {
            if (user.walletBalance >= finalAmount) {
                walletUsed = finalAmount;
                finalAmount = 0; // Wallet covers the whole amount
            } else {
                walletUsed = user.walletBalance;
                finalAmount -= walletUsed; // Wallet partially covers the amount
            }
        }

        // Restrict Cash on Delivery for orders above ₹1000 (after wallet deduction)
        if (paymentMethod === 'Cash on Delivery' && finalAmount > 1000) {
            req.flash('error', 'Cash on Delivery is not available for orders above ₹1000. Please select another payment method.');
            return res.redirect('/checkout');
        }

        // Delivery charge logic
        const deliveryCharge = 100; // Default delivery charge
        let deliveryAmount = 0;

        // Apply delivery charge if final amount is less than ₹500
        if (finalAmount < 500 && finalAmount > 0) {
            finalAmount += deliveryCharge;
            deliveryAmount = deliveryCharge;
        }

        // Check product stock and update quantities
        for (const item of user.cart) {
            const product = await Product.findById(item.productId._id);
            if (product.quantity < item.quantity) {
                req.flash('error_msg', `Insufficient stock for product: ${product.name}`);
                return res.redirect('/checkout');
            }
            // Decrease product quantity
            product.quantity -= item.quantity;
            await product.save();
        }

        // Generate unique order ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = Math.floor(Math.random() * 100000000) + 1;
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order
        const newOrder = new Order({
            orderId,
            userId: user._id,
            addressId: address._id,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod,
            status: finalAmount === 0 ? 'Paid' : 'Pending', // Mark as paid if the wallet covers the whole amount
            discount: discount,
            walletUsed, // Track wallet usage in the order
            shippingAddress: {
                fname: address.fname,
                lname: address.lname,
                housename: address.housename,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                phone: address.phone
            },
            deliveryCharge: deliveryAmount,
            orderDate: new Date(),
        });

        await newOrder.save();

        // Deduct the used wallet amount from user's wallet
        if (walletUsed > 0) {
            user.walletBalance -= walletUsed;
        }

        // Clear user's cart and coupon
        user.cart = [];
        await user.save();
        req.session.coupon = null;

        // Redirect to success page
        req.flash('success_msg', 'Order placed successfully');
        res.redirect(`/order-success?orderId=${newOrder._id}`);
    } catch (error) {
        console.error('Error processing checkout:', error.message);
        res.redirect('/500');
    }
};

const walletPayment = async (req, res) => {
    try {
        const { paymentMethod, addressId } = req.body; // 'useWallet' checkbox input from frontend
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If no address is selected, fetch default address
        let address;
        if (!addressId) {
            address = await Address.findOne({ userId }); 
            if (!address) {
                return res.status(400).json({ message: 'No address available. Please add an address.' });
            }
        } else {
            address = await Address.findById(addressId);
        }

        // Calculate total quantity and amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        let finalAmount = totalAmount;
        let discount = 0;

        // Apply coupon if available
        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (!appliedCoupon) {
                req.session.coupon = null;
                req.flash('error_msg', 'Invalid or expired coupon');
                return res.redirect('/checkout');
            }
            if (totalAmount < appliedCoupon.minimumPrice) {
                req.flash('error_msg', `Minimum order amount for this coupon is ₹${appliedCoupon.minimumPrice}`);
                return res.redirect('/checkout');
            }

            if (appliedCoupon.discountType === 'flat') {
                discount = appliedCoupon.offerPrice;
                finalAmount = Math.max(totalAmount - discount, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                discount = totalAmount * (appliedCoupon.offerPrice / 100);
                finalAmount = Math.max(totalAmount - discount, 0);
            }
        }

        // Wallet Deduction Logic
        let walletUsed = 0;
        if ( user.walletBalance > 0) {
            if (user.walletBalance >= finalAmount) {
                walletUsed = finalAmount;
               // finalAmount = 0; // Wallet covers the whole amount
            } else {
                // walletUsed = user.walletBalance;
                // finalAmount -= walletUsed; // Wallet partially covers the amount
                req.flash('error', 'insuffiecent balance in wallet');
                return res.redirect('/checkout');
            }
        }
        console.log(walletUsed,'wallet');
        


        // Delivery charge logic
        const deliveryCharge = 100; // Default delivery charge
        let deliveryAmount = 0;

        // Apply delivery charge if final amount is less than ₹500
        if (finalAmount < 500) {
            finalAmount += deliveryCharge;
            deliveryAmount = deliveryCharge;
        }

        // Check product stock and update quantities
        for (const item of user.cart) {
            const product = await Product.findById(item.productId._id);
            if (product.quantity < item.quantity) {
                req.flash('error_msg', `Insufficient stock for product: ${product.name}`);
                return res.redirect('/checkout');
            }
            // Decrease product quantity
            product.quantity -= item.quantity;
            await product.save();
        }

        // Generate unique order ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = Math.floor(Math.random() * 100000000) + 1;
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order
        const newOrder = new Order({
            orderId,
            userId: user._id,
            addressId: address._id,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod,
            paymentStatus: 'Paid',// Mark as paid if the wallet covers the whole amount
            discount: discount,
            walletUsed, // Track wallet usage in the order
            shippingAddress: {
                fname: address.fname,
                lname: address.lname,
                housename: address.housename,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                phone: address.phone
            },
            deliveryCharge: deliveryAmount,
            orderDate: new Date(),
        });

        await newOrder.save();

        // Deduct the used wallet amount from user's wallet
        if (walletUsed > 0) {
            user.walletBalance -= walletUsed;
        }

        // Clear user's cart and coupon
        user.cart = [];
        await user.save();
        req.session.coupon = null;

        // Redirect to success page
        req.flash('success_msg', 'Order placed successfully');
        res.redirect(`/order-success?orderId=${newOrder._id}`);
    } catch (error) {
        console.error('Error processing checkout:', error.message);
        res.redirect('/500');
    }
};


const walletDeduction=  async (req, res) => {
    const { totalAmount } = req.body;
    const userId = req.session.userId;
    
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    let remainingAmount = totalAmount;
    if (user.walletBalance > 0) {
        if (user.walletBalance >= totalAmount) {
            remainingAmount = 0;
        } else {
            remainingAmount = totalAmount - user.walletBalance;
        }
    }

    res.json({
        fullAmountCovered: remainingAmount === 0,
        remainingAmount
    });
}


const processOnlinePaymentCheckout = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;
        const address = await Address.findById(addressId);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify Razorpay payment before proceeding
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(body.toString())
            .digest('hex');

        let paymentStatus = 'Success';

        if (expectedSignature !== razorpay_signature) {
            paymentStatus = 'Payment Failed';  // Update payment status to Payment Failed
            console.log('Invalid payment signature');
        }

        // Calculate total quantity and total amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        // Apply coupon
        let finalAmount = totalAmount;
        let discount = 0;

        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (!appliedCoupon || totalAmount < appliedCoupon.minimumPrice) {
                return res.status(400).json({ success: false, message: 'Invalid coupon or minimum order amount not met' });
            }

            if (appliedCoupon.discountType === 'flat') {
                finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
            }
            discount = appliedCoupon.offerPrice;
        }

        // Fetch delivery charge
        const deliveryCharge = 100;
        let deliveryAmount = 0;

        // Apply delivery charge if final amount is less than ₹500
        if (finalAmount < 500) {
            finalAmount += deliveryCharge;
            deliveryAmount = deliveryCharge;
        }

        // Generate a random order ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = Math.floor(Math.random() * 100000000) + 1;
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order, regardless of payment success
        const newOrder = new Order({
            orderId,
            userId: user._id,
            addressId,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod: 'Razorpay',
            status: 'Pending' ,
            paymentStatus,
            discount: discount,
            shippingAddress: {
                fname: address.fname,
                lname: address.lname,
                housename: address.housename,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                phone: address.phone
            },
            deliveryCharge: deliveryAmount,
            orderDate: new Date(),
            razorpay: {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature
            }
        });

        await newOrder.save();

        // Clear the user's cart after placing the order
        user.cart = [];
        await user.save();

        // Clear the coupon from the session
        req.session.coupon = null;

        //Send response based on payment status
        if (paymentStatus === 'Success') {
            res.status(200).json({ 
                success: true, 
                message: 'Order placed successfully', 
                orderId: newOrder._id 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Payment failed. Order saved with payment failed status.', 
                orderId: newOrder._id 
            });
        }

    } catch (error) {
        console.error('Error processing online payment checkout:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while processing your order', 
            error: error.message 
        });
    }
};

const failedOnlinePaymentCheckout = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;
        const address = await Address.findById(addressId);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify Razorpay payment before proceeding
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(body.toString())
            .digest('hex');

        let paymentStatus = 'Success';

        // if (expectedSignature !== razorpay_signature) {
        //     paymentStatus = ' Payment Failed';  // Update payment status to Payment Failed
        //     console.log('Invalid payment signature');
        // }
        if (expectedSignature !== razorpay_signature) {
            paymentStatus = 'Payment Failed';  // Update payment status to Payment Failed
            console.log('Invalid payment signature');
        }

        // Calculate total quantity and total amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        // Apply coupon
        let finalAmount = totalAmount;
        let discount = 0;

        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (!appliedCoupon || totalAmount < appliedCoupon.minimumPrice) {
                return res.status(400).json({ success: false, message: 'Invalid coupon or minimum order amount not met' });
            }

            if (appliedCoupon.discountType === 'flat') {
                finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
            }
            discount = appliedCoupon.offerPrice;
        }

        // Fetch delivery charge
        const deliveryCharge = 100;
        let deliveryAmount = 0;

        // Apply delivery charge if final amount is less than ₹500
        if (finalAmount < 500) {
            finalAmount += deliveryCharge;
            deliveryAmount = deliveryCharge;
        }

        // Generate a random order ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = Math.floor(Math.random() * 100000000) + 1;
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order, regardless of payment success
        const newOrder = new Order({
            orderId,
            userId: user._id,
            addressId,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod: 'Razorpay',
            status: 'Pending' ,
            paymentStatus:'Payment Pending',
            discount: discount,
            shippingAddress: {
                fname: address.fname,
                lname: address.lname,
                housename: address.housename,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                phone: address.phone
            },
            deliveryCharge: deliveryAmount,
            orderDate: new Date(),
            razorpay: {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature
            }
        });

        await newOrder.save();

     
        // Clear the coupon from the session
        req.session.coupon = null;

        //Send response based on payment status
        if (paymentStatus === 'Success') {
            res.status(200).json({ 
                success: true, 
                message: 'Order placed successfully', 
                orderId: newOrder._id 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Payment failed. Order saved with payment failed status.', 
                orderId: newOrder._id 
            });
        }

    } catch (error) {
        console.error('Error processing online payment checkout:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while processing your order', 
            error: error.message 
        });
    }
};
const vfailedOnlinePaymentCheckout = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;
        const address = await Address.findById(addressId);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify Razorpay payment before proceeding
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(body.toString())
            .digest('hex');

        let paymentStatus = 'Success';
        if (expectedSignature !== razorpay_signature) {
            paymentStatus = 'Payment Failed';  // Update payment status to "Payment Failed"
            console.log('Invalid payment signature');
        }

        // Calculate total quantity and total amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        // Apply coupon
        let finalAmount = totalAmount;
        let discount = 0;

        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (!appliedCoupon || totalAmount < appliedCoupon.minimumPrice) {
                return res.status(400).json({ success: false, message: 'Invalid coupon or minimum order amount not met' });
            }

            if (appliedCoupon.discountType === 'flat') {
                finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
            }
            discount = appliedCoupon.offerPrice;
        }

        // Fetch delivery charge
        const deliveryCharge = 100;
        let deliveryAmount = 0;

        if (finalAmount < 500) {
            finalAmount += deliveryCharge;
            deliveryAmount = deliveryCharge;
        }

        // Generate a random order ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = Math.floor(Math.random() * 100000000) + 1;
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order (failed or pending payment should also be saved)
        const newOrder = new Order({
            orderId,
            userId: user._id,
            addressId,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod: 'Razorpay',
            status: paymentStatus === 'Pending',  // Set "Pending" for failed payments
            paymentStatus: 'Payment Failed',  // Set "Payment Failed"
            discount: discount,
            shippingAddress: {
                fname: address.fname,
                lname: address.lname,
                housename: address.housename,
                city: address.city,
                state: address.state,
                country: address.country,
                pincode: address.pincode,
                phone: address.phone
            },
            deliveryCharge: deliveryAmount,
            orderDate: new Date(),
            razorpay: {
                orderId: razorpay_order_id,  // Save Razorpay order ID even for failed payments
                paymentId: razorpay_payment_id || null,  // Save Razorpay payment ID, can be null if not available
                signature: razorpay_signature || null   // Save Razorpay signature, can be null if not available
            }
        });

        await newOrder.save();

        // Clear the coupon from the session
        req.session.coupon = null;

        // Send response based on payment status
        if (paymentStatus === 'Success') {
            res.status(200).json({
                success: true,
                message: 'Order placed successfully',
                orderId: newOrder._id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment failed. Order saved with payment failed status.',
                orderId: newOrder._id
            });
        }

    } catch (error) {
        console.error('Error processing online payment checkout:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your order',
            error: error.message
        });
    }
};

// Function to create a Razorpay order
const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('cart.productId');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Calculate totalAmount
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        // Apply coupon if available
        const coupon = req.session.coupon || null;
        if (coupon) {
            const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
            if (appliedCoupon) {
                if (appliedCoupon.discountType === 'flat') {
                    totalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
                } else if (appliedCoupon.discountType === 'percentage') {
                    totalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
                }
            }
        }

        const amountInPaise = Math.round(totalAmount * 100); // Convert amount to paise and ensure it's an integer

        // Create Razorpay order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        if (!order) return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID // Pass Razorpay key to the frontend
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// Backend route for verifying Razorpay payment
const ooverifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Create the expected signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(sign.toString())
            .digest("hex");

        // Check if the signature matches
        if (razorpay_signature === expectedSign) {
            // Payment is verified, update the order status
            const orderId = req.params.id; // Ensure you pass the orderId when calling this route
console.log('orderid',id)
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status: 'Pending', paymentStatus: ' Success' },
                { new: true } // Return the updated document
            );

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            return res.status(200).json({ success: true, message: "Payment verified successfully", order });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Create the expected signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
            .update(sign.toString())
            .digest("hex");

        // Check if the signature matches
        const orderId = req.params.id; // Get order ID from params
        console.log('orderId:', orderId); // Log the orderId for debugging
        
        if (razorpay_signature === expectedSign) {
            // Payment is verified, update the order status
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status: 'Pending', paymentStatus: 'Success' }, // Update accordingly
                { new: true } // Return the updated document
            );

            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            return res.status(200).json({ success: true, message: "Payment verified successfully", order });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
};

// Backend route for retrying payment
const retryPayments = async (req, res) => {
    try {
        const orderId = req.params.id; // Get order ID from params
        const order = await Order.findById(orderId); // Fetch the order by ID
        console.log('orderid',orderId)

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Calculate totalAmount for retrying
        const totalAmount = order.totalAmount; // Use the totalAmount stored in the order
        const amountInPaise = Math.round(totalAmount * 100); // Convert amount to paise

        // Create Razorpay order
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const razorpayOrder = await razorpay.orders.create(options);
        if (!razorpayOrder) {
            return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
        }

        // Update the order status to 'Pending' 
        
        res.status(200).json({
            success: true,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID // Pass Razorpay key to the frontend
        });
        // order.paymentStatus = 'Success';  // Adjust the status as needed
        // await order.save(); // Save changes to the database

    } catch (error) {
        console.error('Error retrying payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Helper function to generate unique order ID
async function generateUniqueOrderId() {
    let orderId;
    let isUnique = false;
    while (!isUnique) {
        orderId = Math.floor(Math.random() * 100000000) + 1;
        const existingOrder = await Order.findOne({ orderId });
        if (!existingOrder) isUnique = true;
    }
    return orderId;
}
 
const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Fetch the order from the database
      const order = await Order.findOne({ orderId: orderId })
      .populate('userId addressId products.productId');
      
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
     
    // Create a new PDF document
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      // Set response headers to serve the file as a PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
  
      // Pipe the PDF directly to the response
      doc.pipe(res);
  
      
      // Add company information
      doc.fontSize(20).text('Shoesea',{align:'center'});
      doc.fontSize(10).text('1234 Street Name, City, State, 12345', 120, 80);
      doc.text('Phone: (123) 456-7890 | Email: shoesea@company.com', 120, 95);
  
      // Add invoice title
      doc.fontSize(18).text('INVOICE', 50, 130);
  
      // Add invoice details
      doc.fontSize(10).text(`Invoice Number: #${order.orderId}`, 50, 160);
      doc.text(`Invoice Date: ${order.orderDate.toISOString().split('T')[0]}`, 50, 175);
      //doc.text(`Due Date: ${new Date(order.orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`, 50, 190);
  
      // Add customer details
      doc.text(`Customer Name: ${order.userId.username}`, 300, 160);
      doc.text(`Billing Address: ${order.addressId.fname}, ${order.addressId.city}, ${order.addressId.state}, ${order.addressId.pincode}`, 300, 175);
      doc.text(`Shipping Address: ${order.shippingAddress.fname}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`, 300, 190);
      doc.text(`Contact: ${order.shippingAddress.phone}`, 300, 205);
  
      // Add table headers
      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Product Name', 50, tableTop);
      //doc.text('SKU', 200, tableTop);
      doc.text('Quantity', 280, tableTop);
      doc.text('Unit Price', 350, tableTop);
      doc.text('Total Price', 450, tableTop);
  
      // Add table content
      doc.font('Helvetica');
      let yPosition = tableTop + 20;
      order.products.forEach((product, index) => {
        doc.text(product.productId.productName, 50, yPosition);
     //   doc.text(product.productId.sku, 200, yPosition);
        doc.text(product.quantity.toString(), 280, yPosition);
        doc.text(`${product.productId.salePrice.toFixed(2)}Rs`, 350, yPosition);
        doc.text(`${(product.productId.salePrice * product.quantity) .toFixed(2)} Rs`, 450, yPosition);
        yPosition += 20;
      });
  
      // Add totals
      yPosition += 20;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal', 350, yPosition);
      doc.text(`${order.totalAmount.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Discount', 350, yPosition);
      doc.text(`-${order.discount.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Delivery Charge', 350, yPosition);
      doc.text(`${order.deliveryCharge.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Total Due', 350, yPosition);
      doc.text(`${(order.totalAmount - order.discount + order.deliveryCharge).toFixed(2)} Rs`, 450, yPosition);
      
      yPosition += 20;

      // Add footer
      doc.fontSize(10).text(`Payment Method: ${order.paymentMethod}`, 50, 700);
      doc.text(`Transaction ID: ${order.orderId}`, 50, 715);
      doc.text('Thank you for your purchase!', 50, 730);
      doc.text('Contact us: shoesea@company.com', 50, 745);
  
      // Finalize the PDF and end the stream
      doc.end();
  
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
    }
  };

module.exports = {
    getOrderSuccess,
    orderList,
    orderCancel,
    returnOrder,
    viewOrderDetails,
    getCoupons,
    checkoutPage,
    orderCashOnDelivery,
    applyCoupon,
    removeCoupon,
    createRazorpayOrder,
    verifyRazorpayPayment,
    processOnlinePaymentCheckout,
    downloadInvoice,
    retryPayments,
    failedOnlinePaymentCheckout,
    getPaymentFailed,
    walletPayment,
 walletDeduction    
}