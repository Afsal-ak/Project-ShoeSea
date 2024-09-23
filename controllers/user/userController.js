

// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../../models/userModel');
const nodemailer = require('nodemailer');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel'); // Assuming you have a category model
const Order = require('../../models/orderModel');
const Referral=require('../../models/referralModel')


const getSignup = async (req, res) => {
  try {
    res.render('signup', { messages: null });
  } catch (error) {
    console.log(error.message);
    res.redirect('/500');
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

async function sendVerificationEmail(email, otp) {
  // Implementation remains the same
  try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.NODEMAILER_EMAIL,
                    pass: process.env.NODEMAILER_PASSWORD
                }
            });
    
            const info = await transporter.sendMail({
                from: process.env.NODEMAILER_EMAIL,
                to: email,
                subject: "Verify your account",
                text: `Your OTP is ${otp}`,
                html: `<b>Your OTP: ${otp}</b>`
            });
    
            return info.accepted.length > 0;
        } catch (error) {
            console.error('Error sending email', error);
            return false;
        }
}


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};
  
// const postSignup = async (req, res) => {
//     try {
//         const username = req.body.username.trim();
//         const email = req.body.email.trim();
//         const number = req.body.number.trim();
//         const referredBy= req.body.referredBy.trim();

//         const password = req.body.password.trim();
//         const confirm_password = req.body.confirm_password.trim();

//         if (!username || !email || !number || !password || !confirm_password) {
//             return res.render('signup', { messages: 'All fields are required and cannot be empty or just spaces' });
//         }

//         const regex = /^[a-zA-Z]+$/;
//         if (!regex.test(username)) {
//             return res.render('signup', { messages: 'Username should only contain alphabetic characters' });
//         }

//         if (password !== confirm_password) {
//             return res.render('signup', { messages: 'Passwords do not match' });
//         }

//         let user = await User.findOne({ email });
//         if (user) {
//             return res.render('signup', { messages: 'Email is already taken, try a new one' });
//         }

//         const otp = generateOtp();
//         const emailSent = await sendVerificationEmail(email, otp);

//         if (!emailSent) {
//             return res.json("email-error");
//         }

//         let referrer=null

//        // Check if the referral offer is active
//        const referralOffer = await Referral.findOne();
//        if (referralOffer && !referralOffer.isActive) {
//            return res.render('signup', { messages: 'Referral offer is currently inactive' });
//        }

//        // If referral code is provided, check if it's valid
//        if (referredBy) {
//            referrer = await User.findOne({ referredBy });
//            if (!referrer) {
//                return res.render('signup', { messages: 'Invalid referral code' });
//            }
//        }

//         req.session.userOtp = otp;
//         req.session.userData = { username, email, number, password ,referredBy};

//      //  return res.redirect('/verify-otp');
//         console.log('OTP Sent', otp);
//         return res.render('verify-otp')
//     } catch (error) {
//         console.error('Signup Error', error.message);
//         res.status(500).send('Server Error');
//     }
// };

// const verifyOtp = async (req, res) => {
  
//   try {
//           const { otp } = req.body;
    
//           if (otp.toString() === req.session.userOtp.toString()) {
//               const userData = req.session.userData;
//               const passwordHash = await securePassword(userData.password);
    
//               // Create a new user instance and save it to the database
//               const newUser = new User({
//                   username: userData.username,
//                   email: userData.email,
//                   referredBy:userData.referredBy,
//                   number: userData.number,
//                   password: passwordHash
//               });
    
//               await newUser.save();

//               if (userData.referredBy) {
//                 const referrer = await User.findOne({ referralCode: userData.referredBy });
                
//                 if (referrer && referrer.isActive === false) { // Check if referrer is active
//                     referrer.walletBalance += referralAmount; // Specify your referral amount
//                     referrer.walletTransaction.push({
//                         date: new Date(),
//                         type: 'credit',
//                         amount: referralAmount,
//                         description: 'Referral cashback for referring a user'
//                     });
//                     await referrer.save();
//                 }
//             }
//               // Clear OTP and user data from the session
//               req.session.userOtp = null;
//               req.session.userData = null;
//               req.session.user = newUser._id;
//               assignReferralCodesToUsers();

//               res.json({ success: true, redirectUrl: '/login' });

//           } else {
//               res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
//           }
//       } catch (error) {
//           console.error('Error verifying OTP:', error);
//           res.status(500).json({ success: false, message: 'An error occurred' });
//       }
// };

const postSignup = async (req, res) => {
  try {
      const username = req.body.username.trim();
      const email = req.body.email.trim();
      const number = req.body.number.trim();
      const referredBy = req.body.referredBy.trim(); // Changed from referredBy to something clearer

      const password = req.body.password.trim();
      const confirm_password = req.body.confirm_password.trim();

      // Validate input
      if (!username || !email || !number || !password || !confirm_password) {
          return res.render('signup', { messages: 'All fields are required and cannot be empty or just spaces' });
      }

      const regex = /^[a-zA-Z]+$/;
      if (!regex.test(username)) {
          return res.render('signup', { messages: 'Username should only contain alphabetic characters' });
      }

      if (password !== confirm_password) {
          return res.render('signup', { messages: 'Passwords do not match' });
      }

      let user = await User.findOne({ email });
      if (user) {
          return res.render('signup', { messages: 'Email is already taken, try a new one' });
      }

      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);

      if (!emailSent) {
          return res.json("email-error");
      }

      // Check if the referral offer is active
      const referralOffer = await Referral.findOne();
      if (referralOffer && !referralOffer.isActive) {
          return res.render('signup', { messages: 'Referral offer is currently inactive' });
      }

      // If referral code is provided, check if it's valid
      let referrer = null;
      if (referredBy) {
          referrer = await User.findOne({ referralCode: referredBy });
          if (!referrer) {
              return res.render('signup', { messages: 'Invalid referral code' });
          }
      }

      // Store OTP and user data in session
      req.session.userOtp = otp;
      req.session.userData = { username, email, number, password, referredBy };

      console.log('OTP Sent', otp);
      return res.render('verify-otp');
  } catch (error) {
      console.error('Signup Error', error.message);
      res.status(500).send('Server Error');
  }
};

const verifyOtp = async (req, res) => {
  try {
      const { otp } = req.body;

      if (otp.toString() === req.session.userOtp.toString()) {
          const userData = req.session.userData;
          const passwordHash = await securePassword(userData.password);

          // Create a new user instance and save it to the database
          const newUser = new User({
              username: userData.username,
              email: userData.email,
              referredBy: userData.referredBy,
              number: userData.number,
              password: passwordHash
          });

          await newUser.save();

          // Handle referral cashback
          if (userData.referredBy) {
              const referrer = await User.findOne({ referralCode: userData.referredBy });

              if (referrer ) { // Check if referrer is active
                  const referralAmount = 200; // Define your referral amount
                  referrer.walletBalance += referralAmount; // Credit the referrer
                  referrer.walletTransaction.push({
                      date: new Date(),
                      type: 'credit',
                      amount: referralAmount,
                      description: 'Referral cashback for referring a user'
                  });
                  
                  await referrer.save();
                  console.log(referrer,'ref success')
              }
          }

          // Clear OTP and user data from the session
          req.session.userOtp = null;
          req.session.userData = null;
          req.session.user = newUser._id;
          assignReferralCodesToUsers()
          res.json({ success: true, redirectUrl: '/login' });
      } else {
          res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
      }
  } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
  }
};


const resendOtp = async (req, res) => {
  try {
      // Check if the user is already logged in
      if (req.session.user) {
          return res.status(400).json({ success: false, message: 'You are already logged in' });
      }

      const { email } = req.session.userData;

      if (!email) {
          return res.status(400).json({ success: false, message: 'Email not found in session' });
      }

      const otp = generateOtp();

      req.session.userOtp = otp;

      const emailSent = await sendVerificationEmail(email, otp);
      if (emailSent) {
          console.log('Resend OTP success', otp);
          res.status(200).json({ success: true, message: 'OTP Resent Successfully' });
      } else {
          res.status(500).json({ success: false, message: 'Failed to resend OTP, please try again' });
      }
  } catch (error) {
      console.error('Error resending OTP', error);
      res.status(500).json({ success: false, message: 'Internal Server Error, Please try again' });
  }
};

const getOtpPage=async(req,res)=>{
  try {
 
      if (req.session.user) {
          // User is already logged in, redirect to a different page
          return res.redirect('/');
      }
      res.render('verify-otp');
  } catch (error) {
    console.error(error.message)
  }

}

 const getLogin= (req, res) => {
    try {
      const messages = req.flash('error');
      res.render('login', { messages });
    } catch (error) {
      console.log(error.message);
    }
  }



  
const postLogin = async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'Incorrect Email or Password');
      return res.redirect('/login');
    }

    // Check if the user is blocked
    if (user.is_blocked) {
      req.flash('error', 'Your account has been blocked. Please contact support.');
      return res.redirect('/login');
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      req.flash('error', 'Incorrect Email or Password');
      return res.redirect('/login');
    }

    // Store user identifier in session (e.g., user ID)
  //  req.session.isAuth = user._id; // Store user ID or some unique identifier
    req.session.userId = user._id;
    req.session.email = email;

    // Redirect to home page after successful login
    return res.redirect('/home');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


const getForgotPassword=async(req,res)=>{
  try {
    const messages=req.flash('error')
    console.log('success')
    res.render('forgot-password',{messages})
  } catch (error) {
    console.error(error.message)
  }
}

const postForgotPassword=async(req,res)=>{
  try {
    const email=req.body.email.trim()
    const user=await User.findOne({email})

    if(!user){
      req.flash('error', 'Incorrect Email ');
            console.log('email is not found in db')

     return res.redirect('/forgot-password')
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
        return res.json("email-error");
    }

    req.session.forgotOtp = otp;
    req.session.userData =   email ;

 //  return res.redirect('/verify-otp');
    console.log('OTP Sent', otp);
   // return res.render('forgot-otp')

  return  res.redirect('/forgot-otp')

    
  } catch (error) {
    console.log(error.message)
  }
}

const getForgotPasswordOtp=async(req,res)=>{
  try {
    res.render('forgot-otp')
  } catch (error) {
    console.error(error.message)
  }
}


const requestEmailChangeOtp = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }

    const { newEmail } = req.body;

    if (!newEmail) {
      req.flash('error', 'New email is required.');
      return res.redirect('/profile');
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(newEmail, otp);

    if (!emailSent) {
      req.flash('error', 'Failed to send OTP, please try again.');
      return res.redirect('/profile');
    }

    req.session.emailChangeOtp = otp;
    req.session.newEmail = newEmail;

    return res.render('verify-email-otp');
  } catch (error) {
    console.error('Error requesting email change OTP:', error.message);
    req.flash('error', 'An error occurred, please try again.');
    return res.redirect('/profile');
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp.toString() === req.session.emailChangeOtp.toString()) {
      const user = await User.findById(req.session.userId);

      if (!user) {
        req.flash('error', 'User not found.');
        return res.redirect('/profile');
      }

      user.email = req.session.newEmail;
      await user.save();

      req.session.emailChangeOtp = null;
      req.session.newEmail = null;
 req.flash('error', 'Invalid OTP, please try again.');
      return res.redirect('/verify-email-otp');
      
    } else {
     req.flash('success', 'Email updated successfully!');
      return res.redirect('/profile');
    }
  } catch (error) {
    console.error('Error verifying email OTP:', error.message);
    req.flash('error', 'An error occurred, please try again.');
    return res.redirect('/verify-email-otp');
  }
};

const postForgotPasswordOtp = async (req, res) => {
  try {
    const otp = req.body.otp.trim();

    if (otp.toString() === req.session.forgotOtp.toString()) {
      // Clear the OTP from session after successful validation
      req.session.forgotOtp = null;
      return res.json({ success: true, message: 'OTP verified successfully!', redirectUrl: '/new-password' });
    } else {
      // OTP does not match
      return res.json({ success: false, message: 'Invalid OTP, please try again.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.json({ success: false, message: 'An error occurred while verifying OTP, please try again.' });
  }
};

const getNewPassword=async(req,res)=>{
  try {
    res.render('new-password')
  } catch (error) {
    console.log(error.message)
  }
}

const postNewPassword=async(req,res)=>{
  try {
    const email=req.session.userData

    const password=req.body.password
    const confirm_password=req.body.confirm_password

    if(password==confirm_password){
      const newPasswordHash=await bcrypt.hash(password,10)

      const user=await User.updateOne({email:email},{$set:{password:newPasswordHash}})


      console.log(user,'succesfully create new password')
      return res.redirect('/login')
    }
  } catch (error) {
    console.error(error.message)
  }
}

const resendForgotPasswordOtp = async (req, res) => {
  try {
    const email = req.session.userData;

    if (!email) {
      return res.json({ success: false, message: 'Session expired or invalid, please try again.' });
    }

    const otp = generateOtp();
    req.session.forgotOtp = otp; // Update session with new OTP

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log('Resend OTP success', otp);
      return res.json({ success: true, message: 'OTP has been resent successfully.' });
    } else {
      console.error('Error resending OTP email');
      return res.json({ success: false, message: 'Failed to resend OTP, please try again.' });
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.json({ success: false, message: 'An error occurred while resending OTP, please try again.' });
  }
};


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


const  getLogout= (req, res) => {
    try {
        console.log('user session destryoed')
      req.session.destroy();
      res.redirect('/login');
    } catch (error) {
      console.log(error.message);
    }
  }



const generateReferalCode=async function(){
  return Math.random().toString(36).substring(2,8).toUpperCase()
}

const assignReferralCodesToUsers=async function(){
  const user=await User.find({referralCode:null})

  for(let i=0;i<user.length;i++){
    const code=await generateReferalCode()
    user[i].referralCode=(code)
    await user[i].save()
  }
  console.log("Referral codes assigned to existing users.");

}

const getWallet=async(req,res)=>{
  try {
    const userId=req.session.userId
    const user=await User.findById(userId)
    const order=await Order.find({userId})

    if(!userId){
      return res.redirect('/login')
    }

    res.render('wallet',{
      wallet:user.walletTransaction,
      order

    })

  } catch (error) {
    console.error(error.message)
  }
}









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


module.exports = {
  getHome,
  getSignup,
  postSignup,
  getLogin,
  postLogin,
  getLogout,
  getOtpPage,
  verifyOtp,
  resendOtp,
  getForgotPassword,
  postForgotPassword,
  getForgotPasswordOtp,
  postForgotPasswordOtp,
  getNewPassword,
  postNewPassword,
  resendForgotPasswordOtp,
  productDetails,
  listProducts,
  search,
 // getVerifyEmailOtp,
 // editUserProfile
 requestEmailChangeOtp,
 verifyEmailOtp,
 getWallet
  
};
