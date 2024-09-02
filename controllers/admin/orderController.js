const Order=require('../../models/orderModel')
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');

const User = require('../../models/userModel');
const Address = require('../../models/addressModel');

const listOrder=async(req,res)=>{
    try {
       const orders=await Order.find()
       .populate('userId','username')
       .populate('products.productId') 

       res.render('order-list', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server Error');
    }
}


const viewOrder=async(req,res)=>{
    try {
        const orderId=req.params.id

        const order=await Order.findById(orderId)
        .populate('userId', 'username') // Populate username from User model
        .populate('products.productId'); // Populate product details
        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('admin-orderDetails', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Server Error');
    }
}

const orderDelivered = async (req, res) => {
    try {
        const  orderId  = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status !== 'Shipped') {
            return res.status(400).send('Order cannot be marked as delivered');
        }

        order.status = 'Delivered';
        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Server Error');
    }
};

const orderCancel = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order is already cancelled
        if (order.status === 'Cancelled') {
            return res.status(400).send('Order is already cancelled');
        }

        order.status = 'Cancelled';
        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).send('Server Error');
    }
};

const orderShipped = async (req, res) => {
    try {
        const { id: orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order status is not 'Cancelled', 'Delivered', or 'Returned'
        if (order.status === 'Pending' || order.status === 'Processed') {
            order.status = 'Shipped';
            await order.save();

            res.redirect('/admin/orders');
        } else {
            res.status(400).send('Order cannot be marked as shipped');
        }
    } catch (error) {
        console.error('Error shipping order:', error);
        res.status(500).send('Server Error');
    }
};

module.exports={
    listOrder,
    viewOrder,
    orderDelivered,
    orderShipped,
    orderCancel
}