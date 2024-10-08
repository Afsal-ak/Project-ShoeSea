const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:{
    type:Number,
    required:true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Credit Card', 'Wallet','Razorpay'],
    default: 'Cash on Delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Processing', 'Cancelled', 'Success', 'Failed','Payment Pending'],
    default: 'Processing'
},
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  returnReason: {
    type: String,
    default: null 
},

returnRequest: [{
  productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
  },
  quantity: {
      type: Number
  },
  reason: {
      type: String
  },
  status: {
      type: String,
      enum: ['Requested', 'Approved', 'Cancelled','Returned'],
      default: 'Requested'
  },
  requestDate: {
      type: Date,
      default: Date.now
  }
}],
  orderDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: true
  },
  totalQuantity: {
    type: Number,
    required: true
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  walletUsed: {
    type: Number,
     default: 0
    },
  deliveryCharge: {
     type: Number,
      default: 0
     }, 

  discount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  shippingAddress: {
    fname: String,
    lname: String,
    housename: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    phone: String,
},
razorpay: {
  orderId: { type: String }, // Save Razorpay Order ID here
  paymentId: { type: String }, // Razorpay Payment ID
  signature: { type: String } // Razorpay Signature
},
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

