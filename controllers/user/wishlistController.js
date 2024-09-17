const User=require('../../models/userModel')
const Product=require('../../models/productModel')
const Wishlist=require('../../models/wishlistModel')


const getWishlist = async (req, res) => {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is provided
    const limit = 10; // Number of items per page
    const skip = (page - 1) * limit;

    try {
        const wishlist = await Wishlist.findOne({ userId })
            .populate('products.productId')
            .skip(skip)
            .limit(limit);

        const totalProducts = await Wishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('wishlist', {
            wishlist,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const addWishlist=async(req,res)=>{
    const userId=req.session.userId
    const productId=req.body.productId
    try {
        // Find the wishlist for the user
        let wishlist = await Wishlist.findOne({ userId });
        
        if (wishlist) {
            // Check if the product is already in the wishlist
            if (!wishlist.products.some(item => item.productId.toString() === productId)) {
                // Add the product to the wishlist
                wishlist.products.push({ productId, addedAt: new Date() });
                await wishlist.save();
            }
        } else {
            // Create a new wishlist if it doesn't exist
            wishlist = new Wishlist({
                userId,
                products: [{ productId, addedAt: new Date() }]
            });
            await wishlist.save();
        }

        res.redirect('/wishlist'); // Redirect to wishlist page or another appropriate page
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
}
const removeWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.body.productId;

        // Find the wishlist document for the user
        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            // Remove the product from the wishlist
            await Wishlist.updateOne(
                { userId },
                { $pull: { products: { productId: productId } } }
            );
            req.flash('success', 'Product removed from wishlist!');
        } else {
            req.flash('error', 'Wishlist not found.');
        }

        res.redirect('back'); 
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Failed to remove product from wishlist.');
        res.redirect('back');
    }
};



module.exports={
    getWishlist,
    addWishlist,
    removeWishlist


}