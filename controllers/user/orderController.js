const PDFDocument = require('pdfkit');

const Order = require('../../models/orderModel');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Address = require('../../models/addressModel');


const orderList = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error_msg', 'Please log in to view your order history.');
            return res.redirect('/login');
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Number of orders per page
        const skip = (page - 1) * limit;

        // Fetch total orders count for the logged-in user
        const totalOrders = await Order.countDocuments({ userId });

        // Fetch orders for the logged-in user, populate products, and apply pagination
        const orders = await Order.find({ userId })
            .populate({ path: 'products.productId', select: 'productName salePrice' })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);

        // Render the order list page with the orders and pagination data
        res.render('order-list', { orders, currentPage: page, totalPages, limit });

    } catch (error) {
        console.error('Error fetching order history:', error.message);
        req.flash('error_msg', 'Unable to fetch order history.');
        res.redirect('/');
    }
};


const orderCancel = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.params.orderId; // Fix to correctly extract orderId from req.params

        if (!userId) {
            req.flash('error_msg', 'User not authenticated.');
            return res.redirect('/login');
        }

        // Fetch the order for the logged-in user
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/order');
        }

        // Check if the order can be cancelled
        if (order.status === 'Cancelled' || order.status === 'Delivered') {
            req.flash('error_msg', 'Order cannot be cancelled.');
            return res.redirect('/order');
        }

        if(order.paymentMethod=='Razorpay' || 'Wallet' && order.paymentStatus=='Paid'||'Success'){
            // Find the user associated with the order
        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user's wallet balance
        user.walletBalance += order.totalAmount;

        // Add wallet transaction for the return
        user.walletTransaction.push({
            date: Date.now(),
            type: 'credit',
            amount: order.totalAmount,
            description: "Product Cancel"
        });

        // Save updated order and user
        await order.save();
        await user.save();

        }

        // Update order status to 'Cancelled'
        order.status = 'Cancelled';  // Corrected to assignment operator

        await order.save();  

        for (const productItem of order.products){
            const product=await Product.findById(productItem.productId)

            if(product){
                product.quantity+=productItem.quantity
                await product.save()
            }
        }

        req.flash('success_msg', 'Order cancelled successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        console.error('Error cancelling order:', error);
        req.flash('error_msg', 'Failed to cancel the order.');
        res.redirect('/order');
    }
};


const viewOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error_msg', 'Please log in to view order details.');
            return res.redirect('/login');
        }

        const order = await Order.findOne({ _id: orderId, userId })
            .populate('products.productId');

        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/order');
        }

        res.render('order-details', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        req.flash('error_msg', 'Failed to fetch order details.');
        res.redirect('/order');
    }
};

const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body; 

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order can be returned
        if (order.status !== 'Delivered') {
            return res.status(400).send('Order cannot be returned');
        }

        // Store the return reason and update the order status
        order.returnReason = reason;
        order.status = 'Returned';

        // Find the user associated with the order
        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user's wallet balance
        user.walletBalance += order.totalAmount;

        // Add wallet transaction for the return
        user.walletTransaction.push({
            date: Date.now(),
            type: 'credit',
            amount: order.totalAmount,
            description: "Product Returned"
        });

        // Save updated order and user
        await order.save();
        await user.save();

        // Loop through the products in the order and update their quantities
        for (const productItem of order.products) {
            const product = await Product.findById(productItem.productId);
            if (product) {
                product.quantity += productItem.quantity; // Increase the product quantity
                await product.save(); // Save the updated product
            }
        }

        req.flash('success_msg', 'Order returned successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};


const returnSingleProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { reason, quantity } = req.body;
         // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order status allows returns
        if (order.status !== 'Delivered') {
            return res.status(400).send('Order cannot be returned at this stage');
        }

        // Find the product in the order
        const productInOrder = order.products.find(
            (item) => item.productId.toString() === productId
        );
        if (!productInOrder) {
            return res.status(404).send('Product not found in order');
        }

        // Check if the requested return quantity is valid
        if (quantity > productInOrder.quantity || quantity <= 0) {
            return res.status(400).send('Invalid return quantity');
        }

        // Calculate the refund amount for the returned quantity
        const refundAmount = productInOrder.price * quantity;

        // Find the user associated with the order
        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user's wallet balance
        user.walletBalance += refundAmount;

        // Add wallet transaction for the return
        user.walletTransaction.push({
            date: Date.now(),
            type: 'credit',
            amount: refundAmount,
            description: `Refund for returning ${quantity} x ${productInOrder.productName}`
        });

        // Update the product's quantity in stock
        const product = await Product.findById(productId);
        if (product) {
            product.stockQuantity += quantity; // Return the quantity to stock
            await product.save();
        }

        // Save the return request in the order
        order.returnRequest.push({
            productId: productId,
            quantity: quantity,
            reason: reason,
            status: 'Returned',
            requestDate: Date.now()
        });

        // Update the product quantity in the order
        productInOrder.quantity -= quantity;

        // Check if all products have been returned
        const allProductsReturned = order.products.every(item => item.quantity === 0);

        // If all quantities of products are returned, update the order status
        if (allProductsReturned) {
            order.status = 'Returned';
        }
 
        // Save the updated order and user
        await order.save();
        await user.save();

        req.flash('success_msg', 'Product return requested successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const cancelSingleProduct = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        let { reason, quantity } = req.body;

        // Convert quantity to a number (if it's coming in as a string)
        quantity = parseInt(quantity, 10);

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the order status allows cancellations
        if (order.status === 'Delivered') {
            return res.status(400).send('Order cannot be cancelled after delivery');
        }

        // Find the product in the order
        const productInOrder = order.products.find(
            (item) => item.productId.toString() === productId
        );
        if (!productInOrder) {
            return res.status(404).send('Product not found in order');
        }

        // Check if the requested cancel quantity is valid
        if (quantity > productInOrder.quantity || quantity <= 0) {
            return res.status(400).send('Invalid cancel quantity');
        }

        // Calculate the refund amount for the canceled quantity
        const refundAmount = productInOrder.price * quantity;

        // Find the user associated with the order
        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user's wallet balance only if payment method was Razorpay or Wallet and payment was successful
        if (
            (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') &&
            (order.paymentStatus === 'Paid' || order.paymentStatus === 'Success')
        ) {
            user.walletBalance += refundAmount;

            // Add wallet transaction for the refund
            user.walletTransaction.push({
                date: Date.now(),
                type: 'credit',
                amount: refundAmount,
                description: `Refund for cancelling ${quantity} x ${productInOrder.productName}`
            });
        }

        // Update the product's quantity in stock
        const product = await Product.findById(productId);
        if (product) {
            product.stockQuantity += quantity; // Return the quantity to stock
            await product.save();
        }

        // Check if the product has already been canceled/returned, and update its quantity incrementally
        const existingReturnRequest = order.returnRequest.find(
            (req) => req.productId.toString() === productId
        );

        if (existingReturnRequest) {
            // Increment the quantity if an entry for this product already exists
            existingReturnRequest.quantity += quantity;
        } else {
            // Create a new entry in the returnRequest array if none exists for this product
            order.returnRequest.push({
                productId: productId,
                quantity: quantity,
                reason: reason,
                status: 'Cancelled',
                requestDate: Date.now()
            });
        }

        // Update the product quantity in the order
        productInOrder.quantity -= quantity;

        // Check if all products in the order have been canceled
        const allProductsCanceled = order.products.every(item => item.quantity === 0);

        // If all products have been canceled, update the order status
        if (allProductsCanceled) {
            order.status = 'Cancelled';
        }

        // Save the updated order and user
        await order.save();
        await user.save();

        req.flash('success_msg', 'Product cancellation requested successfully.');
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};
;


const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Fetch the order from the database
      const order = await Order.findOne({ orderId: orderId })
      .populate('userId addressId products.productId');
      
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
     
    // Create a new PDF document
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      // Set response headers to serve the file as a PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
  
      // Pipe the PDF directly to the response
      doc.pipe(res);
  
      
      // Add company information
      doc.fontSize(20).text('Shoesea',{align:'center'});
      doc.fontSize(10).text('1234 Street Name, City, State, 12345', 120, 80);
      doc.text('Phone: (123) 456-7890 | Email: shoesea@company.com', 120, 95);
  
      // Add invoice title
      doc.fontSize(18).text('INVOICE', 50, 130);
  
      // Add invoice details
      doc.fontSize(10).text(`Invoice Number: #${order.orderId}`, 50, 160);
      doc.text(`Invoice Date: ${order.orderDate.toISOString().split('T')[0]}`, 50, 175);
      //doc.text(`Due Date: ${new Date(order.orderDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`, 50, 190);
  
      // Add customer details
      doc.text(`Customer Name: ${order.userId.username}`, 300, 160);
      doc.text(`Billing Address: ${order.addressId.fname}, ${order.addressId.city}, ${order.addressId.state}, ${order.addressId.pincode}`, 300, 175);
      doc.text(`Shipping Address: ${order.shippingAddress.fname}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`, 300, 190);
      doc.text(`Contact: ${order.shippingAddress.phone}`, 300, 205);
  
      // Add table headers
      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Product Name', 50, tableTop);
      //doc.text('SKU', 200, tableTop);
      doc.text('Quantity', 280, tableTop);
      doc.text('Unit Price', 350, tableTop);
      doc.text('Total Price', 450, tableTop);
  
      // Add table content
      doc.font('Helvetica');
      let yPosition = tableTop + 20;
      order.products.forEach((product, index) => {
        doc.text(product.productId.productName, 50, yPosition);
     //   doc.text(product.productId.sku, 200, yPosition);
        doc.text(product.quantity.toString(), 280, yPosition);
        doc.text(`${product.productId.salePrice.toFixed(2)}Rs`, 350, yPosition);
        doc.text(`${(product.productId.salePrice * product.quantity) .toFixed(2)} Rs`, 450, yPosition);
        yPosition += 20;
      });
  
      // Add totals
      yPosition += 20;
      doc.font('Helvetica-Bold');
      doc.text('Subtotal', 350, yPosition);
      doc.text(`${order.totalAmount.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Discount', 350, yPosition);
      doc.text(`-${order.discount.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Delivery Charge', 350, yPosition);
      doc.text(`${order.deliveryCharge.toFixed(2)} Rs`, 450, yPosition);
      yPosition += 20;
      doc.text('Total Due', 350, yPosition);
      doc.text(`${(order.totalAmount - order.discount + order.deliveryCharge).toFixed(2)} Rs`, 450, yPosition);
      
      yPosition += 20;

      // Add footer
      doc.fontSize(10).text(`Payment Method: ${order.paymentMethod}`, 50, 700);
      doc.text(`Transaction ID: ${order.orderId}`, 50, 715);
      doc.text('Thank you for your purchase!', 50, 730);
      doc.text('Contact us: shoesea@company.com', 50, 745);
  
      // Finalize the PDF and end the stream
      doc.end();
  
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
    }
  };


module.exports={
    orderList,
    viewOrderDetails,
    orderCancel,
    returnOrder,
    returnSingleProduct,
    cancelSingleProduct,
    downloadInvoice

}