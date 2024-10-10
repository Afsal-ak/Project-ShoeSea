const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const Referral = require('../../models/referralModel')

const listOffers = async (req, res, next) => {
    try {
        const itemsPerPage = 5; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page number
        const type = req.query.type || 'product'; // 'product' or 'category'

        let totalOffers, offers;

        if (type === 'product') {
            // Count the total number of product offers
            totalOffers = await Product.countDocuments({ productOffer: { $gt: 0 } });
            offers = await Product.find({ productOffer: { $gt: 0 } })
                .populate('categoryId')  // Assuming category is a reference in Product schema
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage);
        } else if (type === 'category') {
            // Count the total number of category offers
            totalOffers = await Category.countDocuments({ categoryOffer: { $gt: 0 } });
            offers = await Category.find({})
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage);
        }

        const totalPages = Math.ceil(totalOffers / itemsPerPage);

        // Render the offer list
        res.render('offers-list', {
            offers,            // List of offers
            currentPage: page, // Current page number
            totalPages,        // Total number of pages
            successMessage: req.query.success || null, // Pass success message from query parameters
            type               // 'product' or 'category'
        });
    } catch (error) {
        console.error('Error listing offers:', error);
        next(error)
    }
};


const getReferralOffer = async (req, res, next) => {
    try {
        const referral = await Referral.find()
        res.render('referral-manage', { referral })
    } catch (error) {
        console.error(error.message)
        next(error)

    }
}

const addReferralCode = async (req, res, next) => {
    try {
        res.render('addReferralOffer')
    } catch (error) {
        consoe.error(error.message)
        next(error)

    }
}

const postAddReferralCode = async (req, res, next) => {
    try {
        const referralAmount = req.body.referralAmount.trim()
        const referralDescription = req.body.referralDescription.trim()

        let offer = await Referral.findOne();
        if (offer) {
            offer.referralAmount = referralAmount
            offer.referralDescription = referralDescription;
            await offer.save();
        } else {
            // Create a new referral offer
            offer = new Referral({ referralAmount, referralDescription });
            await offer.save();
        }

        res.redirect('/admin/referral')

        console.log('referral succes')

    } catch (error) {
        console.error(error.message)
        next(error)

    }
}
const blockReferral = async (req, res, next) => {
    try {
        const referralId = req.params.id;
        await Referral.findByIdAndUpdate(referralId, { isActive: false });
        console.log(`Referral blocked successfully.`);
        res.redirect('/admin/referral');
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};
const unBlockReferral = async (req, res, next) => {
    try {
        const referralId = req.params.id;
        await Referral.findByIdAndUpdate(referralId, { isActive: true });
        console.log(`Referral = unblocked successfully.`);
        res.redirect('/admin/referral');
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};


module.exports = {
    listOffers,
    getReferralOffer,
    addReferralCode,
    postAddReferralCode,
    blockReferral,
    unBlockReferral

};
