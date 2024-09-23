const express = require('express');
const app = express();
const port = 3002;

// Middleware to parse JSON request bodies
app.use(express.json());

// Setting EJS as the view engine
app.set('view engine', 'ejs');

// Dummy Cart data (in a real application, this would be stored in a database or session)
let cart = [
  { productId: 1, name: 'Product 1', quantity: 1, price: 100 ,totalAmount:100},
  { productId: 2, name: 'Product 2', quantity: 2, price: 150 ,totalAmount:150},
];

// Route to render the cart page
app.get('/cart', (req, res) => {
  try {
    // Rendering the 'fetch.ejs' view and passing the cart data
    res.render('fetch', { cart });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// Route to update cart quantity and price
app.put('/cart/update/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  // Find the product in the cart
  const product = cart.find(item => item.productId == productId);

  if (product) {
    // Update the quantity and price of the product
    product.quantity = quantity;
product.totalAmount=product.price*quantity
    // Optionally update the price, if required
   
    res.json({ message: 'Cart updated', cart });
  } else {
    res.status(404).json({ message: 'Product not found in cart' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
