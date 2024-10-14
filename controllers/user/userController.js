

// controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../../models/userModel');
const nodemailer = require('nodemailer');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel'); // Assuming you have a category model
const Order = require('../../models/orderModel');
const Referral=require('../../models/referralModel');
const referralModel = require('../../models/referralModel');


const getSignup = async (req, res) => {
  try {
    let code = req.query.referralCode || ''; // Extract referral code from query params

    console.log("Referral Code:", code); // Log referral code for debugging

    res.render('signup', { 
        code ,
      messages: req.flash('messages'), // This should handle flash messages
    // Passing the referral code to the view
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/500'); // Redirecting to error page if something goes wrong
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
      const referredBy = req.body.referredBy || ''; 

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
      
      // Proceed even if referral offer is inactive or doesn't exist
      if (referredBy) {
          // If referral code is provided, check if it's valid
          const referrer = await User.findOne({ referralCode: referredBy });
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

      // Fetch the active referral offer (if available)
      const referralOffer = await Referral.findOne({ isActive: true });

      // If there's no active referral offer, set referralAmount to 0
      const referralAmount = referralOffer ? referralOffer.referralAmount : 0;

      // Check if the OTP matches
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

          // Handle referral cashback for referrer
          if (userData.referredBy) {
              const referrer = await User.findOne({ referralCode: userData.referredBy });

              if (referrer && referralAmount > 0) { 
                  // Credit the referrer with the referral amount if applicable
                  referrer.walletBalance += referralAmount; 
                  referrer.walletTransaction.push({
                      date: new Date(),
                      type: 'credit',
                      amount: referralAmount,
                      description: 'Referral cashback for referring a user'
                  });

                  await referrer.save();
                  console.log(referrer, 'Referral cashback credited to referrer');
              }
          }

          // Clear OTP and user data from the session
          req.session.userOtp = null;
          req.session.userData = null;
          req.session.user = newUser._id;
          req.session.userId = newUser._id;

          assignReferralCodesToUsers(); // Assuming this generates referral codes for the new user

          // Redirect to home page after successful login
          res.json({ success: true, redirectUrl: '/home' });
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



const postLogin = async (req, res,next) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      req.flash('error', 'Incorrect Email or Password');
      return res.redirect('/login');
    }
    // If the user is an OAuth user, bypass password check
    if (user.authType === 'google') {
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
    next(error)
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


const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  // Set the response status code (default to 500 for server errors)
  const statusCode = err.status || 500;

  // Render the error page
  res.status(statusCode).render('error', {
      message: 'Internal Server Error',
      statusCode
  });
};

module.exports = {
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
 requestEmailChangeOtp,
 verifyEmailOtp,
 getWallet,
 assignReferralCodesToUsers,
 errorHandler
};
