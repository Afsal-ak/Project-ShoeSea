const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Coupon = require('../../models/couponModel')

const Razorpay=require('razorpay');
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


const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId, quantity } = req.query; // Use query parameters for "Buy Now"

        if (!userId) {
            req.flash('error_msg', 'Please log in to proceed.');
            return res.redirect('/login');
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/login');
        }

        const addresses = await Address.find({ userId });
        let cartItems = [];
        let totalAmount = 0;

        if (productId && quantity) {
            // "Buy Now" scenario
            const product = await Product.findById(productId);
            if (!product) {
                req.flash('error_msg', 'Product not found.');
                return res.redirect(`/product-details/${productId}`);
            }

            const qty = parseInt(quantity, 10);
            if (isNaN(qty) || qty <= 0 || product.quantity < qty) {
                req.flash('error_msg', 'Invalid or insufficient quantity.');
                return res.redirect(`/product-details/${productId}`);
            }

            cartItems.push({
                product: product,
                quantity: qty
            });
            totalAmount = product.salePrice * qty;

        } else {
            // Regular checkout from cart
            cartItems = user.cart.filter(item => {
                if (item.productId && item.productId.status === 'Available' && item.productId.quantity > 0) {
                    totalAmount += item.productId.salePrice * item.quantity;
                    return true;
                }
                return false;
            }).map(item => ({
                product: item.productId,
                quantity: item.quantity
            }));
        }

        // Apply coupon if already applied
        const appliedCoupon = req.session.appliedCoupon || null;
        const discountedAmount = req.session.discountedAmount || totalAmount;

        res.render('checkout', {
            addresses,
            cart: cartItems,
            totalAmount: discountedAmount,
            appliedCoupon // Pass the applied coupon to the view
        });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        req.flash('error_msg', 'Server Error.');
        res.redirect('/error');
    }
};
const buyNow = async (req, res) => {
    try {
        const { productId } = req.query;

        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/home');
        }

        const quantity = 1; // Default quantity to 1
        const totalAmount = product.salePrice || product.regularPrice;

        // Redirect to the checkout page with product details
        return res.redirect(`/checkout?productId=${productId}&quantity=${quantity}`);
    } catch (error) {
        console.error('Error in buyNow:', error.message);
        req.flash('error_msg', 'Server error');
        res.redirect('/500');
    }
};

// const orderList = async (req, res) => {
//     try {
//         const userId = req.session.userId;

//         if (!userId) {
//             req.flash('error_msg', 'Please log in to view your order history.');
//             return res.redirect('/login');
//         }

//         // Fetch orders for the logged-in user, populate products and their details
//         const orders = await Order.find({ userId })
//             .populate({ path: 'products.productId', select: 'productName salePrice' })
//             .sort({ orderDate: -1 });

//         // Log the orders for debugging purposes
//         console.log('Orders:', orders);

//         // Ensure products are properly populated and log product names for debugging
//         orders.forEach(order => {
//             order.products.forEach(product => {
//                 if (product.productId) { // Check if productId is populated
//                     console.log('Product Name:', product.productId.productName); // Log product name
//                 }
//             });
//         });

//         // Render the order list page with the orders data
//         res.render('order-list', { orders });

//     } catch (error) {
//         console.error('Error fetching order history:', error.message);
//         req.flash('error_msg', 'Unable to fetch order history.');
//         res.redirect('/');
//     }
// };

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

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status !== 'Delivered') {
            return res.status(400).send('Order cannot be returned');
        }
            order.status = 'Returned';
           await order.save();

        for(const productItems of order.products){
           const product=await Product.findById(productItems.productId)

           if(product){
            product.quantity+=productItems.quantity
            await product.save()
           }
        }

        
        req.flash('success_msg', 'Order cancelled successfully.');

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
            coupon,
            userAddress: address,
            
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

        const coupon = await Coupon.findOne({ name: couponCode,
             isActive: 'true',
             expirationDate: { $gte: new Date() }
            });

         if (!coupon) {
            req.flash('error_msg', 'Invalid or expired coupon');
            return res.redirect('/checkout');
        }

        req.session.coupon = {
            code: coupon.name,
            discountAmount: coupon.offerPrice
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



// const applyCoupon = async (req, res) => {
//     try {
//         const { couponCode } = req.body;
//         const userId = req.session.userId;
//         if (!userId) {
//             return res.status(401).json({ success: false, message: 'User not logged in' });
//         }

//         const coupon = await Coupon.findOne({
//             name: couponCode,
//             isActive: 'true',
//             expirationDate: { $gte: new Date() }
//         });

//         if (!coupon) {
//             return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
//         }

//         req.session.coupon = {
//             code: coupon.name,
//             discountAmount: coupon.offerPrice
//         };

//         res.json({ success: true, message: 'Coupon applied successfully', coupon });
//     } catch (error) {
//         console.error('Error applying coupon:', error.message);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// const removeCoupon = async (req, res) => {
//     try {
//         const userId = req.session.userId;

//         if (!userId) {
//             return res.status(401).json({ success: false, message: 'User not logged in' });
//         }

//         if (req.session.coupon) {
//             req.session.coupon = null;
//             res.json({ success: true, message: 'Coupon removed successfully' });
//         } else {
//             res.json({ success: false, message: 'No coupon was applied' });
//         }
//     } catch (error) {
//         console.error('Error removing coupon:', error.message);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

const processCheckout = async (req, res) => {
    try {
        const { paymentMethod, addressId } = req.body;
        const userId = req.session.userId;
        const coupon = req.session.coupon || null;
        const address=await Address.findById(addressId)

        if (!userId) {
            return res.redirect('/login');
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!addressId) {
            return res.status(400).json({ message: 'Address is required' });
        }

        // Calculate total quantity and total amount
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
                req.flash('error_msg', `Minimum order amount for this coupon is ${appliedCoupon.minimumPrice}`);
                return res.redirect('/checkout');
            }

            if (appliedCoupon.discountType === 'flat') {
                finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
            } else if (appliedCoupon.discountType === 'percentage') {
                finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
            }
            discount = appliedCoupon.offerPrice;
        }

        // Check product stock and update quantities
        for (const item of user.cart) {
            const product = await Product.findById(item.productId._id);

            if (product.quantity < item.quantity) {
                req.flash('error_msg', `Insufficient stock for product: ${product.name}`);
                return res.redirect('/checkout');
            }

            // Decrease the product quantity
            product.quantity -= item.quantity;
            await product.save();
        }

        // Generate a random order ID
        let orderId;
        let isUnique = false;

        while (!isUnique) {
            // Generate random number as orderId
            orderId = Math.floor(Math.random() * 100000000) + 1; // Random number between 1 and 100,000,000

            // Check if the generated orderId is unique
            const existingOrder = await Order.findOne({ orderId });
            if (!existingOrder) {
                isUnique = true;
            }
        }

        // Create the new order
        const newOrder = new Order({
            orderId,  // use the randomly generated orderId
            userId: user._id,
            addressId,
            products: user.cart.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            })),
            totalQuantity,
            totalAmount: finalAmount,
            paymentMethod,
            status: 'Pending',
            discount: discount,
            shippingAddress: {
                fname:address.fname,
                lname:address.lname,
                housename:address.housename,
                city:address.city,
                state:address.state,
                country:address.country,
                pincode:address.pincode,
                phone:address.phone
            },
            orderDate: new Date(),
        });
        await newOrder.save();
        console.log('Shipping Address:', newOrder.shippingAddress);

        // Clear the user's cart after placing the order
        user.cart = [];
        await user.save();

        // Clear the coupon from the session
        req.session.coupon = null;

        // Redirect to the success page
        req.flash('success_msg', 'Order placed successfully');
        res.redirect(`/order-success?orderId=${newOrder._id}`);
    } catch (error) {
        console.error('Error processing checkout:', error.message);
        res.redirect('/500');
    }
};

const crypto = require('crypto');



// const createRazorpayOrder = async (req, res) => {
//     try {
//         const { totalAmount } = req.body;

//         // Create a Razorpay order
//         const options = {
//             amount: totalAmount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
//             currency: 'INR',
//             receipt: `receipt_${Date.now()}`
//         };

//         const order = await razorpay.orders.create(options);

//         if (!order) return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });

//         res.status(200).json({
//             success: true,
//             order_id: order.id,
//             amount: order.amount,
//             currency: order.currency
//         });
//     } catch (error) {
//         console.error('Error creating Razorpay order:', error.message);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };
const createRazorpayOrder = async (req, res) => {
    try {
        const { totalAmount } = req.body;
        console.log('Total Amount from request body:', totalAmount);

        if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid total amount for Razorpay order' });
        }

        // Create Razorpay order
        const options = {
            amount: totalAmount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        if (!order) return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });

        res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Function to process payment and verify Razorpay signature
const verifyRazorpayPayment = (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // Create a hash using the order_id and payment_id concatenated with a "|" symbol
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        // Validate the Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(body.toString())
            .digest('hex');

        // If signature is valid, proceed to order completion
        if (expectedSignature === razorpay_signature) {
            // Payment verification successful
            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            // Payment verification failed
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Function to finalize order after payment is verified
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

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Calculate total quantity and total amount
        const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
        let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

        // let finalAmount = totalAmount;
        // let discount = 0;

        // // Apply coupon if available
        // if (coupon) {
        //     const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
        //     if (!appliedCoupon || totalAmount < appliedCoupon.minimumPrice) {
        //         return res.status(400).json({ success: false, message: 'Invalid coupon or minimum order amount not met' });
        //     }

        //     if (appliedCoupon.discountType === 'flat') {
        //         finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
        //     } else if (appliedCoupon.discountType === 'percentage') {
        //         finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
        //     }
        //     discount = appliedCoupon.offerPrice;
        // }
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
        
        console.log('Final Amount after coupon:', finalAmount);
        
        // Check product stock and update quantities
        for (const item of user.cart) {
            const product = await Product.findById(item.productId._id);

            if (product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for product: ${product.name}` });
            }

            // Decrease the product quantity
            product.quantity -= item.quantity;
            await product.save();
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

        // Create the new order
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
          //  paymentStatus: 'Success', // Set payment status to success

            status: 'Pending',
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

        // Send success response
        res.status(200).json({ 
            success: true, 
            message: 'Order placed successfully', 
            orderId: newOrder._id 
        });
    } catch (error) {
        console.error('Error processing online payment checkout:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while processing your order', 
            error: error.message 
        });
    }
};

//clau
// const createRazorpayOrder = async (req, res) => {
//     try {
//         const { totalAmount } = req.body;

//         // Create a Razorpay order
//         const options = {
//             amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
//             currency: 'INR',
//             receipt: `receipt_${Date.now()}`,
//             payment_capture: 1 // Auto-capture the payment
//         };

//         const order = await razorpay.orders.create(options);

//         if (!order) return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });

//         res.status(200).json({
//             success: true,
//             order_id: order.id,
//             amount: order.amount,
//             currency: order.currency,
//             key: process.env.RAZORPAY_KEY_ID // Send the key ID to the client
//         });
//     } catch (error) {
//         console.error('Error creating Razorpay order:', error);
//         res.status(500).json({ success: false, message: 'Server error', error: error.message });
//     }
// };
// const verifyRazorpayPayment = (req, res) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//         const body = razorpay_order_id + "|" + razorpay_payment_id;

//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(body.toString())
//             .digest('hex');

//         const isAuthentic = expectedSignature === razorpay_signature;

//         if (isAuthentic) {
//             res.status(200).json({ success: true, message: 'Payment verified successfully' });
//         } else {
//             res.status(400).json({ success: false, message: 'Invalid payment signature' });
//         }
//     } catch (error) {
//         console.error('Error verifying Razorpay payment:', error);
//         res.status(500).json({ success: false, message: 'Server error', error: error.message });
//     }
// };
// const processOnlinePaymentCheckout = async (req, res) => {
//     try {
//         const { razorpay_payment_id, razorpay_order_id, razorpay_signature, addressId } = req.body;
//         const userId = req.session.userId;
//         const coupon = req.session.coupon || null;

//         if (!userId) {
//             return res.status(401).json({ success: false, message: 'User not authenticated' });
//         }

//         const user = await User.findById(userId).populate('cart.productId');
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         // Verify Razorpay payment
//         const body = razorpay_order_id + "|" + razorpay_payment_id;
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(body.toString())
//             .digest('hex');

//         if (expectedSignature !== razorpay_signature) {
//             return res.status(400).json({ success: false, message: 'Invalid payment signature' });
//         }

//         // Calculate total amount and apply coupon if available
//         let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);
//         if (coupon) {
//             // Apply coupon logic here
//         }

//         // Create and save the order
//         const newOrder = new Order({
//             userId: user._id,
//             addressId,
//             products: user.cart.map(item => ({
//                 productId: item.productId._id,
//                 quantity: item.quantity,
//                 price: item.productId.salePrice
//             })),
//             totalAmount,
//             paymentMethod: 'Razorpay',
//             paymentStatus: 'Paid',
//             status: 'Processing',
//             razorpay: {
//                 orderId: razorpay_order_id,
//                 paymentId: razorpay_payment_id,
//                 signature: razorpay_signature
//             }
//         });

//         await newOrder.save();

//         // Clear user's cart
//         user.cart = [];
//         await user.save();

//         // Clear coupon from session
//         req.session.coupon = null;

//         res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
//     } catch (error) {
//         console.error('Error processing online payment checkout:', error);
//         res.status(500).json({ success: false, message: 'Server error', error: error.message });
//     }
// };

//ooo
// const prepareCheckout = async (req, res) => {
//     try {
//         const { paymentMethod, addressId } = req.body;
//         const userId = req.session.userId;
//         const coupon = req.session.coupon || null;

//         if (!userId) {
//             return res.redirect('/login');
//         }

//         const user = await User.findById(userId).populate('cart.productId');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (!addressId) {
//             return res.status(400).json({ message: 'Address is required' });
//         }

//         // Calculate total quantity and total amount
//         const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
//         let totalAmount = user.cart.reduce((total, item) => total + (item.productId.salePrice * item.quantity), 0);

//         let finalAmount = totalAmount;
//         let discount = 0;

//         // Apply coupon if available
//         if (coupon) {
//             const appliedCoupon = await Coupon.findOne({ name: coupon.code, isActive: true });
//             if (appliedCoupon) {
//                 if (totalAmount >= appliedCoupon.minimumPrice) {
//                     if (appliedCoupon.discountType === 'flat') {
//                         finalAmount = Math.max(totalAmount - appliedCoupon.offerPrice, 0);
//                     } else if (appliedCoupon.discountType === 'percentage') {
//                         finalAmount = Math.max(totalAmount - (totalAmount * appliedCoupon.offerPrice / 100), 0);
//                     }
//                     discount = totalAmount - finalAmount;
//                 } else {
//                     req.flash('error_msg', `Minimum order amount for this coupon is ${appliedCoupon.minimumPrice}`);
//                     return res.redirect('/checkout');
//                 }
//             } else {
//                 req.session.coupon = null;
//                 req.flash('error_msg', 'Invalid or expired coupon');
//                 return res.redirect('/checkout');
//             }
//         }

//         // Check product stock
//         for (const item of user.cart) {
//             const product = await Product.findById(item.productId._id);
//             if (product.quantity < item.quantity) {
//                 req.flash('error_msg', `Insufficient stock for product: ${product.name}`);
//                 return res.redirect('/checkout');
//             }
//         }

//         // Store checkout data in session for later use
//         req.session.checkoutData = {
//             userId,
//             addressId,
//             cart: user.cart,
//             totalQuantity,
//             totalAmount: finalAmount,
//             discount,
//             coupon: coupon ? coupon.code : null
//         };

//            if (paymentMethod === 'Razorpay') {
//             console.log('Creating Razorpay order for amount:', finalAmount);
//             const razorpayOrder = await razorpay.orders.create({
//                 amount: Math.round(finalAmount * 100), // Amount in paise, rounded to avoid floating point issues
//                 currency: 'INR',
//                 receipt: `receipt_${Date.now()}`,
//                 payment_capture: 1
//             });
//             console.log('Razorpay order created:', razorpayOrder);

//             res.json({
//                 orderId: razorpayOrder.id,
//                 amount: razorpayOrder.amount,
//                 currency: razorpayOrder.currency,
//                 keyId: process.env.RAZORPAY_KEY_ID
//             });
//         } else {
//             req.flash('error_msg', 'Invalid payment method');
//             res.redirect('/checkout');
//         }
//     } catch (error) {
//         console.error('Error preparing checkout:', error.message);
//         res.status(500).json({ error: 'An error occurred while preparing the checkout' });
//     }
// };

module.exports = {
    //placeOrder,
    buyNow,
    getCheckoutPage,
    getOrderSuccess,
    orderList,
    orderCancel,
    returnOrder,
    viewOrderDetails,
    getCoupons,
    checkoutPage,
    processCheckout,
    applyCoupon,
    removeCoupon,
    createRazorpayOrder,
    verifyRazorpayPayment,
    processOnlinePaymentCheckout
    //  prepareCheckout,
    // createOrder,
    // verifyRazorpayPayment
}