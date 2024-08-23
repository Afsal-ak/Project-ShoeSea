
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

         
          const message = req.query.message || '';

          res.render('cart', { user: userData, userCart: userData, message });
      } catch (error) {
          console.error('Error showing cart:', error.message);
          res.redirect('/500');
      }
  },

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
        const email = req.session.email;

        if (!email) {
            return res.status(401).redirect('/login');
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid product ID');
        }

        const userData = await User.findOne({ email }).populate('cart.productId');
        if (!userData) {
            return res.status(404).send('User not found');
        }

        // Ensure newQuantity is a valid number
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).send('Invalid quantity');
        }

        // Find the cart item and update its quantity
        const cartItem = userData.cart.find(item => item.productId && item.productId._id.toString() === productId);
        if (!cartItem) {
            console.log('Cart Item Not Found:', { productId, cart: userData.cart });
            return res.status(404).send('Cart item not found');
        }

        // Check if the new quantity exceeds the available stock
        if (quantity > cartItem.productId.quantity) {
            return res.redirect('/cart?message=Insufficient stock available');
        }

        cartItem.quantity = quantity;
        await userData.save();

        res.redirect('/cart');
    } catch (error) {
        console.error('Error updating cart quantity:', error.message);
        res.redirect('/500');
    }
}

}