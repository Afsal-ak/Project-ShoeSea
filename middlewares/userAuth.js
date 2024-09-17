// const express=require('express')
// const session=require('express-session')

// const User = require('../models/userModel');
// /*
// const isLogin=(req,res,next)=>{
//     if(req.session.isAuth &&req.session){
  
//     }
//     else{
//        return res.redirect('/')
//     }
//   next()
// }
// */

// const isLogin = (req, res, next) => {
//   if ( req.session.isAuth) {
//     console.log('user session true')
//       next(); // User is authenticated, proceed to the next middleware
      
//   } else {
// console.log('user session end')
//       res.redirect('/login'); // Session has expired or user is not authenticated, redirect to login page
//       console.log('expired or not authenticated')
//   }
// };




// const isLogout=(req,res,next)=>{
//     if(req.session.isAuth){
//       console.log('user session logout')
//       return  res.redirect('/home') 
      
//     }
//    next()
// }


// // // Middleware to check if the user is blocked
// // const checkUserStatus = async (req, res, next) => {
// //     if (!req.session.isAuth) {
// //       console.log('No session found, redirecting to login')
// //         return res.redirect('/login'); // Redirect if not authenticated
// //     }

// //     try {
// //         const user = await User.findOne({ email: req.session.isAuth });

// //         if (!user || user.is_blocked) {
// //           console.log('User not found, redirecting to login');
// //             req.session.destroy(); // Destroy session if user is blocked
// //             return res.redirect('/login'); // Redirect to login page
// //         }

// //         // Proceed to the next middleware/route if user is not blocked
// //         next();
// //     } catch (error) {
// //         console.error('Error checking user status:', error);
// //         res.status(500).send('Server Error');
// //     }
// // };
// // const checkUserStatus = async (req, res, next) => {
// //   if (!req.session.isAuth) {
// //       console.log('No session found, redirecting to login');
// //       return res.redirect('/login');
// //   }

// //   try {
// //       const user = await User.findOne({ email });
// //       if (!user) {
// //           console.log('User not found, redirecting to login');
// //           return res.redirect('/login');
// //       }

// //       if (user.is_blocked) {
// //           console.log('User is blocked, destroying session and redirecting to login');
// //           req.session.destroy(err => {
// //               if (err) {
// //                   console.error('Error destroying session:', err.message);
// //               }
// //               return res.redirect('/login');
// //           });
// //       } else {
// //           // Proceed if the user is not blocked
// //           next();
// //       }
// //   } catch (error) {
// //       console.error('Error checking user status:', error.message);
// //       res.status(500).send('Server Error');
// //   }
// // };
// const checkUserStatus = async (req, res, next) => {
//     if (!req.session.isAuth) {
//         console.log('No session found, redirecting to login');
//         return res.redirect('/login');
//     }
  
//     try {
//         const user = await User.findOne({ _id: req.session.isAuth });
//         if (!user) {
//             console.log('User not found, redirecting to login');
//             return res.redirect('/login');
//         }
  
//         if (user.is_blocked) {
//             console.log('User is blocked, destroying session and redirecting to login');
//             req.session.destroy(err => {
//                 if (err) {
//                     console.error('Error destroying session:', err.message);
//                 }
//                 return res.redirect('/login');
//             });
//         } else {
//             next(); // Proceed if the user is not blocked
//         }
//     } catch (error) {
//         console.error('Error checking user status:', error.message);
//         res.status(500).send('Server Error');
//     }
//   };
  

// module.exports={
//     isLogin,
//     isLogout,
//     checkUserStatus

// }

// middlewares/userAuth.js
const User = require('../models/userModel');

const isLogin = (req, res, next) => {
  if (req.session.userId) {
    console.log('User session is true');
    next();
  } else {
    console.log('User session has ended');
    res.redirect('/login');
  }
};

const isLogout = (req, res, next) => {
  if (req.session.userId) {
    console.log('User is logged in, redirecting to home');
    return res.redirect('/home');
  }
  next();
};

const checkUserStatus = async (req, res, next) => {
  if (!req.session.isAuth) {
    console.log('No session found, redirecting to login');
    return res.redirect('/login');
  }

  try {
    const user = await User.findOne({ _id: req.session.isAuth });
    if (!user) {
      console.log('User not found, redirecting to login');
      return res.redirect('/login');
    }

    if (user.is_blocked) {
      console.log('User is blocked, destroying session and redirecting to login');
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err.message);
        }
        return res.redirect('/login');
      });
    } else {
      next(); // Proceed if the user is not blocked
    }
  } catch (error) {
    console.error('Error checking user status:', error.message);
    res.status(500).send('Server Error');
  }
};


const userMiddleware = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        res.locals.user = user;
      } else {
        res.locals.user = null;
      }
    } catch (error) {
      console.error('Error fetching user:', error.message);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};


module.exports = {
  isLogin,
  isLogout,
  checkUserStatus,
  userMiddleware
};