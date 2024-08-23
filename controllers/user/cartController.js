// // const User=require('../../models/userModel')
// // const Product=require('../../models/productModel')



// // // const getCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // // //const product=await Product.find(productId)
// // //         if (!userId) {
// // //             return res.redirect('/login'); // Redirect to login if the user is not logged in
// // //         }

// // //         const user = await User.findById(userId).populate('cart.productId'); // Populate the product details

// // //         if (!user) {
// // //             return res.status(400).json({ success: false, message: 'User not found' });
// // //         }

// // //         res.render('cart', { cartItems: user.cart,user }); // Pass the user object to the cart.ejs template
// // //     } catch (error) {
// // //         console.error('Error fetching cart:', error);
// // //         return res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };


// // // const addToCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;

// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to add items to the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             return res.status(400).json({ success: false, message: 'User not found' });
// // //         }

// // //         const productId = req.body.productId;
// // //         let quantity = parseInt(req.body.quantity, 10);
// // //         if (isNaN(quantity) || quantity <= 0) {
// // //             quantity = 1;
// // //         }

// // //         const product = await Product.findById(productId);
// // //         if (!product) {
// // //             return res.status(400).json({ success: false, message: 'Product not found' });
// // //         }

// // //         // Check if the product is out of stock
// // //         if (product.stock <= 0) {
// // //             return res.status(400).json({ success: false, message: 'This product is out of stock and cannot be added to the cart' });
// // //         }

// // //         // Limit the quantity to the available stock
// // //         const maxQuantity = product.stock;
// // //         if (quantity > maxQuantity) {
// // //             return res.status(400).json({ success: false, message: `Only ${maxQuantity} items available in stock` });
// // //         }

// // //         // Check if the product is already in the cart
// // //         const cartItem = user.cart.find(item => item.productId.equals(productId));

// // //         if (cartItem) {
// // //             // If the new quantity exceeds the stock, limit it
// // //             if (cartItem.quantity + quantity > maxQuantity) {
// // //                 return res.status(400).json({ success: false, message: `You can only add ${maxQuantity - cartItem.quantity} more of this item` });
// // //             }
// // //             cartItem.quantity += quantity; // Update quantity if product exists in cart
// // //         } else {
// // //             // Ensure the added quantity does not exceed stock
// // //             user.cart.push({ productId, quantity });
// // //         }

// // //         await user.save(); // Save the updated user document
// // //         return res.json({ success: true, message: 'Cart updated' });
// // //     } catch (error) {
// // //         console.error('Error adding to cart:', error);
// // //         return res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };

// // // const updateCartQuantity = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         const { productId, quantity } = req.body;

// // //         const user = await User.findById(userId);
// // //         const cartItem = user.cart.find(item => item.productId.toString() === productId);

// // //         if (cartItem) {
// // //             // Validate quantity against stock
// // //             const product = await Product.findById(productId);
// // //             if (quantity > product.stock) {
// // //                 return res.status(400).json({ success: false, message: 'Not enough stock available' });
// // //             }

// // //             cartItem.quantity = quantity;
// // //             await user.save();
// // //             res.json({ success: true, message: 'Cart updated', cart: user.cart });
// // //         } else {
// // //             res.status(404).json({ success: false, message: 'Product not found in cart' });
// // //         }
// // //     } catch (error) {
// // //         console.error('Error updating cart:', error);
// // //         res.status(500).json({ success: false, message: 'Server error' });
// // //     }
// // // };
// // // const removeFromCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         const productId = req.body.productId;

// // //         const user = await User.findByIdAndUpdate(
// // //             userId,
// // //             { $pull: { cart: { productId: productId } } },
// // //             { new: true }
// // //         );

// // //         res.json({ success: true, message: 'Product removed from cart', cart: user.cart });
// // //     } catch (error) {
// // //         console.error('Error removing from cart:', error);
// // //         res.status(500).json({ success: false, message: 'Server error' });
// // //     }
// // // };



// // // const getCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.redirect('/login');
// // //         }

// // //         const user = await User.findById(userId).populate('cart.productId');
// // //         if (!user) {
// // //             return res.status(404).render('error', { message: 'User not found' });
// // //         }

// // //         res.render('cart', { user });
// // //     } catch (error) {
// // //         console.error('Error retrieving cart:', error);
// // //         res.status(500).render('error', { message: 'Internal server error' });
// // //     }
// // // };


// // // const addToCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to add items to the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         const productId = req.body.productId;
// // //         let quantity = parseInt(req.body.quantity, 10);

// // //         if (isNaN(quantity) || quantity <= 0) {
// // //             quantity = 1;
// // //         }

// // //         const product = await Product.findById(productId);
// // //         if (!product || product.stock < quantity) {
// // //             return res.status(400).json({ success: false, message: 'Not enough stock available' });
// // //         }

// // //         const cartItem = user.cart.find(item => item.productId.equals(productId));
// // //         if (cartItem) {
// // //             cartItem.quantity += quantity;
// // //         } else {
// // //             user.cart.push({ productId, quantity });
// // //         }

// // //         await user.save();
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error adding to cart:', error);
// // //         res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };


// // // const updateCartQuantity = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to update the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             return res.status(404).json({ success: false, message: 'User not found' });
// // //         }

// // //         // Iterate over quantities from the form data
// // //         for (const [productId, quantity] of Object.entries(req.body)) {
// // //             const product = await Product.findById(productId);
// // //             if (!product) {
// // //                 return res.status(404).json({ success: false, message: `Product ${productId} not found` });
// // //             }

// // //             if (product.stock < quantity) {
// // //                 return res.status(400).json({ success: false, message: `Not enough stock for product ${productId}` });
// // //             }

// // //             const cartItem = user.cart.find(item => item.productId.equals(productId));
// // //             if (cartItem) {
// // //                 if (quantity <= 0) {
// // //                     // Remove item from cart if quantity is zero or negative
// // //                     user.cart = user.cart.filter(item => !item.productId.equals(productId));
// // //                 } else {
// // //                     cartItem.quantity = quantity;
// // //                 }
// // //             } else if (quantity > 0) {
// // //                 user.cart.push({ productId, quantity });
// // //             }
// // //         }

// // //         await user.save();
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error updating cart:', error);
// // //         res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };


// // // const removeFromCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to remove items from the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             return res.status(404).json({ success: false, message: 'User not found' });
// // //         }

// // //         const productId = req.body.productId;
// // //         user.cart = user.cart.filter(item => !item.productId.equals(productId));

// // //         await user.save();
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error removing from cart:', error);
// // //         res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };
// // // controllers/user/cartController.js
// // // const mongoose = require('mongoose');
// // // const getCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             req.flash('error', 'You need to be logged in to view the cart');
// // //             return res.redirect('/login');
// // //         }

// // //         const user = await User.findById(userId).populate('cart.productId');
// // //         if (!user) {
// // //             req.flash('error', 'User not found');
// // //             return res.redirect('/login');
// // //         }

// // //         res.render('cart', {
// // //             user: user,
// // //             error: req.flash('error'),
// // //             success: req.flash('success')
// // //         });
// // //     } catch (error) {
// // //         console.error('Error getting cart:', error);
// // //         req.flash('error', 'Internal server error');
// // //         res.redirect('/cart');
// // //     }
// // // };
// // // const addToCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to add items to the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             return res.status(404).json({ success: false, message: 'User not found' });
// // //         }

// // //         const { productId, quantity } = req.body;
// // //         if (!mongoose.Types.ObjectId.isValid(productId)) {
// // //             return res.status(400).json({ success: false, message: 'Invalid product ID' });
// // //         }

// // //         const product = await Product.findById(productId);
// // //         if (!product) {
// // //             return res.status(404).json({ success: false, message: 'Product not found' });
// // //         }

// // //         const cartItem = user.cart.find(item => item.productId.toString() === productId);
// // //         if (cartItem) {
// // //             // Update quantity if the item already exists in the cart
// // //             cartItem.quantity += parseInt(quantity);
// // //         } else {
// // //             // Add new item to the cart
// // //             user.cart.push({ productId, quantity: parseInt(quantity) });
// // //         }

// // //         await user.save();
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error adding to cart:', error);
// // //         res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };
// // // const updateCartQuantity = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             return res.status(401).json({ success: false, message: 'You need to be logged in to update the cart' });
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             return res.status(404).json({ success: false, message: 'User not found' });
// // //         }

// // //         // Iterate over quantities from the form data
// // //         for (const [key, value] of Object.entries(req.body)) {
// // //             if (key === 'quantity') continue; // Skip the 'quantity' key

// // //             const productId = key;
// // //             const quantity = parseInt(value);

// // //             if (!mongoose.Types.ObjectId.isValid(productId)) {
// // //                 return res.status(400).json({ success: false, message: `Invalid product ID ${productId}` });
// // //             }

// // //             const product = await Product.findById(productId);
// // //             if (!product) {
// // //                 return res.status(404).json({ success: false, message: `Product ${productId} not found` });
// // //             }

// // //             if (product.stock < quantity) {
// // //                 return res.status(400).json({ success: false, message: `Not enough stock for product ${productId}` });
// // //             }

// // //             const cartItem = user.cart.find(item => item.productId.equals(productId));
// // //             if (cartItem) {
// // //                 if (quantity <= 0) {
// // //                     // Remove item from cart if quantity is zero or negative
// // //                     user.cart = user.cart.filter(item => !item.productId.equals(productId));
// // //                 } else {
// // //                     cartItem.quantity = quantity;
// // //                 }
// // //             } else if (quantity > 0) {
// // //                 user.cart.push({ productId, quantity });
// // //             }
// // //         }

// // //         await user.save();
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error updating cart:', error);
// // //         res.status(500).json({ success: false, message: 'Internal server error' });
// // //     }
// // // };

// // // const removeFromCart = async (req, res) => {
// // //     try {
// // //         const userId = req.session.userId;
// // //         if (!userId) {
// // //             req.flash('error', 'You need to be logged in to remove items from the cart');
// // //             return res.redirect('/login');
// // //         }

// // //         const user = await User.findById(userId);
// // //         if (!user) {
// // //             req.flash('error', 'User not found');
// // //             return res.redirect('/cart');
// // //         }

// // //         const productId = req.body.productId;
// // //         user.cart = user.cart.filter(item => !item.productId.equals(productId));

// // //         await user.save();
// // //         req.flash('success', 'Item removed from cart');
// // //         res.redirect('/cart');
// // //     } catch (error) {
// // //         console.error('Error removing from cart:', error);
// // //         req.flash('error', 'Internal server error');
// // //         res.redirect('/cart');
// // //     }
// // // };


// // exports.getCart = async (req, res) => {
// //     try {
// //         const userId = req.session.userId
// //         const user = await User.findById(userId).populate('cart.productId');
// //        // res.json(user.cart);
// //         res.render('cart',{cart:user.cart})
// //     } catch (error) {
// //         res.status(500).json({ message: "Error fetching cart", error: error.message });
// //     }
// // };

// // const addToCart =async(req,res)=>{
// //     try {
        
// //     } catch (error) {
// //         console.log(error.message)
// //     }
// // }


// // // exports.addToCart = async (req, res) => {
// // //     try {
// // //         const userId=req.session.userId
// // //         const { productId, quantity } = req.body;
// // //         const user = await User.findById(userId);
// // //         const product = await Product.findById(productId);

// // //         if (!product) {
// // //             return res.status(404).json({ message: "Product not found" });
// // //         }

// // //         if (product.stock < quantity) {
// // //             return res.status(400).json({ message: "Not enough stock" });
// // //         }

// // //         if (quantity > product.maxPerPerson) {
// // //             return res.status(400).json({ message: `Maximum ${product.maxPerPerson} per person` });
// // //         }

// // //         const existingCartItem = user.cart.find(item => item.productId.toString() === productId);

// // //         if (existingCartItem) {
// // //             existingCartItem.quantity += quantity;
// // //         } else {
// // //             user.cart.push({ productId, quantity });
// // //         }

// // //         product.stock -= quantity;
// // //         await product.save();
// // //         await user.save();

// // //         res.json({ message: "Product added to cart", cart: user.cart });
// // //     } catch (error) {
// // //         res.status(500).json({ message: "Error adding to cart", error: error.message });
// // //     }
// // // };
// // exports.addToCart = async (req, res) => {
// //     try {
// //         const { productId, quantity } = req.body;
        
// //         // Ensure productId is provided and quantity is a valid number
// //         if (!productId) {
// //             return res.status(400).json({ message: "Product ID is required" });
// //         }
        
// //         const parsedQuantity = parseInt(quantity, 10);
// //         if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
// //             return res.status(400).json({ message: "Invalid quantity" });
// //         }

// //         // Check if req.user exists
// //         if (!req.user || !req.user._id) {
// //             return res.status(401).json({ message: "User not authenticated" });
// //         }

// //         const user = await User.findById(req.user._id);

// //         // Check if user exists
// //         if (!user) {
// //             return res.status(404).json({ message: "User not found" });
// //         }

// //         const product = await Product.findById(productId);

// //         if (!product) {
// //             return res.status(404).json({ message: "Product not found" });
// //         }

// //         if (product.quantity < parsedQuantity) {
// //             return res.status(400).json({ message: "Not enough stock" });
// //         }

// //         // Ensure user.cart exists
// //         if (!user.cart) {
// //             user.cart = [];
// //         }

// //         // Check if the product is already in the cart
// //         const existingCartItem = user.cart.find(item => item.productId && item.productId.toString() === productId);

// //         if (existingCartItem) {
// //             existingCartItem.quantity += parsedQuantity;
// //         } else {
// //             user.cart.push({ productId, quantity: parsedQuantity });
// //         }

// //         // Ensure we're working with numbers
// //         product.quantity = Math.max(0, product.quantity - parsedQuantity);
// //         await product.save();
// //         await user.save();

// //         res.json({ message: "Product added to cart", cart: user.cart });
// //     } catch (error) {
// //         console.error("Error in addToCart:", error);
// //         res.status(500).json({ message: "Error adding to cart", error: error.message });
// //     }
// // }
// // exports.updateCartQuantity = async (req, res) => {
// //     try {
// //         const userId=req.session.userId
// //         const { productId, quantity } = req.body;
// //         const user = await User.findById(userId);
// //         const product = await Product.findById(productId);

// //         const cartItem = user.cart.find(item => item.productId.toString() === productId);

// //         if (!cartItem) {
// //             return res.status(404).json({ message: "Product not in cart" });
// //         }

// //         const quantityDifference = quantity - cartItem.quantity;

// //         if (product.stock < quantityDifference) {
// //             return res.status(400).json({ message: "Not enough stock" });
// //         }

// //         if (quantity > product.maxPerPerson) {
// //             return res.status(400).json({ message: `Maximum ${product.maxPerPerson} per person` });
// //         }

// //         cartItem.quantity = quantity;
// //         product.stock -= quantityDifference;

// //         await product.save();
// //         await user.save();

// //         res.json({ message: "Cart updated", cart: user.cart });
// //     } catch (error) {
// //         res.status(500).json({ message: "Error updating cart", error: error.message });
// //     }
// // };

// // exports.removeFromCart = async (req, res) => {
// //     try {
// //         const userId=req.session.userId
// //         const { productId } = req.body;
// //         const user = await User.findById(userId);
// //         const product = await Product.findById(productId);

// //         const cartItemIndex = user.cart.findIndex(item => item.productId.toString() === productId);

// //         if (cartItemIndex === -1) {
// //             return res.status(404).json({ message: "Product not in cart" });
// //         }

// //         const removedQuantity = user.cart[cartItemIndex].quantity;
// //         user.cart.splice(cartItemIndex, 1);
// //         product.stock += removedQuantity;

// //         await product.save();
// //         await user.save();

// //         res.json({ message: "Product removed from cart", cart: user.cart });
// //     } catch (error) {
// //         res.status(500).json({ message: "Error removing from cart", error: error.message });
// //     }
// // };

// // // module.exports={
// // //     addToCart,
// // //     updateCartQuantity,
// // //     removeFromCart,
// // //     getCart
// // // }




// // controllers/user/cartController.js
// const User = require('../../models/userModel');
// const Product = require('../../models/productModel');

// // Helper function to find product by ID and check stock
// const findProductAndCheckStock = async (productId, quantity) => {
//   const product = await Product.findById(productId);

//   if (!product) {
//     throw new Error('Product not found');
//   }

//   if (product.is_blocked) {
//     throw new Error('Product is currently unavailable');
//   }

//   if (product.quantity < quantity) {
//     throw new Error('Insufficient stock available');
//   }

//   return product;
// };
// // Add a product to the cart
// const addToCart = async (req, res) => {
//     try {
//       const { productId, quantity } = req.body;
//       const userId = req.session.userId;
  
//       // Check if the user is authenticated
//       if (!userId) {
//         return res.status(401).json({ message: 'User not authenticated' });
//       }
  
//       //
//       // Find product and check stock availability
//       const product = await findProductAndCheckStock(productId, qty);
//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }
  
//       // Check if the product is already in the user's cart
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       const cartItem = user.cart.find(item => item.productId.toString() === productId);
  
//       if (cartItem) {
//         // Update quantity in the cart, ensuring it does not exceed stock
//         const newQuantity = cartItem.quantity + qty;
//         if (newQuantity > product.quantity) {
//           return res.status(400).json({ message: 'Exceeds available stock' });
//         }
//         cartItem.quantity = newQuantity;
//       } else {
//         // Add new product to cart
//         user.cart.push({ productId, quantity: qty });
//       }
  
//       // Save the updated user document
//       await user.save();
  
//       // Respond with a success message
//       res.status(200).json({ message: 'Product added to cart successfully' });
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       res.status(500).json({ message: 'An error occurred while adding to the cart' });
//     }
//   };
  

// // // List products in the cart
// // const listCart = async (req, res) => {
// //   try {
// //     const userId = req.session.userId;

// //     if (!userId) {
// //       return res.status(401).json({ message: 'User not authenticated' });
// //     }

// //     const user = await User.findById(userId).populate('cart.productId');

// //     if (!user) {
// //       return res.status(404).json({ message: 'User not found' });
// //     }
// // res.render('cart',{cart:user.cart})
// //     res.status(200).json({ cart: user.cart });
// //   } catch (error) {
// //     console.error('Error listing cart:', error.message);
// //     res.status(500).json({ message: 'An error occurred while listing the cart' });
// //   }
// // };
// const getCart = async (req, res) => {
//     try {
//       const userId = req.session.userId;
//       if (!userId) {
//         return res.redirect('/login');
//       }
  
//       // Fetch the user and populate the product details in the cart
//       const user = await User.findById(userId).populate('cart.productId');
  
//       // Check if user and cart are properly populated
//       if (!user || !user.cart.length) {
//         return res.render('cart', { cart: [] });
//       }
  
//       // Log cart to check for any undefined productIds
//       console.log('User Cart:', user.cart);
  
//       res.render('cart', { cart: user.cart });
//     } catch (error) {
//       console.error('Error fetching cart:', error.message);
//       res.status(500).send('Server Error');
//     }
//   };
  
  
// // Remove a product from the cart
// const removeFromCart = async (req, res) => {
//   try {
//     const { productId } = req.body;
//     const userId = req.session.userId;

//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Remove the product from the cart
//     user.cart = user.cart.filter(item => item.productId.toString() !== productId);

//     await user.save();
//     res.status(200).json({ message: 'Product removed from cart successfully', cart: user.cart });
//   } catch (error) {
//     console.error('Error removing from cart:', error.message);
//     res.status(500).json({ message: 'An error occurred while removing the product from the cart' });
//   }
// };

// // Update product quantity in the cart
// const updateCartQuantity = async (req, res) => {
//   try {
//     const { productId, quantity } = req.body;
//     const userId = req.session.userId;

//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     const qty = parseInt(quantity, 10);

//     if (qty <= 0) {
//       return res.status(400).json({ message: 'Quantity must be at least 1' });
//     }

//     const product = await findProductAndCheckStock(productId, qty);

//     const user = await User.findById(userId);

//     const cartItem = user.cart.find(item => item.productId.toString() === productId);

//     if (!cartItem) {
//       return res.status(404).json({ message: 'Product not found in cart' });
//     }

//     if (qty > product.quantity) {
//       return res.status(400).json({ message: 'Exceeds available stock' });
//     }

//     cartItem.quantity = qty;

//     await user.save();
//     res.status(200).json({ message: 'Cart updated successfully', cart: user.cart });
//   } catch (error) {
//     console.error('Error updating cart quantity:', error.message);
//     res.status(500).json({ message: 'An error occurred while updating the cart' });
//   }
// };

// // Export the cart controller functions
// module.exports = {
//   addToCart,
//   getCart,
//   removeFromCart,
//   updateCartQuantity,
// };

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

          //const categories = await Category.find({ is_active: true });
        //  const brands = await Brand.find({ is_active: true });
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