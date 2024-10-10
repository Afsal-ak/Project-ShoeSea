const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    
    offerPrice: {
        type: Number,
        required: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],  // Add this field to specify the discount type
        required: true,
        default: 'flat'
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
  
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
