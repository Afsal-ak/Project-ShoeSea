// // const mongoose=require('mongoose')
// // const Category = require('./categoryModel')

// // const productSchema=mongoose.Schema({
// //     productName:{
// //       type: String,
// //       required:true
// //     },
// //     description:{
// //         type:String,
// //         required:true
// //     },
// //     brand:{
// //         type:String,
// //         required:false
// //     },
// //     category:{
// //         type:Schema.Types.ObjectId,
// //         ref:Category,
// //         required:true
// //     },
// //     regularPrice:{
// //         type:Number,
// //         required:true
// //     },
// //     salePrice:{
// //         type:Number,
// //         required:true
// //     },
// //     productOffer:{
// //         type:Number,
// //         default:0
// //     },
// //     quantity:{
// //         type:Number,
// //         required:true
// //     },
// //     colour:{
// //         type:String,
// //         required:true
// //     },
// //     productImages:{
// //         type:[String],
// //         required:true
// //     },
// //     is_blocked:{
// //         type:Boolean,
// //         default:false
// //     },
// //     status:{
// //         type:String,
// //         enum:['Available','out of stock','Discontinued'],
// //         required:true,
// //         default:"Avalable"
// //     }
// // },{timestamps:true})

// // const Product= mongoose.model('Product',productSchema)

// // module.exports=Product

const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
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
}, { timestamps: true }); 

// const Product = mongoose.model('Product', productSchema);

// // module.exports = Product;
// const mongoose = require("mongoose");

// const Schema = mongoose.Schema;

// const ProductSchema = new Schema({
//     productName: { type: String, required: true },
//   //  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//     images: [{ type: String }],
//     colour: { type: String, required: true },
//     brand: { type: String, required: true },
//     size: { type: String, required: true },
//     salesQuantity: { type: Number, required: true },
//     description: { type: String, required: true },
//     discount: { type: Number },
//     salePrice: { type: Number, required: true },
//     status: { type: String, required: true },
//     is_deleted: { type: Boolean, default: false }
// }, { timestamps: true });

// const Product = mongoose.model('Product', ProductSchema);
// module.exports = Product;

// const mongoose = require('mongoose')
// const Category = require('../models/categoryModel');
// const productSchema = mongoose.Schema({
   
//     title: {
//         type: String,
//         required: true
//     },
//     material: {
//         type: String,
//         required: true
//     },
//     color: {
//         type: String,
//         required: true
//     },
//     shape: {
//         type: String,
//         required: true
//     },
//     // brandId: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'Brand'
//     // },
//     description: {
//         type: String,
//         required: true
//     },
//     regularPrice: {
//         type: Number,
//         required: true
//     },
//     salePrice: {
//         type: Number,
//         required: false
//     },
//     image: [{
//         type: String
//     }],
//     categoryId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Category'
//     },
    
//     is_active: {
//         type: Boolean,
//         default: true
//     },
//     catStatus: {
//         type: Boolean,
//         default: true
//     },
//     discountPrice: {
//         type: Number,
//         default: null
//     },
//     quantity: {
//         type: Number,
//         default: 1
//     },
//     date: {
//         type: Date,
//         default: Date.now,
//         get: (timestamp) => {
//             return new Date(timestamp).toLocaleDateString('en-US');
//         },
//     },
//     discountPercentage: {
//         type: Number,
//         default: 0
//     },
//     catDiscountPercentage: {
//         type: Number,
//         default: 0
//     },
//     bestDiscount: {
//         type: Number,
//         default: 0
//     },
//     rating:{
//         type:Number,
//         default: null
//     },
//     productReview: [
//         {
//             userId: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User'
//             },
//             comment:{
//                 type:String
//             },
//             rating:{
//                 type:Number
//             },
//             date:{
//                 type:Date
//             }
//         }
//     ]


// })
// productSchema.index({ title: 'text' });


 module.exports = mongoose.model('Product', productSchema)
