

// middlewares/userAuth.js
const User = require('../models/userModel');

const isLogin = (req, res, next) => {
  if (req.session.userId) {
    console.log('User session is true');
    console.log(req.session.userId)

    next();
  } else {
    console.log('User session has ended');
    res.redirect('/login');
  }
};

const isLogout = (req, res, next) => {
  if (req.session.userId) {
    console.log('User is logged in, redirecting to home');
    console.log(req.session.userId)
    return res.redirect('/home');

  }
  next();
};

// const checkUserStatus = async (req, res, next) => {
//   try {
//     // Find user by ID from session
//     const user = await User.findOne({ _id: req.session.userId });
  
//     // Check if user is not found
//     if (!user) {
//       console.log('User not found, redirecting to login');
//       return res.redirect('/login'); // Or handle it another way
//     }

//     // Check if the user is blocked
//     if (user.is_blocked === true) {
//       console.log('User is blocked, destroying session and redirecting to login');
//       req.session.destroy((err) => {
//         if (err) {
//           console.error('Error destroying session:', err.message);
//         }
//         return res.redirect('/login');
//       });
//     } else {
//       next(); // Proceed if the user is not blocked
//     }
//   } catch (error) {
//     console.error('Error checking user status:', error.message);
//     res.status(500).send('Server Error');
//   }
// };

const checkUserStatus = async (req, res, next) => {
  // Check if the user is logged in
  if (!req.session.userId) {
    return next(); // If not logged in, allow access to public routes
  }

  try {
    const user = await User.findOne({ _id: req.session.userId });

    if (!user) {
      // If user is not found, redirect to login
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