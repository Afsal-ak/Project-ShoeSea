const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel'); // Assuming you have a category model
const Order = require('../../models/orderModel');
const Referral=require('../../models/referralModel')




const getHome = async (req, res) => {
    try {
      // Fetch trending products based on view count
      const trendingProducts = await Product.find({ is_blocked: false })
        .sort({ views: -1 }) // Sort by views in descending order
        .limit(8); // Limit to 8 trending products
  
      
  
      // Fetch sports products using the ObjectId of the sports category
      const sportsProducts = await Product.find({
        is_blocked: false,
        //categoryId: sportsCategory._id, // Use ObjectId here
      }).limit(8);
  
      // Fetch products for new collections based on creation date
      const newCollectionProducts = await Product.find({ is_blocked: false })
        .sort({ createdAt: -1 })
        .limit(8);
  
      res.render('home', {
        trendingProducts,
        sportsProducts,
        newCollectionProducts,
      });
    } catch (error) {
      console.log('Error fetching products for home page:', error.message);
      res.redirect('/500');
    }
  };
  


  const productDetails = async (req, res) => {
    try {
      // Find the product by ID and ensure it is not blocked
      const product = await Product.findOne({ _id: req.params.id, is_blocked: false });
  
      // If the product is not found or is blocked, return a 404 error page or message
      if (!product) {
        return res.status(404).render('error', { message: 'Product not found' });
      }
  
      // Fetch related products (e.g., products from the same category), excluding the current product and blocked products
      const relatedProducts = await Product.find({
        categoryId: product.categoryId,
        _id: { $ne: product._id }, // Exclude the current product
        is_blocked: false // Exclude blocked products
      })
      .limit(4);
  
      // Ensure reviews is always an array
      product.productReview = product.productReview || [];
  
      // Render the product details page with the product and related products
      res.render('product-details', {
        product,
        relatedProducts
      });
    } catch (error) {
      console.error('Error fetching product details:', error.message);
      res.status(500).render('error', { message: 'An error occurred' });
    }
  };
  
  
  
   const search = async (req, res) => {
    const { query, sort = 'popularity', category = '', minPrice = 0, maxPrice = Infinity, page = 1 } = req.query;
    const itemsPerPage = 10; // Number of items per page
    const skip = (page - 1) * itemsPerPage;
  
    try {
      // Fetch categories for category filter
      const categories = await Category.find({ isListed: true }); // Adjust according to your schema
  
      // Build the search query
      const searchQuery = {
        $or: [
          { productName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ],
        salePrice: { $gte: minPrice, $lte: maxPrice }, // Filter by price range
        is_blocked: false, // Ensure blocked products are excluded
      };
  
      if (category) {
        searchQuery.categoryId = category; // Assuming you use category IDs, adjust if needed
      }
  
      // Build sorting options
      const sortOptions = {};
      switch (sort) {
        case 'price_low_to_high':
          sortOptions.salePrice = 1;
          break;
        case 'price_high_to_low':
          sortOptions.salePrice = -1;
          break;
        case 'average_rating':
          sortOptions.averageRating = -1;
          break;
        default:
          sortOptions.popularity = -1;
          break;
      }
  
      // Execute search with pagination and sorting
      const searchResults = await Product.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(itemsPerPage);
  
      // Count total results for pagination
      const totalResults = await Product.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalResults / itemsPerPage);
  
      // Render the search results
      res.render('search-results', { 
        searchResults, 
        query, 
        sort, 
        categories, // Pass categories to view for category filtering
        selectedCategory: category, 
        minPrice, 
        maxPrice, 
        currentPage: Number(page),
        totalPages 
      });
    } catch (error) {
      console.error('Error during search:', error.message);
      res.status(500).render('error', { message: 'An error occurred while searching for products.' });
    }
   }
  
  
  
  const listProducts = async (req, res) => {
    try {
      const { sort, category, page = 1, search = '', minPrice = 0, maxPrice = Infinity } = req.query;
      const limit = 12;
      const skip = (page - 1) * limit;
  
      // Build the query object to filter products
      let query = { is_blocked: false };
  
      // Apply category filter
      if (category) {
        query.categoryId = category;
      }
  
      // Apply search filter
      if (search) {
        query.$or = [
          { productName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
        ];
      }
  
      // Apply price range filter
      query.salePrice = { $gte: minPrice, $lte: maxPrice };
  
      // Fetch products based on filters, sort, and pagination
      const products = await Product.find(query)
        .sort(getSortOption(sort))
        .skip(skip)
        .limit(limit);
  
      // Fetch categories for dropdown
      const categories = await Category.find({ isListed: true });
  
      // Fetch total number of products for pagination
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);
  
      // Render the product list page with the fetched data
      res.render('product-list', {
        products,
        categories,
        sortOption: sort,
        selectedCategory: category,
        searchQuery: search,
        currentPage: parseInt(page),
        totalPages,
        minPrice,
        maxPrice,
      });
    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).render('error', { message: 'An error occurred while fetching products.' });
    }
  };
  
  // Helper function to handle sorting options
  function getSortOption(sort) {
    switch (sort) {
      case 'price_low_to_high':
        return { salePrice: 1 };
      case 'price_high_to_low':
        return { salePrice: -1 };
      case 'average_rating':
        return { averageRating: -1 };
      case 'new_arrivals':
        return { createdAt: -1 };
      case 'a_to_z':
        return { productName: 1 };
      case 'z_to_a':
        return { productName: -1 };
      case 'featured':
        return { isFeatured: -1 };
      default:
        return { popularity: -1 }; // Default sort by popularity
    }
  }
  
module.exports={
    getHome,
    productDetails,
    listProducts,
    search,
}    