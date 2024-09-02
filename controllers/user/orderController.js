const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const Product = require('../../models/productModel');


const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod, notes } = req.body;
        const productId = req.query.productId; // Use query parameters for "Buy Now"
        const quantity = req.query.quantity;

        if (!userId || !paymentMethod) {
            req.flash('error_msg', 'User not found or payment method missing');
            return res.redirect('/checkout');
        }

        // Map payment method to full value
        const paymentMethodMap = {
            'cod': 'Cash on Delivery',
            'cc': 'Credit Card',
            'paypal': 'PayPal'
        };
        const mappedPaymentMethod = paymentMethodMap[paymentMethod] || 'Cash on Delivery';

        // Fetch the user, including the cart
        const user = await User.findById(userId).populate('cart.productId');

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/login');
        }

        let totalAmount = 0;
        let totalQuantity = 0;
        const products = [];

        if (productId && quantity) {
            // Handle "Buy Now" scenario
            const product = await Product.findById(productId);
            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect(`/product-details/${productId}`);
            }
            console.log('suces',totalAmount)

            const purchaseQuantity = parseInt(quantity, 10);
            if (isNaN(purchaseQuantity) || purchaseQuantity <= 0 || product.quantity < purchaseQuantity) {
                req.flash('error_msg', 'Invalid or insufficient stock');
                return res.redirect(`/product-details/${productId}`);
            }
            console.log('suces',totalAmount)

            product.quantity -= purchaseQuantity;
            await product.save();

            products.push({
                productId: product._id,
                quantity: purchaseQuantity,
                price: product.salePrice
            });

            totalAmount = product.salePrice * purchaseQuantity;
            totalQuantity = purchaseQuantity;
            console.log('suces',totalAmount)

        } else {
            // Regular checkout from the cart
            user.cart = user.cart.filter(item => {
                if (!item.productId || item.productId.status !== 'Available' || item.productId.quantity <= 0) {
                    return false;
                }

                if (item.productId.quantity < item.quantity) {
                    req.flash('error_msg', `Insufficient stock for ${item.productId.productName}`);
                    return false;
                }
console.log('cart',user.cart)
                totalAmount += item.productId.salePrice * item.quantity;
                totalQuantity += item.quantity;

                item.productId.quantity -= item.quantity;
                item.productId.save();

                products.push({
                    productId: item.productId._id,
                    quantity: item.quantity,
                    price: item.productId.salePrice
                });

                return true;
            });

            if (!products.length) {
                req.flash('error_msg', 'No valid products to place order');
                return res.redirect('/checkout');
            }
        }

        if (!addressId) {
            req.flash('error_msg', 'Please select an address');
            return res.redirect('/checkout');
        }

        const address = await Address.findById(addressId);
        if (!address) {
            req.flash('error_msg', 'Invalid address');
            return res.redirect('/checkout');
        }

        const newOrder = new Order({
            userId,
            addressId,
            products,
            paymentMethod: mappedPaymentMethod,
            status: 'Pending',
            totalAmount,
            totalQuantity,
            notes
        });

        await newOrder.save();

        if (!productId) {
            user.cart = [];
            await user.save();
        }

        req.flash('success_msg', 'Order placed successfully');
        res.redirect(`/order-success?orderId=${newOrder._id}`);  // Redirect to order success page using GET
    } catch (error) {
        console.error('Error placing order:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/checkout');
    }
};

const getOrderSuccess=async (req,res)=>{
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
            req.flash('error_msg', 'User not found');
            return res.redirect('/login');
        }

        const user = await User.findById(userId).populate('cart.productId');
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/login');
        }

        const addresses = await Address.find({ userId });
        let cartItems = [];
        let totalAmount = 0;

        if (productId && quantity) {
            // "Buy Now" scenario
            const product = await Product.findById(productId);
            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect(`/product-details/${productId}`);
            }

            const qty = parseInt(quantity, 10);
            if (isNaN(qty) || qty <= 0 || product.quantity < qty) {
                req.flash('error_msg', 'Invalid or insufficient quantity');
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

        res.render('checkout', { addresses, cart: cartItems, totalAmount });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        req.flash('error_msg', 'Server Error');
        res.redirect('/error');
    }
};


// const orderList=async(req,res)=>{
//     try {

//         const userId=req.session.userId

//         if (!userId) {
//             req.flash('error_msg', 'Please log in to view your order history.');
//             return res.redirect('/login');
//           }

//         const orders=await Order.find({userId})
//         .populate({ path: 'products', populate: { path: 'productId' } })
//         .sort({orderDate:-1})
//                 console.log(orders,{orders})

//         orders.forEach(order => {
//             order.products.forEach(product => {
//                 if (product.productId) { // Ensure productId is populated
//                     console.log(product.productId.productName); // Log product name
//                 }
//             });
//         });

//         res.render('order-list')

//     } catch (error) {
//         console.error(error.message)
//         console.error('Error fetching order history:', error);
//         req.flash('error_msg', 'Unable to fetch order history.');
//         res.redirect('/');
//     }
// }
const orderList = async (req, res) => {
    try {
      const userId = req.session.userId;
  
      if (!userId) {
        req.flash('error_msg', 'Please log in to view your order history.');
        return res.redirect('/login');
      }
  
      // Fetch orders for the logged-in user, populate products and their details
      const orders = await Order.find({ userId })
        .populate({ path: 'products.productId', select: 'productName salePrice' })
        .sort({ orderDate: -1 });
  
      // Log the orders for debugging purposes
      console.log('Orders:', orders);
  
      // Ensure products are properly populated and log product names for debugging
      orders.forEach(order => {
        order.products.forEach(product => {
          if (product.productId) { // Check if productId is populated
            console.log('Product Name:', product.productId.productName); // Log product name
          }
        });
      });
  
      // Render the order list page with the orders data
      res.render('order-list', { orders });
  
    } catch (error) {
      console.error('Error fetching order history:', error.message);
      req.flash('error_msg', 'Unable to fetch order history.');
      res.redirect('/');
    }
  };

  

// const orderCancel=async(req,res)=>{
//     try {
//         const userId=req.session.userId
//         const orderId=req.params
        
//         if (!userId) {
//             req.flash('error_msg', 'User not authenticated.');
//             return res.redirect('/login');
//           }
      
//           const order = await Order.findOne({ _id: orderId, userId });

//           if (!order) {
//             req.flash('error_msg', 'Order not found.');
//             return res.redirect('/order');
//           }
      
//           if (order.status === 'Cancelled' || order.status === 'Delivered') {
//             req.flash('error_msg', 'Order cannot be cancelled.');
//             return res.redirect('/order');
//           }

//           order.status=='cancelled'
//           await order.save

//           req.flash('success_msg', 'Order cancelled successfully.');
//           res.redirect('/order');
      

//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         req.flash('error_msg', 'Failed to cancel the order.');
//         res.redirect('/order');
//     }
// }
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

        await order.save();  // Call save method properly

        req.flash('success_msg', 'Order cancelled successfully.');
        res.redirect('/order');
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

        res.redirect(`/order-details/${orderId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
module.exports={
    placeOrder,
    getCheckoutPage,
    getOrderSuccess,
    orderList,
    orderCancel,
    returnOrder,
    viewOrderDetails
}