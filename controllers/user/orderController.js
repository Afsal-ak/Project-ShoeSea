const Order = require('../../models/orderModel');
const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const Product = require('../../models/productModel');

// const getCheckoutPage = async (req, res) => {
//     try {
//       const userId = req.session.userId; // Assuming you have user sessions set up
  
//       // Fetch the user, including the cart
//       const user = await User.findById(userId).populate('cart.productId');
  
//       if (!user) {
//         req.flash('error_msg', 'User not found');
//         return res.redirect('/login');
//       }
  
//       // Fetch all addresses for the user
//       const addresses = await Address.find({ userId });
  
//       // Calculate total amount from the cart
//       let totalAmount = 0;
//       const cartItems = user.cart.map(item => {
//         totalAmount += item.productId.salePrice * item.quantity;
//         return {
//           product: item.productId,
//           quantity: item.quantity
//         };
//       });
  
//       // Render the checkout page with fetched addresses and cart details
//       res.render('checkout', { addresses, cart: cartItems, totalAmount });
//     } catch (error) {
//       console.error('Error rendering checkout page:', error);
//       res.status(500).send('Server Error');
//     }
//   };
const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming you have user sessions set up
        const { productId, quantity } = req.body; // Added to handle direct "Buy Now"

        // Fetch the user, including the cart
        const user = await User.findById(userId).populate('cart.productId');

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/login');
        }

        // Fetch all addresses for the user
        const addresses = await Address.find({ userId });

        let cartItems = [];
        let totalAmount = 0;

        if (productId && quantity) {
            // Handle "Buy Now" scenario
            const product = await Product.findById(productId);
            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/product-details/' + productId);
            }

            cartItems.push({
                product: product,
                quantity: parseInt(quantity, 10)
            });
            totalAmount += product.salePrice * parseInt(quantity, 10);
        } else {
            // Regular checkout from the cart
            cartItems = user.cart.map(item => {
                totalAmount += item.productId.salePrice * item.quantity;
                return {
                    product: item.productId,
                    quantity: item.quantity
                };
            });
        }

        // Render the checkout page with fetched addresses and cart details
        res.render('checkout', { addresses, cart: cartItems, totalAmount });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        res.status(500).send('Server Error');
    }
};

//   const placeOrder = async (req, res) => {
//     try {
//       const userId = req.session.userId;
//       const { addressId } = req.body;
  
//       if (!addressId) {
//         req.flash('error_msg', 'Please select an address');
//         return res.redirect('/checkout');
//       }
  
//       // Verify that the address belongs to the user
//       const address = await Address.findOne({ _id: addressId, userId });
//       if (!address) {
//         req.flash('error_msg', 'Invalid address');
//         return res.redirect('/checkout');
//       }
  
//       // Fetch user to get cart details
//       const user = await User.findById(userId).populate('cart.productId');
  
//       if (!user) {
//         req.flash('error_msg', 'User not found');
//         return res.redirect('/checkout');
//       }
  
//       // Prepare products and calculate total amount
//       let totalAmount = 0;
//       const products = user.cart.map(item => {
//         totalAmount += item.productId.salePrice * item.quantity;
//         return {
//           productId: item.productId._id,
//           quantity: item.quantity,
//           price: item.productId.salePrice
//         };
//       });
  
//       // Create the order
//       const newOrder = new Order({
//         userId,
//         addressId,
//         products,
//         paymentMethod: 'Cash on Delivery',
//         status: 'Pending',
//         totalAmount
//       });
  
//       await newOrder.save();
  
//       // Clear user's cart after placing the order
//       user.cart = [];
//       await user.save();
  
//       req.flash('success_msg', 'Order placed successfully');
//       res.redirect('/order-success');
//     } catch (error) {
//       console.error('Error placing order:', error);
//       req.flash('error_msg', 'Server error');
//       res.redirect('/checkout');
//     }
//   };
  
// const placeOrder = async (req, res) => {
//     try {
//       const userId = req.session.userId;
//       const { addressId } = req.body;
  
//       if (!addressId) {
//         req.flash('error_msg', 'Please select an address');
//         return res.redirect('/checkout');
//       }
  
//       // Verify that the address belongs to the user
//       const address = await Address.findOne({ _id: addressId, userId });
//       if (!address) {
//         req.flash('error_msg', 'Invalid address');
//         return res.redirect('/checkout');
//       }
  
//       // Fetch user to get cart details
//       const user = await User.findById(userId).populate('cart.productId');
  
//       if (!user) {
//         req.flash('error_msg', 'User not found');
//         return res.redirect('/checkout');
//       }
  
//       // Prepare products and calculate total amount
//       let totalAmount = 0;
//       const products = user.cart.map(item => {
//         totalAmount += item.productId.salePrice * item.quantity;
//         return {
//           productId: item.productId._id,
//           quantity: item.quantity,
//           price: item.productId.salePrice
//         };
//       });
  
//       // Create the order
//       const newOrder = new Order({
//         userId,
//         addressId,
//         products,
//         paymentMethod: 'Cash on Delivery',
//         status: 'Pending',
//         totalAmount
//       });
  
//       await newOrder.save();
  
//       // Clear user's cart after placing the order
//       user.cart = [];
//       await user.save();
  
//       req.flash('success_msg', 'Order placed successfully');
//       // Render the order-success page and pass user and order details
//       res.render('order-success', { user, order: newOrder });
//     } catch (error) {
//       console.error('Error placing order:', error);
//       req.flash('error_msg', 'Server error');
//       res.redirect('/checkout');
//     }
//   };
  
const placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId } = req.body;

        if (!addressId) {
            req.flash('error_msg', 'Please select an address');
            return res.redirect('/checkout');
        }

        // Verify that the address belongs to the user
        const address = await Address.findOne({ _id: addressId, userId });
        if (!address) {
            req.flash('error_msg', 'Invalid address');
            return res.redirect('/checkout');
        }

        // Fetch user to get cart details
        const user = await User.findById(userId).populate('cart.productId');

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/checkout');
        }

        // Prepare products and calculate total amount
        let totalAmount = 0;
        const products = user.cart.map(item => {
            totalAmount += item.productId.salePrice * item.quantity;
            return {
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice
            };
        });

        // Create the order
        const newOrder = new Order({
            userId,
            addressId,
            products,
            paymentMethod: 'Cash on Delivery',
            status: 'Pending',
            totalAmount
        });

        await newOrder.save();

        // Clear user's cart after placing the order
        user.cart = [];
        await user.save();

        req.flash('success_msg', 'Order placed successfully');
        res.render('order-success', { user, order: newOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/checkout');
    }
};

module.exports={
    placeOrder,
    getCheckoutPage
}