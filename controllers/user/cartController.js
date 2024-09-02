
const User=require('../../models/userModel')
const Product=require('../../models/productModel')
const mongoose=require('mongoose')

// Controller for Cart Operations
module.exports = {
    // addToCart: async (req, res) => {
    //     try {
    //         const productId = req.body.productId; // Retrieve from request body
    //         const email = req.session.email;
    //         const quantity = parseInt(req.body.quantity, 10) || 1;
    
    //         if (!email) {
    //             return res.status(401).json({ message: 'User not authenticated' });
    //         }
    
    //         const userData = await User.findOne({ email });
    //         if (!userData) {
    //             return res.status(404).json({ message: 'User not found' });
    //         }
    
    //         // Check if productId is defined
    //         if (!productId) {
    //             throw new Error('Product ID is undefined');
    //         }
    
    //         const productData = await Product.findById(productId);
    //         if (!productData) {
    //             return res.redirect('/cart?message=Product not found');
    //         }
    
    //         let cartItem = userData.cart.find(item => item.productId && item.productId.toString() === productId);
    
    //         if (cartItem) {
    //             if (cartItem.quantity + quantity > productData.quantity) {
    //                 return res.redirect('/cart?message=Insufficient stock to add');
    //             }
    //             cartItem.quantity += quantity;
    //         } else {
    //             if (quantity > productData.quantity) {
    //                 return res.redirect('/cart?message=Insufficient stock available');
    //             }
    //             userData.cart.push({ productId, quantity });
    //         }
    
    //         await userData.save();
    //         res.redirect('/cart');
    //     } catch (error) {
    //         console.error('Error adding to cart:', error.message);
    //         res.redirect('/500');
    //     }
    // },
    addToCart: async (req, res) => {
        try {
            const productId = req.body.productId;
            const email = req.session.email;
            const quantity = parseInt(req.body.quantity, 10) || 1;
    
            if (!email) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
    
            const userData = await User.findOne({ email });
            if (!userData) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            if (!productId) {
                throw new Error('Product ID is undefined');
            }
    
            const productData = await Product.findById(productId);
            if (!productData) {
                return res.redirect('/cart?message=Product not found');
            }
    
            // Check if quantity exceeds stock
            if (quantity > productData.quantity) {
                return res.redirect('/cart?message=Insufficient stock available');
            }

            // Check if total quantity in cart exceeds the limit
            let cartItem = userData.cart.find(item => item.productId && item.productId.toString() === productId);
            const maxLimit = 5; // Maximum quantity limit per product

            if (cartItem) {
                if (cartItem.quantity + quantity > maxLimit) {
                    return res.redirect('/cart?message=Cannot add more than 5 items of this product');
                }
                if (cartItem.quantity + quantity > productData.quantity) {
                    return res.redirect('/cart?message=Insufficient stock to add');
                }
                cartItem.quantity += quantity;
            } else {
                if (quantity > maxLimit) {
                    return res.redirect('/cart?message=Cannot add more than 5 items of this product');
                }
                if (quantity > productData.quantity) {
                    return res.redirect('/cart?message=Insufficient stock available');
                }
                userData.cart.push({ productId, quantity });
            }
    
            await userData.save();
            res.redirect('/cart');
        } catch (error) {
            console.error('Error adding to cart:', error.message);
            res.redirect('/500');
        }
    },
    
   

    
//   // Show the user's cart
//   showCart: async (req, res) => {
//       try {
//           const email = req.session.email;
//           if (!email) {
//               return res.status(401).redirect('/login');
//           }

//           const userData = await User.findOne({ email }).populate('cart.productId');
//           if (!userData) {
//               return res.status(404).json({ message: 'User not found' });
//           }

         
//           const message = req.query.message || '';

//           res.render('cart', { user: userData, userCart: userData, message });
//       } catch (error) {
//           console.error('Error showing cart:', error.message);
//           res.redirect('/500');
//       }
//   },
// Show the user's cart
showCart: async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(401).redirect('/login');
        }

        const userData = await User.findOne({ email }).populate('cart.productId');
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out out-of-stock products and those that are not available
        userData.cart = userData.cart.filter(item => {
            return item.productId && item.productId.status === 'Available' && item.productId.quantity > 0;
        });

        const message = req.query.message || '';

        res.render('cart', { user: userData, userCart: userData, message });
    } catch (error) {
        console.error('Error showing cart:', error.message);
        res.redirect('/500');
    }
},

// Show the user's cart
// Show the user's cart
// Show the user's cart
// Show the user's cart
// showCart: async (req, res) => {
//     try {
//         const email = req.session.email;
//         if (!email) {
//             return res.status(401).redirect('/login');
//         }

//         // Fetch the user data along with their cart
//         const userData = await User.findOne({ email }).populate('cart.productId');
//         if (!userData) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Filter out out-of-stock products and remove them from cart
//         const filteredCart = [];
//         for (const item of userData.cart) {
//             const product = item.productId;
//             if (product && product.status === 'Available' && product.quantity > 0) {
//                 filteredCart.push({
//                     productId: product._id,
//                     productName: product.productName,
//                     salePrice: product.salePrice,
//                     quantity: item.quantity,
//                     subtotal: product.salePrice * item.quantity
//                 });
//             } else {
//                 // Optionally remove out-of-stock items from the user's cart
//                 await User.updateOne(
//                     { email },
//                     { $pull: { cart: { productId: item.productId._id } } }
//                 );
//             }
//         }

//         // Add a message to be displayed on the cart page
//         const message = req.query.message || '';

//         // Render the cart page with the filtered cart items
//         res.render('cart', { user: userData, userCart: { cart: filteredCart }, message });
//     } catch (error) {
//         console.error('Error showing cart:', error.message);
//         res.redirect('/500'); // Redirect to a generic error page
//     }
// },


// showCart: async (req, res) => {
//     try {
//         const email = req.session.email;
//         if (!email) {
//             return res.status(401).redirect('/login');
//         }

//         // Fetch the user data along with their cart, populating the product details
//         const userData = await User.findOne({ email }).populate('cart.productId');
//         if (!userData) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Initialize a filtered cart array to hold valid products
//         const filteredCart = [];
//         for (const item of userData.cart) {
//             const product = item.productId;
//             if (product && product.status === 'Available' && product.quantity > 0) {
//                 // If the product is available and in stock, add it to the filtered cart
//                 filteredCart.push({
//                     productId: product._id,
//                     productName: product.productName,
//                     salePrice: product.salePrice,
//                     quantity: item.quantity,
//                     productImages: product.productImages, // Ensure product images are available
//                     subtotal: product.salePrice * item.quantity
//                 });
//             } else {
//                 // If the product is out of stock or unavailable, remove it from the user's cart
//                 await User.updateOne(
//                     { email },
//                     { $pull: { cart: { productId: product._id } } }
//                 );
//             }
//         }

//         // Add a message to be displayed on the cart page if provided
//         const message = req.query.message || '';

//         // Render the cart page with the filtered cart items and user information
//         res.render('cart', { user: userData, userCart: { cart: filteredCart }, message });
//     } catch (error) {
//         console.error('Error showing cart:', error.message);
//         res.redirect('/500'); // Redirect to a generic error page
//     }
// },






  // Delete an item from the cart
 // In your cart controller
// deleteFromCart: async (req, res) => {
//     try {
//         const email = req.session.email;
//         const productId = req.query.id;

//         if (!email) {
//             return res.status(401).redirect('/login');
//         }

//         const userData = await User.findOne({ email });
//         if (!userData) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         userData.cart = userData.cart.filter(item => item.productId.toString() !== productId);
//         await userData.save();

//         res.redirect('/cart');
//     } catch (error) {
//         console.error('Error deleting from cart:', error.message);
//         res.redirect('/500');
//     }
// },

deleteFromCart: async (req, res) => {
    try {
        const email = req.session.email;
        const productId = req.query.id;

        if (!email) {
            return res.status(401).redirect('/login');
        }

        if (!productId) {
            return res.status(400).send('Product ID is required');
        }

        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure productId is properly referenced
        userData.cart = userData.cart.filter(item => item.productId && item.productId.toString() !== productId);
        await userData.save();

        res.redirect('/cart');
    } catch (error) {
        console.error('Error deleting from cart:', error.message);
        res.redirect('/500');
    }
}
,
updateQuantity: async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;

        // Validate the productId format
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        // Validate the newQuantity
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        // Find the user cart from session data or by querying the database
        const email = req.session.email;
        if (!email) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userData = await User.findOne({ email }).populate('cart.productId');
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the cart item
        const cartItem = userData.cart.find(item => item.productId && item.productId._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Check if the requested quantity is available in stock
        if (quantity > cartItem.productId.quantity) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        // Check if the quantity exceeds the maximum limit per product
        const maxLimit = 5; // Maximum quantity limit per product
        if (quantity > maxLimit) {
            return res.status(400).json({ message: `Cannot add more than ${maxLimit} items of this product` });
        }

        // Update the quantity
        cartItem.quantity = quantity;
        await userData.save();

        // Calculate the new subtotal for this item
        const newSubtotal = cartItem.productId.salePrice * quantity;

        // Calculate the new total and total items
        const newTotal = userData.cart.reduce((total, item) => {
            return item.productId ? total + (item.productId.salePrice * item.quantity) : total;
        }, 0);

        const totalItems = userData.cart.reduce((total, item) => total + (item.productId ? item.quantity : 0), 0);

        res.json({ newSubtotal, newTotal, totalItems });
    } catch (error) {
        console.error('Error updating cart quantity:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



}