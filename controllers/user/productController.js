const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const User = require('../../models/userModel')
const Brand = require('../../models/brandModel')
const Order = require('../../models/orderModel');
const Referral=require('../../models/referralModel')



const getHome = async (req, res) => {
  try {
      // Fetch trending products based on view count, ensuring the related category and brand are active
      const trendingProducts = await Product.find({ is_blocked: false })
          .populate({
              path: 'categoryId',
              match: { isListed: true }, // Only include products with listed categories
              select: '_id'
          })
          .populate({
              path: 'brandId',
              match: { isListed: true }, // Only include products with listed brands
              select: '_id'
          })
          .sort({ views: -1 }) // Sort by views in descending order
          .limit(8); // Limit to 8 trending products

      // Filter out products where the populated category or brand is null (unlisted)
      const filteredTrendingProducts = trendingProducts.filter(product => 
          product.categoryId && product.brandId
      );

      res.render('home', {
          trendingProducts: filteredTrendingProducts
      });
  } catch (error) {
      console.log('Error fetching products for home page:', error.message);
      res.redirect('/500');
  }
};


const productDetails = async (req, res) => {
    try {

        const productId = req.params.id;
        const currentPage = parseInt(req.query.page) || 1;  
        const limit = parseInt(req.query.limit) || 5; // Limit of reviews per page
        const userId=req.session.userId
        const skip = (currentPage - 1) * limit;  
        // Find the product by ID and ensure it is not blocked
        const product = await Product.findOne({ _id: productId, is_blocked: false })
            .populate({
                path: 'categoryId',
                match: { isListed: true },
                select: 'categoryName'
            })
            .populate({
                path: 'brandId',
                match: { isListed: true },
                select: 'brandName'
            });

        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        // Get paginated reviews
        const totalReviews = product.productReview.length;
        const paginatedReviews = product.productReview.slice(skip, skip + limit);

        // Fetch related products (e.g., from the same category)
        const relatedProducts = await Product.find({
            categoryId: product.categoryId,
            _id: { $ne: product._id },
            is_blocked: false
        }).limit(4);

        // Increment the product's view count
        await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

        // Render the product details page
        res.render('product-details', {
            product,
            userId,
            relatedProducts,
            currentPage,
            totalPages: Math.ceil(totalReviews / limit),
            paginatedReviews,
            limit // Pass the limit value to the EJS template
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
        const categories = await Category.find({ isListed: true });

        // Build the search query
        const searchQuery = {
            $or: [
                { productName: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ],
            salePrice: { $gte: minPrice, $lte: maxPrice },
            is_blocked: false,
        };

        if (category) {
            searchQuery.categoryId = category;
        }

        // Build sorting options
        const sortOptions = getSortOption(sort);

        // Fetch products with pagination and sorting, while filtering out unlisted categories or brands
        const searchResults = await Product.find(searchQuery)
            .populate({
                path: 'categoryId',
                match: { isListed: true },
                select: '_id'
            })
            .populate({
                path: 'brandId',
                match: { isListed: true },
                select: '_id'
            })
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage);

        // Filter out products with unlisted categories or brands
        const filteredResults = searchResults.filter(product => product.categoryId && product.brandId);

        // Count total results for pagination
        const totalResults = filteredResults.length;
        const totalPages = Math.ceil(totalResults / itemsPerPage);

        // Render the search results
        res.render('search-results', {
            searchResults: filteredResults,
            query,
            sort,
            categories,
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
};

const listProducts = async (req, res) => {
  try {
      const { sort, category, page = 1, search = '', minPrice = 0, maxPrice = Infinity } = req.query;
      const limit = 12;
      const skip = (page - 1) * limit;

      // Build the query object to filter products
      let query = { is_blocked: false };

      if (category) {
          query.categoryId = category;
      }

      if (search) {
          query.$or = [
              { productName: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { brand: { $regex: search, $options: 'i' } },
          ];
      }

      query.salePrice = { $gte: minPrice, $lte: maxPrice };

      // Fetch products based on filters, sort, and pagination
      const products = await Product.find(query)
          .populate({
              path: 'categoryId',
              match: { isListed: true },
              select: '_id'
          })
          .populate({
              path: 'brandId',
              match: { isListed: true },
              select: '_id'
          })
          .sort(getSortOption(sort))
          .skip(skip)
          .limit(limit);

      // Filter out products with unlisted categories or brands
      const filteredProducts = products.filter(product => product.categoryId && product.brandId);

      // Fetch categories for dropdown
      const categories = await Category.find({ isListed: true });

      // Fetch total number of filtered products for pagination
      const totalProducts = filteredProducts.length;
      const totalPages = Math.ceil(totalProducts / limit);

      // Render the product list page with the filtered data
      res.render('product-list', {
          products: filteredProducts,
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
          return { popularity: -1 };
  }
}
const postReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;
        const userId = req.session.userId;

        // Check if the user is logged in
        if (!userId) {
            return res.status(401).json({ message: 'You must be logged in to submit a review.' });
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Check if the user has already purchased the product
        const order = await Order.findOne({ userId, 'products.productId': productId });
        if (!order) {
            return res.status(400).json({ message: 'You can only review products you have purchased.' });
        }

        // Find the user to get their username
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Add the new review to the product's review array
        product.productReview.push({
            userId: user._id,
            name: user.username,
            rating,
            comment,
            date: new Date()
        });

        // Save the updated product
        await product.save();

        // Send a success response
        res.status(200).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.error('Error submitting review:', error.message);
        res.status(500).json({ message: 'An error occurred while submitting your review.' });
    }
};


module.exports={
    getHome,
    productDetails,
    listProducts,
    search,
    postReview
}    