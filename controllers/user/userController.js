
// const bcrypt = require('bcrypt');
// const User = require('../models/userModel');
// const nodemailer = require('nodemailer');
// const session = require('express-session');
// const env = require('dotenv').config();
// const Product=require('../models/productModel')

// const getSignup = async (req, res) => {
//     try {
//         res.render('signup', { messages: null });
//     } catch (error) {
//         console.log(error.message);
//         res.redirect('/500');
//     }
// };

// function generateOtp() {
//     return Math.floor(100000 + Math.random() * 900000);
// }

// async function sendVerificationEmail(email, otp) {
//     try {
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             port: 587,
//             secure: false,
//             requireTLS: true,
//             auth: {
//                 user: process.env.NODEMAILER_EMAIL,
//                 pass: process.env.NODEMAILER_PASSWORD
//             }
//         });

//         const info = await transporter.sendMail({
//             from: process.env.NODEMAILER_EMAIL,
//             to: email,
//             subject: "Verify your account",
//             text: `Your OTP is ${otp}`,
//             html: `<b>Your OTP: ${otp}</b>`
//         });

//         return info.accepted.length > 0;
//     } catch (error) {
//         console.error('Error sending email', error);
//         return false;
//     }
// }

// const securePassword = async (password) => {
//     try {
//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     } catch (error) {
//         console.log(error.message);
//     }
// };

// const postSignup = async (req, res) => {
//     try {
//         const username = req.body.username.trim();
//         const email = req.body.email.trim();
//         const number = req.body.number.trim();
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

//         req.session.userOtp = otp;
//         req.session.userData = { username, email, number, password };

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
//       const { otp } = req.body;

//       if (otp.toString() === req.session.userOtp.toString()) {
//           const userData = req.session.userData;
//           const passwordHash = await securePassword(userData.password);

//           // Create a new user instance and save it to the database
//           const newUser = new User({
//               username: userData.username,
//               email: userData.email,
//               number: userData.number,
//               password: passwordHash
//           });

//           await newUser.save();

//           // Clear OTP and user data from the session
//           req.session.userOtp = null;
//           req.session.userData = null;
//           req.session.user = newUser._id;
// //return res.render('login')
//           res.json({ success: true, redirectUrl: '/login' });
//       } else {
//           res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
//       }
//   } catch (error) {
//       console.error('Error verifying OTP:', error);
//       res.status(500).json({ success: false, message: 'An error occurred' });
//   }
// };

// const resendOtp = async (req, res) => {
//   try {
//       // Check if the user is already logged in
//       if (req.session.user) {
//           return res.status(400).json({ success: false, message: 'You are already logged in' });
//       }

//       const { email } = req.session.userData;

//       if (!email) {
//           return res.status(400).json({ success: false, message: 'Email not found in session' });
//       }

//       const otp = generateOtp();

//       req.session.userOtp = otp;

//       const emailSent = await sendVerificationEmail(email, otp);
//       if (emailSent) {
//           console.log('Resend OTP success', otp);
//           res.status(200).json({ success: true, message: 'OTP Resent Successfully' });
//       } else {
//           res.status(500).json({ success: false, message: 'Failed to resend OTP, please try again' });
//       }
//   } catch (error) {
//       console.error('Error resending OTP', error);
//       res.status(500).json({ success: false, message: 'Internal Server Error, Please try again' });
//   }
// };

// const getOtpPage=async(req,res)=>{
//   try {
 
//       if (req.session.user) {
//           // User is already logged in, redirect to a different page
//           return res.redirect('/');
//       }
//       res.render('verify-otp');
//   } catch (error) {
//     console.error(error.message)
//   }

// }

//  const getLogin= (req, res) => {
//     try {
//       const messages = req.flash('error');
//       res.render('login', { messages });
//     } catch (error) {
//       console.log(error.message);
//     }
//   }

// const postLogin = async (req, res) => {
//   try {
//     const email = req.body.email.trim();
//     const password = req.body.password.trim();

//     // Find the user who is not blocked
//     const user = await User.findOne({ email, is_blocked: false });

//     if (!user) {
//       req.flash('error', 'Incorrect Email or Password');
//       return res.redirect('/login');
//     }

//     // Compare the provided password with the stored hashed password
//     const isPasswordMatch = await bcrypt.compare(password, user.password);

//     if (!isPasswordMatch) {
//       req.flash('error', 'Incorrect Email or Password');
//       return res.redirect('/login');
//     }

//     // Store user identifier in session (e.g., user ID)
//     req.session.isAuth = user._id; // Store user ID or some unique identifier
//     console.log(req.session.isAuth);
//   //  const userData = await Product.find({is_blocked:false});
    
//     // const products = await Product.find({ is_blocked: false })
//     // .populate({
//     //     path: 'categoryId',
//     //     match: { isListed: true }, // Only include products where the category is not blocked
//     // })
//     // .exec();

// //   // Filter out products where the category is blocked (null after population)
// //   const filteredProducts = products.filter(product => product.categoryId !== null);

// //   if (filteredProducts.length > 0) {
// //       res.render('home', { products: filteredProducts });
// //   } else {
// //       res.write('No products available');
// //       res.end();
// //  }
//   //   Redirect to home page after successful login
//   return res.redirect('/home');
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server Error');
//   }
// };



// const getHome = async (req, res) => {
//     try {
//         // Fetch products that are not blocked and whose category is not blocked
//         const products = await Product.find({ is_blocked: false })
//           .populate({
//               path: 'categoryId',
//               match: { isListed: true }, // Only include products where the category is not blocked
//           })
//           .exec();
  
//         // Filter out products where the category is blocked (null after population)
//         const filteredProducts = products.filter(product => product.categoryId !== null);
  
//         if (filteredProducts.length > 0) {
//             res.render('home', { products: filteredProducts });
//         } else {
//             res.write('No products available');
//             res.end();
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.redirect('/500');
//     }
//   };
  

// const  getLogout= (req, res) => {
//     try {
//         console.log('user session destryoed')
//       req.session.destroy();
//       res.redirect('/login');
//     } catch (error) {
//       console.log(error.message);
//     }
//   }

// //   const productDetails = async (req, res) => {
// //     try {
// //         // const { id } = req.params.id;

// //         // // Fetch product details
// //         // const product = await Product.findById(id).populate('categoryId').exec();

// //         // if (!product) {
// //         //     return res.status(404).render('error', { message: 'Product not found' });
// //         // }

// //         // // Check if the product's category is blocked
// //         // if (product.categoryId.isBlocked) {
// //         //     return res.status(404).render('error', { message: 'Product is from a blocked category' });
// //         // }

// //         // // Fetch related products
// //         // const relatedProducts = await fetchRelatedProducts(product.categoryId._id);

// //         // // Render the product details page
// //         // res.render('product-details', {
// //         //    // product,
// //         //   //  relatedProducts
// //         // });

// //         const productId = req.params.id;
// //         console.log(productId)

// //         if (!productId) {
// //             return res.status(400).send('Invalid product ID');
// //         }
// //         const productData = await Products.find({ is_deleted: false });
// //         const product = await Products.findOne({ _id: productId });

// //         if (!product) {
// //             return res.status(404).send('Product not found');
// //         }

// //         // Fetch related products if needed
// //         const relatedProducts = await Products.find({ 
// //             categoryId: product.categoryId, 
// //             _id: { $ne: productId }, 
// //             is_deleted: false 
// //         }).limit(4);

// //         res.render('product-details');
// //      //   res.render('product-details')

// //     } catch (error) {
// //         console.error(error.message);
// //         res.status(500).render('error', { message: 'An error occurred while fetching product details' });
// //     }
// // // };

// // const productDetails = async (req, res) => {
// //     try {
// //         const product = await Product.findById(req.params.id).populate('categoryId');
// //         if (!product) {
// //             return res.status(404).render('error', { message: 'Product not found' });
// //         }
        
// //         // Fetch related products
// //         const relatedProducts = await Product.find({ categoryId: product.categoryId }).limit(4);
        
// //         res.render('product-details', {
// //             product,
// //             relatedProducts
// //         });
// //     } catch (error) {
// //         console.log(error.message);
// //         res.status(500).render('error', { message: 'An error occurred' });
// //     }
// // };

// const productDetails = async (req, res) => {
//     try {
//         // Find the product by ID
//         const product = await Product.findById(req.params.id);

//         // If the product is not found, return a 404 error page or message
//         if (!product) {
//             return res.status(404).render('error', { message: 'Product not found' });
//         }

//         // Fetch related products (e.g., products from the same category)
//         const relatedProducts = await Product.find({ categoryId: product.categoryId }).limit(4);

//         // Ensure reviews is always an array
//         product.reviews = product.reviews || [];

//         // Render the product details page with the product and related products
//         res.render('product-details', {
//             product,
//             relatedProducts
//         });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).render('error', { message: 'An error occurred' });
//     }
// };


//   module.exports={
//     getHome,
//     getSignup,
//     postSignup,
//     getLogin,
//     postLogin,
//     getLogout,
//     getOtpPage,
//     verifyOtp,
//     resendOtp,
//     productDetails

//   }

// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../../models/userModel');
const nodemailer = require('nodemailer');
const Product = require('../../models/productModel');

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
  // Implementation remains the same
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
  
      // Find the user who is not blocked
      const user = await User.findOne({ email, is_blocked: false });
  
      if (!user) {
        req.flash('error', 'Incorrect Email or Password');
        return res.redirect('/login');
      }
  
      // Compare the provided password with the stored hashed password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!isPasswordMatch) {
        req.flash('error', 'Incorrect Email or Password');
        return res.redirect('/login');
      }
  
      // Store user identifier in session (e.g., user ID)
      req.session.isAuth = user._id; // Store user ID or some unique identifier
      req.session.userId=user._id
      req.session.email=email
  
      // Redirect to home page after successful login
      return res.redirect('/home');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  };
  
  
  

const getHome = async (req, res) => {
  try {
    // Fetch all products, including blocked ones
    const products = await Product.find({is_blocked:false});

    // Render the home page with all products
    res.render('home', { products });
  } catch (error) {
    console.log(error.message);
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


const productDetails = async (req, res) => {
  try {
    // Find the product by ID
    const product = await Product.findById(req.params.id);

    // If the product is not found, return a 404 error page or message
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }

    // Fetch related products (e.g., products from the same category)
    const relatedProducts = await Product.find({ categoryId: product.categoryId }).limit(4);

    // Ensure reviews is always an array
    product.reviews = product.reviews || [];

    // Render the product details page with the product and related products
    res.render('product-details', {
      product,
      relatedProducts
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).render('error', { message: 'An error occurred' });
  }
};


// const getProfile=async(req,res)=>{
//   try {
//     res.render('user-profile')
//   } catch (error) {
//     console.log(error.message)
//     res.status(500).render('error', { message: 'An error occurred' });
//   }
// }



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
  productDetails,
  //getProfile
};
