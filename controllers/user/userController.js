

// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../../models/userModel');
const nodemailer = require('nodemailer');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel'); // Assuming you have a category model


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
  
const postSignup = async (req, res) => {
    try {
        const username = req.body.username.trim();
        const email = req.body.email.trim();
        const number = req.body.number.trim();
        const password = req.body.password.trim();
        const confirm_password = req.body.confirm_password.trim();

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

        req.session.userOtp = otp;
        req.session.userData = { username, email, number, password };

     //  return res.redirect('/verify-otp');
        console.log('OTP Sent', otp);
        return res.render('verify-otp')
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
                  number: userData.number,
                  password: passwordHash
              });
    
              await newUser.save();
    
              // Clear OTP and user data from the session
              req.session.userOtp = null;
              req.session.userData = null;
              req.session.user = newUser._id;
    //return res.render('login')
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

// const editUserProfile=async(req,res)=>{
//   try {
//     const userId=req.session.userId
//     const { username, email, number } = req.body;

//     const user=await User.findById(userId)
//     if (!user) {
//       req.flash('error_msg', 'User not found');
//       return res.redirect('/profile');

//     }
//         // Check if the email is already in use by another user
//         const emailInUse = await User.findOne({ email, _id: { $ne: userId } });
//         if (emailInUse) {
//             req.flash('error_msg', 'Email is already in use');
//             return res.redirect('/profile');
//         }

       
//     const otp = generateOtp();
//     const emailSent = await sendVerificationEmail(email, otp);

//     if (!emailSent) {
//         return res.json("email-error");
//     }

//     req.session.emailOtp = otp;
//     req.session.userData =   email ;

//     console.log('OTP Sent', otp);


//     //return  res.redirect('/verify-email-otp')
  
//          // If email is not changed, directly update the profile
//          user.username = username;
//          user.email = email;
//          user.number = number;
//          await user.save();
//  res.redirect('/profile')
//   } catch (error) {
//     console.log(error.message)
//   }
// }

// const getVerifyEmailOtp=async(req,res)=>{
//   try {
//     res.render('verify-email')
//   } catch (error) {
//     console.error(error.message)
//   }
// }

// const postForgotPasswordOtp=async(req,res)=>{
//   try {
//     const otp=req.body.otp.trim()
//     console.log((otp))
//     if(otp.toString()==req.session.forgotOtp.toString()){
//       res.redirect('/new-password')
//     }
//     else {
//       res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
//   }
  
//   } catch (error) {
//     console.error(error.message)
//   }
// }
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

// const getForgotPassword = async (req, res) => {
//   try {
//     const messages = req.flash('error');
//     res.render('forgot-password', { messages });
//   } catch (error) {
//     console.error('Error rendering forgot password page:', error.message);
//   }
// };

// const postForgotPassword = async (req, res) => {
//   try {
//     const email = req.body.email.trim();
//     const user = await User.findOne({ email });

//     if (!user) {
//       req.flash('error', 'Incorrect Email');
//       return res.redirect('/forgot-password');
//     }

//     const otp = generateOtp();
//     const emailSent = await sendVerificationEmail(email, otp);

//     if (!emailSent) {
//       return res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
//     }

//     req.session.forgotOtp = otp;
//     req.session.userData = email;

//     console.log('OTP Sent', otp);
//     return res.redirect('/forgot-otp');

//   } catch (error) {
//     console.error('Error processing forgot password request:', error.message);
//   }
// };

// const getForgotPasswordOtp = async (req, res) => {
//   try {
//     res.render('forgot-otp');
//   } catch (error) {
//     console.error('Error rendering OTP page:', error.message);
//   }
// };

// const postForgotPasswordOtp = async (req, res) => {
//   try {
//     const otp = req.body.otp.trim();

//     if (otp === req.session.forgotOtp) {
//       req.session.forgotOtp = null; // Clear OTP from session
//       return res.json({ success: true, message: 'OTP verified successfully!', redirectUrl: '/new-password' });
//     } else {
//       return res.json({ success: false, message: 'Invalid OTP, please try again.' });
//     }
//   } catch (error) {
//     console.error('Error verifying OTP:', error.message);
//     return res.json({ success: false, message: 'An error occurred while verifying OTP, please try again.' });
//   }
// };

// const getNewPassword = async (req, res) => {
//   try {
//     res.render('new-password');
//   } catch (error) {
//     console.error('Error rendering new password page:', error.message);
//   }
// };

// const postNewPassword = async (req, res) => {
//   try {
//     const email = req.session.userData;
//     const password = req.body.password;
//     const confirm_password = req.body.confirm_password;

//     if (password !== confirm_password) {
//       return res.json({ success: false, message: 'Passwords do not match. Please try again.' });
//     }

//     const newPasswordHash = await bcrypt.hash(password, 10);
//     const result = await User.updateOne({ email }, { $set: { password: newPasswordHash } });

//     if (result.nModified > 0) {
//       console.log('Password updated successfully');
//       return res.redirect('/login');
//     } else {
//       return res.json({ success: false, message: 'Failed to update password. Please try again.' });
//     }
//   } catch (error) {
//     console.error('Error updating password:', error.message);
//   }
// };

// const resendForgotPasswordOtp = async (req, res) => {
//   try {
//     const email = req.session.userData;

//     if (!email) {
//       return res.json({ success: false, message: 'Session expired or invalid, please try again.' });
//     }

//     const otp = generateOtp();
//     req.session.forgotOtp = otp;

//     const emailSent = await sendVerificationEmail(email, otp);
//     if (emailSent) {
//       console.log('Resend OTP success', otp);
//       return res.json({ success: true, message: 'OTP has been resent successfully.' });
//     } else {
//       console.error('Error resending OTP email');
//       return res.json({ success: false, message: 'Failed to resend OTP, please try again.' });
//     }
//   } catch (error) {
//     console.error('Error resending OTP:', error.message);
//     return res.json({ success: false, message: 'An error occurred while resending OTP, please try again.' });
//   }
// };


// const getHome = async (req, res) => {
//   try {
//     // Fetch all products, including blocked ones
//     const products = await Product.find({is_blocked:false});

//     // Render the home page with all products
//     res.render('home', { products });
//   } catch (error) {
//     console.log(error.message);
//     res.redirect('/500');
//   }
// };

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


// const productDetails = async (req, res) => {
//   try {
//     // Find the product by ID
//     const product = await Product.findById(req.params.id);

//     // If the product is not found, return a 404 error page or message
//     if (!product) {
//       return res.status(404).render('error', { message: 'Product not found' });
//     }

//     // Fetch related products (e.g., products from the same category)
//     const relatedProducts = await Product.find({ categoryId: product.categoryId }).limit(4);

//     // Ensure reviews is always an array
//     product.reviews = product.reviews || [];

//     // Render the product details page with the product and related products
//     res.render('product-details', {
//       product,
//       relatedProducts
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).render('error', { message: 'An error occurred' });
//   }
// };
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
    product.reviews = product.reviews || [];

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



// const listProducts = async (req, res) => {
//     try {
//         const itemsPerPage = 10; // Number of items per page
//         const page = parseInt(req.query.page) || 1; // Current page number
//         const sortOption = req.query.sort || 'popularity'; // Default sort option

//         // Collect filter options from the query parameters
//         const category = req.query.category || null;
//         const minPrice = parseFloat(req.query.minPrice) || null;
//         const maxPrice = parseFloat(req.query.maxPrice) || null;
//         const brand = req.query.brand || null;

//         // Build the filter query based on user input
//         let filterQuery = { is_blocked: false };

//         if (category) {
//             filterQuery.categoryId = category;
//         }

//         if (brand) {
//             filterQuery.brand = brand;
//         }

//         if (minPrice !== null && maxPrice !== null) {
//             filterQuery.salePrice = { $gte: minPrice, $lte: maxPrice };
//         } else if (minPrice !== null) {
//             filterQuery.salePrice = { $gte: minPrice };
//         } else if (maxPrice !== null) {
//             filterQuery.salePrice = { $lte: maxPrice };
//         }

//         // Map sort options to mongoose sort queries
//         let sortQuery = {};
//         switch (sortOption) {
//             case 'popularity':
//                 sortQuery = { views: -1 };
//                 break;
//             case 'price_low_to_high':
//                 sortQuery = { salePrice: 1 };
//                 break;
//             case 'price_high_to_low':
//                 sortQuery = { salePrice: -1 };
//                 break;
//             case 'average_rating':
//                 sortQuery = { averageRating: -1 };
//                 break;
//             case 'featured':
//                 sortQuery = { isFeatured: -1 };
//                 break;
//             case 'new_arrivals':
//                 sortQuery = { createdAt: -1 };
//                 break;
//             case 'a_to_z':
//                 sortQuery = { productName: 1 };
//                 break;
//             case 'z_to_a':
//                 sortQuery = { productName: -1 };
//                 break;
//             default:
//                 sortQuery = { views: -1 }; // Default to popularity if no match
//         }

//         const totalProducts = await Product.countDocuments(filterQuery);
//         const totalPages = Math.ceil(totalProducts / itemsPerPage);

//         const products = await Product.find(filterQuery)
//             .sort(sortQuery)
//             .skip((page - 1) * itemsPerPage)
//             .limit(itemsPerPage);

//         res.render('product-list', {
//             products,
//             currentPage: page,
//             totalPages,
//             sortOption,
//             category,
//             minPrice,
//             maxPrice,
//             brand
//         });
//     } catch (error) {
//         console.error('Error listing products:', error);
//         res.redirect('/500'); // Handle error appropriately
//     }
// };

// //old org
// const listProducts = async (req, res) => {
//   try {
//     const { sort, category, page = 1 } = req.query; // Fetch page number from query, default to 1
//     const limit = 12; // Number of products per page
//     const skip = (page - 1) * limit; // Calculate the number of products to skip

//     // Build query based on filters
//     let query = { is_blocked: false };
//     if (category) {
//       query.categoryId = category;
//     }

//     // Fetch products based on filters and sort options, with pagination
//     const products = await Product.find(query)
//       .sort(getSortOption(sort))
//       .skip(skip)
//       .limit(limit);

//     // Fetch all categories for filter dropdown
//     const categories = await Category.find();

//     // Fetch total count of products for pagination
//     const totalProducts = await Product.countDocuments(query);
//     const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages

//     // Pass data to the EJS template
//     res.render('product-list', {
//       products,
//       categories,
//       sortOption: sort,
//       selectedCategory: category,
//       currentPage: parseInt(page), // Pass the current page to EJS
//       totalPages, // Pass the total number of pages to EJS
//     });
//   } catch (error) {
//     console.error('Error fetching products:', error.message);
//     res.status(500).render('error', { message: 'An error occurred' });
//   }
// };

// // Helper function to return sorting option
// function getSortOption(sort) {
//   switch (sort) {
//     case 'price_low_to_high':
//       return { salePrice: 1 };
//     case 'price_high_to_low':
//       return { salePrice: -1 };
//     case 'average_rating':
//       return { averageRating: -1 };
//     case 'new_arrivals':
//       return { createdAt: -1 };
//     case 'a_to_z':
//       return { productName: 1 };
//     case 'z_to_a':
//       return { productName: -1 };
//     default:
//       return { popularity: -1 };
//   }
// }

// const listProducts = async (req, res) => {
//   try {
//     // Extract sort, category, brand, page, and search query from the request
//     const { sort, category, brand, page = 1, search = '' } = req.query;
//     const limit = 12; // Number of products per page
//     const skip = (page - 1) * limit; // Calculate the number of products to skip for pagination

//     // Build the query object to filter products
//     let query = { is_blocked: false };

//     // Apply category filter if provided
//     if (category) {
//       query.categoryId = category;
//     }

//     // Apply brand filter if provided
//     if (brand) {
//       query.brand = brand;
//     }

//     // Apply search filter if a search term is provided
//     if (search) {
//       query.$or = [
//         { productName: { $regex: search, $options: 'i' } }, // Search in productName (case-insensitive)
//         { description: { $regex: search, $options: 'i' } }, // Search in description (case-insensitive)
//         { brand: { $regex: search, $options: 'i' } }, // Search in brand (case-insensitive)
//         // Add more fields if needed, e.g., category names (if stored in product)
//       ];
//     }

//     // Fetch products based on filters, sort options, and pagination
//     const products = await Product.find(query)
//       .sort(getSortOption(sort))
//       .skip(skip)
//       .limit(limit);

//     // Fetch all categories and brands for filter dropdowns
//     const categories = await Category.find({isListed:true});
//     const brands = await Product.distinct('brand'); // Fetch distinct brand names

//     // Fetch the total count of products for pagination
//     const totalProducts = await Product.countDocuments(query);
//     const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages needed

//     // Render the product list page with the fetched data
//     res.render('product-list', {
//       products,
//       categories,
//       brands, // Pass the brands to EJS
//       sortOption: sort,
//       selectedCategory: category,
//       selectedBrand: brand, // Pass the selected brand to EJS
//       searchQuery: search, // Pass the search query to EJS
//       currentPage: parseInt(page),
//       totalPages,
//     });
//   } catch (error) {
//     console.error('Error fetching products:', error.message);
//     res.status(500).render('error', { message: 'An error occurred while fetching products.' });
//   }
// };

// // Helper function to return sorting option based on user selection
// function getSortOption(sort) {
//   switch (sort) {
//     case 'price_low_to_high':
//       return { salePrice: 1 };
//     case 'price_high_to_low':
//       return { salePrice: -1 };
//     case 'average_rating':
//       return { averageRating: -1 };
//     case 'new_arrivals':
//       return { createdAt: -1 };
//     case 'a_to_z':
//       return { productName: 1 };
//     case 'z_to_a':
//       return { productName: -1 };
//     case 'featured':
//       return { isFeatured: -1 }; // Assuming there's a field for featured products
//     default:
//       return { popularity: -1 }; // Default sort by popularity
//   }
// }
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
 verifyEmailOtp
  
};
