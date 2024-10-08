const mongoose=require('mongoose')

const categorySchema=mongoose.Schema({
    categoryName:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    categoryOffer:{
        type:Number,
        default:0
    },
    offerExpiry: {
        type: Date,  // Expiry date for the category offer
        default: null
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
},{ timestamps: true })

const Category = mongoose.model('Category',categorySchema) 
module.exports=Category