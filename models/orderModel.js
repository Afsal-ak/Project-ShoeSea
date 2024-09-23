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
    enum: ['Cash on Delivery', 'Credit Card', 'PayPal','Razorpay'],
    default: 'Cash on Delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Processing', 'Cancelled', 'Success', 'Failed'],
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
  shippingCost: {
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
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

