const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Order = require('../../models/orderModel')
const fs = require('fs');
const path = require('path');

// // Generate PDF report
// const generatexPdfReport = (data, filename) => {
//     const doc = new PDFDocument();
//     doc.pipe(fs.createWriteStream(path.join(__dirname, `../public/reports/${filename}`)));

//     doc.fontSize(25).text('Sales Report', { align: 'center' });
//     doc.fontSize(12).text(`Total Sales Count: ${data.salesCount}`);
//     doc.text(`Total Amount: $${data.totalAmount}`);
//     doc.text(`Total Discount: $${data.totalDiscount}`);

//     doc.addPage().fontSize(14).text('Order Details');
//     data.orders.forEach(order => {
//         doc.fontSize(12).text(`Order ID: ${order._id}, Total Amount: $${order.totalAmount}, Discount: $${order.discount}`);
//     });

//     doc.end();
// };
const { PassThrough } = require('stream');

const generateSalesReportPDF = async (reportData) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    // Title
    doc.fontSize(16).text('Sales Report', { align: 'center' });
    doc.moveDown(2);

    // Column positions
    const columnPositions = {
        orderId: 50,
        totalAmount: 150,
        discount: 250,
        userName: 350,
        productName: 450
    };

    // Headers
    doc.fontSize(12);
    doc.text('Order ID', columnPositions.orderId, 80);
    doc.text('Total Amount', columnPositions.totalAmount, 80);
    doc.text('Discount', columnPositions.discount, 80);
    doc.text('User Name', columnPositions.userName, 80);
    doc.text('Product Name', columnPositions.productName, 80);
    doc.moveDown();

    // Line below headers
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Order data
    reportData.orders.forEach(order => {
        const currentY = doc.y;
        doc.fontSize(10);
        doc.text(order.orderId, columnPositions.orderId, currentY);
        doc.text(`$${order.totalAmount.toFixed(2)}`, columnPositions.totalAmount, currentY);
        doc.text(`$${order.discount.toFixed(2)}`, columnPositions.discount, currentY);
        doc.text(order.userId.username, columnPositions.userName, currentY);
        doc.text(order.products.map(p => p.productId.productName).join(', '), columnPositions.productName, currentY);
        doc.moveDown(0.5);
    });

    // Total calculations
    doc.moveDown();
    doc.text(`Total Sales Count: ${reportData.salesCount}`, { align: 'left' });
    doc.text(`Total Amount: $${reportData.totalAmount.toFixed(2)}`, { align: 'left' });
    doc.text(`Total Discount: $${reportData.totalDiscount.toFixed(2)}`, { align: 'left' });

    doc.end();
    return stream;
};

const downloadPdf = async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
        const reportData = await getSalesReportData({ startDate, endDate, period });

        if (!reportData || reportData.orders.length === 0) {
            return res.status(404).send("No orders found for the specified criteria.");
        }
        
        const pdfStream = await generateSalesReportPDF(reportData);

        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        pdfStream.pipe(res);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Server error occurred while generating the PDF');
    }
};


// Generate Excel report
const generateExcelReport = async (data, filename) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Total Amount', key: 'totalAmount', width: 20 },
        { header: 'Discount', key: 'discount', width: 20 }
    ];

    data.orders.forEach(order => {
        sheet.addRow({
            orderId: order._id,
            totalAmount: order.totalAmount,
            discount: order.discount
        });
    });

    sheet.addRow({});
    sheet.addRow({
        orderId: 'Total',
        totalAmount: data.totalAmount,
        discount: data.totalDiscount
    });

    await workbook.xlsx.writeFile(path.join(__dirname, `../public/reports/${filename}`));
};

// const getSalesReportData = async (query) => {
//     const { startDate, endDate, filter, page = 1, limit = 5 } = query;
//     const searchQuery = { status: 'Pending' };

//     // Check and parse date range
//     if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         searchQuery.orderDate = { 
//             $gte: start.setHours(0, 0, 0, 0), 
//             $lte: end.setHours(23, 59, 59, 999)
//         };
//     } else if (filter) {
//         const now = new Date();
//         // Apply preset filters if no custom dates are provided
//         if (filter === 'daily') {
//             searchQuery.orderDate = { 
//                 $gte: new Date(now.setHours(0, 0, 0, 0)), 
//                 $lt: new Date(now.setHours(23, 59, 59, 999))
//             };
//         } else if (filter === 'weekly') {
//             const startOfWeek = new Date(now);
//             startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start of week
//             startOfWeek.setHours(0, 0, 0, 0);
        
//             const endOfWeek = new Date(startOfWeek);
//             endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week
//             endOfWeek.setHours(23, 59, 59, 999);
        
//             searchQuery.orderDate = { 
//                 $gte: startOfWeek, 
//                 $lte: endOfWeek 
//             };
//         } else if (filter === 'monthly') {
//             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//             searchQuery.orderDate = { 
//                 $gte: startOfMonth.setHours(0, 0, 0, 0)
//             };
//         } else if (filter === 'yearly') {
//             const startOfYear = new Date(now.getFullYear(), 0, 1);
//             searchQuery.orderDate = { 
//                 $gte: startOfYear.setHours(0, 0, 0, 0)
//             };
//         }
//     }

//     const totalOrders = await Order.countDocuments(searchQuery);
//     const orders = await Order.find(searchQuery)
//         .populate('userId', 'username')
//         .populate('products.productId', 'productName')
//         .select('orderId totalAmount discount orderDate products userId')
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));

//     const salesCount = orders.length;
//     const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
//     const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);

//     return {
//         salesCount,
//         totalAmount,
//         totalDiscount,
//         orders,
//         totalOrders
//     };
// };
const getSalesReportData = async (query) => {
    const { startDate, endDate, filter, page = 1, limit = 5 } = query;
    const searchQuery = { status: 'Pending' };

    // Validate and parse date range
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }
    
        searchQuery.orderDate = { 
            $gte: start.setHours(0, 0, 0, 0), 
            $lte: end.setHours(23, 59, 59, 999)
        };
    
    
    } else if (filter) {
        const now = new Date();
        // Apply preset filters if no custom dates are provided
        if (filter === 'daily') {
            searchQuery.orderDate = { 
                $gte: new Date(now.setHours(0, 0, 0, 0)), 
                $lt: new Date(now.setHours(23, 59, 59, 999))
            };
        } else if (filter === 'weekly') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start of week
            startOfWeek.setHours(0, 0, 0, 0);
        
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week
            endOfWeek.setHours(23, 59, 59, 999);
        
            searchQuery.orderDate = { 
                $gte: startOfWeek, 
                $lte: endOfWeek 
            };
        } else if (filter === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            searchQuery.orderDate = { 
                $gte: startOfMonth.setHours(0, 0, 0, 0)
            };
        } else if (filter === 'yearly') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            searchQuery.orderDate = { 
                $gte: startOfYear.setHours(0, 0, 0, 0)
            };
        }
    }

    const totalOrders = await Order.countDocuments(searchQuery);
    const orders = await Order.find(searchQuery)
        .populate('userId', 'username')
        .populate('products.productId', 'productName')
        .select('orderId totalAmount discount orderDate products userId')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const salesCount = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);

    return {
        salesCount,
        totalAmount,
        totalDiscount,
        orders,
        totalOrders
    };
};

const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, filter, page = 1, limit = 5 } = req.query; // Get page and limit from query parameters
        const reportData = await getSalesReportData({ startDate, endDate, filter, page, limit }); // Pass pagination parameters

        const totalOrders = reportData.totalOrders; // Total number of orders
        const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages

        res.render('sales-report', {
            title: 'Sales Report',
            reportData,
            startDate,
            endDate,
            filter,
            currentPage: parseInt(page), // Pass current page to the template
            totalPages, // Pass total pages to the template
            limit, // Pass limit to the template
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error', { message: 'Failed to generate report' });
    }
};




const generateSalesReportExcel = async (reportData) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add headers
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 25 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Product Name', key: 'productName', width: 40 }
    ];

    // Add rows
    reportData.orders.forEach(order => {
        worksheet.addRow({
            orderId: order.orderId,
            totalAmount: `$${order.totalAmount.toFixed(2)}`,
            discount: `$${order.discount.toFixed(2)}`,
            userName: order.userId.username,
            productName: order.products.map(p => p.productId.productName).join(', ')
        });
    });

    // Add summary row
    worksheet.addRow({});
    worksheet.addRow({
        orderId: 'Total Sales Count:',
        totalAmount: reportData.salesCount,
        discount: '',
        userName: '',
        productName: ''
    });
    worksheet.addRow({
        orderId: 'Total Amount:',
        totalAmount: `$${reportData.totalAmount.toFixed(2)}`,
        discount: '',
        userName: '',
        productName: ''
    });
    worksheet.addRow({
        orderId: 'Total Discount:',
        totalAmount: `$${reportData.totalDiscount.toFixed(2)}`,
        discount: '',
        userName: '',
        productName: ''
    });

    // Convert to stream
    const stream = new PassThrough();
    await workbook.xlsx.write(stream);
    stream.end();

    return stream;
};

const downloadExcel = async (req, res) => {
    const { startDate, endDate, filter } = req.query;

    try {
        // Fetch report data
        const reportData = await getSalesReportData({ startDate, endDate, filter });

        if (!reportData || reportData.orders.length === 0) {
            return res.status(404).send("No orders found for the specified criteria.");
        }

        // Generate Excel file as a stream
        const excelStream = await generateSalesReportExcel(reportData);

        // Set headers for Excel file response
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        // Pipe the Excel stream to the response
        excelStream.pipe(res);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error occurred while generating the Excel file');
    }
};

module.exports = {
    getSalesReport,
    downloadPdf,
    downloadExcel
};
