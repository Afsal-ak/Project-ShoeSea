

const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
        trim: true 
    },
    description: {
        type: String,
        required: true
    },
    brandId: {
        type: Schema.Types.ObjectId, // Refers to ObjectId, not Number
        ref: 'Brand', // Assuming you have a Category model
        required: true
    },
    categoryId: {
        type: Schema.Types.ObjectId, // Refers to ObjectId, not Number
        ref: 'Category', // Assuming you have a Category model
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    productOffer: {
        type: Number,
        default: 0 // Offer default value
    },
    discountType: { // Store the discount type in the product schema
        type: String,
        enum: ['percentage', 'flat'],
        default: null
    },
    offerDescription: { 
        type: String,
        default: ''
     },
     tax:{
        type:Number,
        default:0
         },
    quantity: {
        type: Number,
        required: true
    },
    colour: {
        type: String,
        required: true
    },
    productImages: [{type:String}]
        
    ,
    is_blocked: {
        type: Boolean,
        default: false
    },
    
    sizes: [{
        size: String,
        quantity: Number
      }],
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Discontinued'], 
        required: true,
        default: 'Available'
    },
    productReview: [
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name:{
            type:String
        },
        comment:{
            type:String
        },
        rating:{
            type:Number
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    views: {
        type: Number,
        default: 0 // Initialize view count to 0
      },
}, { timestamps: true }); 


 module.exports = mongoose.model('Product', productSchema)

