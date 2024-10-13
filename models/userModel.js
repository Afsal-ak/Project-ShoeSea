


// module.exports=mongoose.model('User',userSchema) 
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    number: {
        type: String,
        required: false,
       // unique: true,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: false
    },
    authType: {
        type: String,
        enum: ['local', 'google'], // 'local' for regular email/password users, 'google' for OAuth
        default: 'local', 
      },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    cart:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product'
            },
            quantity:{
                type:Number,
                default:1
            }
        }
    ],
    referralCode: {
        type: String,
        unique: true,
        index: true,
    },
    referredBy: {
        type: String, // This can store the referral code of the referrer
        index: true,
    },
    walletBalance: {
        type: Number,
        default: 0, // Amount credited for referrals
    },
    walletTransaction:[{
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['credit', 'debit'] },
        amount: { type: Number },
        description: { type: String }
    }]
 
});

module.exports = mongoose.model('User', userSchema);
