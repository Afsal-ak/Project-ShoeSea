
const User=require('../../models/userModel')
const Product=require('../../models/productModel')
const mongoose=require('mongoose')

module.exports = {
   
    addToCart: async (req, res) => {
        try {
            const productId = req.body.productId;
            const email = req.session.email;
            const quantity = parseInt(req.body.quantity, 10) || 1;
            const userId = req.session.userId; // Use userId from session

           
            const userData = await User.findById(userId)
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
    
   


showCart: async (req, res) => {
    try {
        const userId = req.session.userId; // Use userId from session
        if (!userId) {
            return res.status(401).redirect('/login');
        }

        const userData = await User.findById(userId).populate('cart.productId');
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
deleteFromCart: async (req, res) => {
    try {
        const userId = req.session.userId; // Use userId from session
        const productId = req.query.id;

        if (!userId) {
            return res.status(401).redirect('/login');
        }

        if (!productId) {
            return res.status(400).send('Product ID is required');
        }

        const userData = await User.findById(userId);
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
},
updateQuantity: async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const userId = req.session.userId; // Use userId from session
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userData = await User.findById(userId).populate('cart.productId');
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const cartItem = userData.cart.find(item => item.productId && item.productId._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        if (quantity > cartItem.productId.quantity) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        const maxLimit = 5;
        if (quantity > maxLimit) {
            return res.status(400).json({ message: `Cannot add more than ${maxLimit} items of this product` });
        }

        cartItem.quantity = quantity;
        await userData.save();

        const newSubtotal = cartItem.productId.salePrice * quantity;
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