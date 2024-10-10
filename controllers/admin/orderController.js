const Order=require('../../models/orderModel')

const listOrder = async (req, res,next) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page, default to 1
        const limit = 10; // Number of orders per page
        const skip = (page - 1) * limit; // Calculate the skip value for pagination

        // Fetch orders with pagination
        const totalOrders = await Order.countDocuments(); // Total number of orders
        const orders = await Order.find()
            .populate('userId', 'username') // Populate username from the User model
            .populate('products.productId') // Populate product details
            .limit(limit)
            .skip(skip)
            .sort({ orderDate: -1 }); // Sort by most recent orders

        const totalPages = Math.ceil(totalOrders / limit); // Calculate total number of pages

        res.render('order-list', { orders, currentPage: page, totalPages });
    } catch (error) {
        console.error('Error fetching orders:', error);
        next(error)
    }
};

const viewOrder=async(req,res,next)=>{
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
        next(error)
    }
}

const orderDelivered = async (req, res,next) => {
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

        res.redirect(`/admin/orders/${orderId}`);
    } catch (error) {
        console.error('Error updating order status:', error);
        next(error)
    }
};

const orderCancel = async (req, res,next) => {
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

        res.redirect(`/admin/orders/${orderId}`);
    } catch (error) {
        console.error('Error canceling order:', error);
        next(error)
    }
};

const orderShipped = async (req, res,next) => {
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

            res.redirect(`/admin/orders/${orderId}`);
        } else {
            res.status(400).send('Order cannot be marked as shipped');
        }
    } catch (error) {
        console.error('Error shipping order:', error);
        next(error)
    }
};

module.exports={
    listOrder,
    viewOrder,
    orderDelivered,
    orderShipped,
    orderCancel
}