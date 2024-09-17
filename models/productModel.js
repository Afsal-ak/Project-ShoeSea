

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
    brand: {
        type: String,
        required: false
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
        default: 0 // Default should likely be a numeric value, not true
    },
    offerDescription: { // Optional field to describe the offer
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
    sizes: [String] ,
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
        comment:{
            type:String
        },
        rating:{
            type:Number
        },
        date:{
            type:Date
        }
    }],
    views: {
        type: Number,
        default: 0 // Initialize view count to 0
      },
}, { timestamps: true }); 


 module.exports = mongoose.model('Product', productSchema)



// const mongoose = require('mongoose');
// const Schema = mongoose.Schema; 

// const productSchema = new Schema({
//     productName: {
//         type: String,
//         required: true,
//         trim: true 
//     },
//     description: {
//         type: String,
//         required: true
//     },
//     brand: {
//         type: String,
//         required: false
//     },
//     category: {
//         type: Schema.Types.ObjectId, // Refers to ObjectId, not Number
//         ref: 'Category', // Assuming you have a Category model
//         required: true
//     },
//     regularPrice: {
//         type: Number,
//         required: true
//     },
//     salePrice: {
//         type: Number,
//         required: true
//     },
//     productOffer: {
//         type: Number,
//         default: 0 // Default should likely be a numeric value, not true
//     },
//     offerDescription: { // Optional field to describe the offer
//         type: String,
//         default: ''
//      },
//      tax:{
//         type:Number,
//         default:0
//          },
//     quantity: {
//         type: Number,
//         required: true
//     },
//     color: {
//         type: String,
//         required: true
//     },
//     productImages:{
//         type:[String],
//         required:true
//     }
//     ,
//     is_blocked: {
//         type: Boolean,
//         default: false
//     },
//     sizes: [String] ,
//     status: {
//         type: String,
//         enum: ['Available', 'Out of Stock', 'Discontinued'], 
//         required: true,
//         default: 'Available'
//     },
//     productReview: [
//     {
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         comment:{
//             type:String
//         },
//         rating:{
//             type:Number
//         },
//         date:{
//             type:Date
//         }
//     }],
//     views: {
//         type: Number,
//         default: 0 // Initialize view count to 0
//       },
// }, { timestamps: true }); 


 //module.exports = mongoose.model('Product', productSchema)
