const mongoose = require('mongoose')

const brandSchema = mongoose.Schema({
    brandName: {
        type: String,
        require: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, 
{timestamps: true}
)


const Brand = mongoose.model('Brand',brandSchema) 
module.exports=Brand