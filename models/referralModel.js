const mongoose = require('mongoose');

const referralOfferSchema = new mongoose.Schema({
    referralAmount: {
        type: Number,
        required: true, // Amount credited when a referral is successful
    },
    isActive: {
        type: Boolean,
        default: true, 
    },
    referralDescription: {
        type: String,
        default: "Referral Cashback Offer"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('ReferralOffer', referralOfferSchema);
