const Coupon = require('../../models/couponModel');
 

const getCouponList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number from the query parameters, default to 1
        const limit = 10; // Number of coupons to display per page
        const skip = (page - 1) * limit; // Calculate the number of documents to skip

        // Get the total number of coupons
        const totalCoupons = await Coupon.countDocuments();

        // Fetch coupons for the current page
        const coupons = await Coupon.find({})
            .skip(skip)
            .limit(limit);

        // Calculate total number of pages
        const totalPages = Math.ceil(totalCoupons / limit);

        // Render the coupon list with pagination details
        res.render('./coupon/coupon-list', {
            coupons,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Failed to load coupons.');
        res.redirect('/admin');
    }
};


// Render create coupon form
const getCreateCoupon = async (req, res) => {
    try {
        res.render('./coupon/create-coupon', { error: req.flash() });
    } catch (error) {
        console.error('Error rendering create coupon form:', error.message);
        req.flash('error', 'Failed to load the create coupon form. Please try again.');
        res.redirect('/admin/coupons'); // Redirect to coupon list if form fails to load
    }
};
const postCreateCoupon = async (req, res) => {
    try {
        const name = req.body.name.trim();
        const offerPrice = req.body.offerPrice.trim();
        const expirationDate = req.body.expirationDate.trim();
        const minimumPrice = req.body.minimumPrice.trim();
        const discountType = req.body.discountType; // Get the discount type from the form

        // Validate fields (check if any required field is empty)
        if (!name || !offerPrice || !expirationDate || !minimumPrice || !discountType) {
            req.flash('error', 'All fields are required. Please fill in all fields.');
            return res.redirect('/admin/coupons/create'); // Redirect back to the create form
        }

        // Validate if offerPrice and minimumPrice are numbers
        if (isNaN(offerPrice) || isNaN(minimumPrice)) {
            req.flash('error', 'Offer price and minimum price must be valid numbers.');
            return res.redirect('/admin/coupons/create');
        }

        // Check if coupon with the same name exists (case-insensitive)
        let checkName = await Coupon.findOne({ name: new RegExp('^' + name + '$', 'i') });

        if (checkName) {
            req.flash('error', 'Coupon with this name already exists!');
            return res.redirect('/admin/coupons/create'); // Redirect back to the create form
        }

        // Create and save the new coupon
        const newCoupon = new Coupon({
            name,
            offerPrice,
            expirationDate,
            minimumPrice,
            discountType // Save the discount type in the coupon
        });

        await newCoupon.save();
        console.log(newCoupon);
        req.flash('success', 'Coupon created successfully!');
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error creating coupon:', error.message);
        req.flash('error', 'Failed to create coupon.');
        res.redirect('/admin/coupons/create');
    }
};


// Block a coupon (make inactive)
const blockCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        await Coupon.updateOne({ _id: couponId }, { $set: { isActive: false } });
        req.flash('success', 'Coupon blocked successfully!');
        res.redirect('/admin/coupons');

    } catch (error) {
        console.error('Error blocking coupon:', error.message);
        req.flash('error', 'Failed to block coupon. Please try again.');
        res.redirect('/admin/coupons');
    }
};

// Unblock a coupon (make active)
const unBlockCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        await Coupon.updateOne({ _id: couponId }, { $set: { isActive: true } });
        req.flash('success', 'Coupon unblocked successfully!');
        res.redirect('/admin/coupons');

    } catch (error) {
        console.error('Error unblocking coupon:', error.message);
        req.flash('error', 'Failed to unblock coupon. Please try again.');
        res.redirect('/admin/coupons');
    }
};

module.exports = {
    getCouponList,
    getCreateCoupon,
    postCreateCoupon,
    blockCoupon,
    unBlockCoupon,
};
