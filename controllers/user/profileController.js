
const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const bcrypt=require('bcryptjs')
const nodemailer = require('nodemailer');
const getAccount=async(req,res)=>{
    try {
        res.render('account')
    } catch (error) {
        console.error(error.message)
    }
}

// Render the address form page
const getAddressForm = async (req, res) => {
    try {
        res.render('address-form');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

// Render user profile page with addresses
const getUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId; 
        const user = await User.findById(userId);
        const addresses = await Address.find({ userId });
        if (!userId) {
            return res.status(400).send('User ID is not set in session.');
        }
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('user-profile', {
             user,
             addresses,
          });
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).send('Server Error');
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
  
  
const editProfile = async (req, res) => {
    try {
        const { username, email, number } = req.body;
        const userId = req.session.userId; // Assume user ID is stored in session
  
        if (!userId) {
            req.flash('error_msg', 'Unauthorized');
            return res.redirect('/logout');
        }
  
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/profile');
        }

        // Check if the email is already in use by another user
        const emailInUse = await User.findOne({ email, _id: { $ne: userId } });
        if (emailInUse) {
            req.flash('error_msg', 'Email is already in use');
            return res.redirect('/profile');
        }

        
        // If email is changed, send verification OTP
        if (email !== user.email) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            console.log(otp)
            if (!emailSent) {
                req.flash('error_msg', 'Failed to send verification email. Please try again.');
                return res.redirect('/profile');
            }

            // Store updated profile details and OTP in session
            req.session.tempProfile = { username, email, number };
            req.session.emailOtp = otp;

            // Redirect to OTP verification page
            return res.redirect('/verify-email-otp');
         // return res.render('verify-email')
        }

        // If email is not changed, directly update the profile
        user.username = username;
        user.email = email;
        user.number = number;
        await user.save();

        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/profile');
    }
};
const getVerifyEmailOtpPage=async(req,res)=>{
    try {
      return  res.render('verify-email')
    } catch (error) {
        console.log(error.message)
    }
}
// Function to verify OTP and update email
const verifyEmailOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionOtp = req.session.emailOtp;
        const userId = req.session.userId;

        if (!sessionOtp || otp.toString() !== sessionOtp.toString()) {
            req.flash('error_msg', 'Invalid OTP. Please try again.');
            return res.redirect('/verify-email-otp',);
        }

        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/profile');
        }

        // Update the user's email and other details
        const { username, email, number } = req.session.tempProfile;
        user.username = username;
        user.email = email;
        user.number = number;
        await user.save();

        // Update session with the new email
       // req.session.email = email;

        // Clear session data
        req.session.tempProfile = null;
        req.session.emailOtp = null;

        req.flash('success_msg', 'Email verified and profile updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error verifying OTP:', error);
        req.flash('error_msg', 'Server error');
        res.redirect('/verify-email-otp');
    }
};


  const resendEmailOtp = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Retrieve the email from the session's tempProfile
        const email = req.session.tempProfile?.email;
        
        if (!userId || !email) {
            return res.json({ success: false, message: 'Session expired or invalid, please try again.' });
        }
        
        const otp = generateOtp();
        req.session.emailOtp = otp; // Update session with new OTP
        
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


const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.userId; // Assume user ID is stored in session
  
      if (!userId) {
        req.flash('error_msg', 'Unauthorized');
        return res.redirect('/profile');
      }
  
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/profile');
      }
  
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        req.flash('error_msg', 'Current password is incorrect');
        return res.redirect('/profile');
      }
  
      if (newPassword !== confirmPassword) {
        req.flash('error_msg', 'New passwords do not match');
        return res.redirect('/profile');
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
  
      req.flash('success_msg', 'Password updated successfully');
      res.redirect('/profile');
    } catch (error) {
      console.error('Error changing password:', error);
      req.flash('error_msg', 'Server error');
      res.redirect('/profile');
    }
  };
  
 const getAddress=async(req,res)=>{

    try {
        const userId = req.session.userId; 
        const user = await User.findById(userId);
        const addresses = await Address.find({ userId });
        if (!userId) {
            return res.redirect('/login')
        }
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('address',{addresses})


    } catch (error) {
        console.error(error.message)
    }

 }

const addAddress = async (req, res) => {
    try {
        const userId = req.session.userId; // Assuming the user ID is stored in the session after login
        const { fname, lname, country, housename, city, state, pincode, phone } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const newAddress = new Address({
            userId,
            fname,
            lname,
            country,
            housename,
            city,
            state,
            pincode,
            phone,
        });

        await newAddress.save();
        console.log(newAddress);

        res.redirect('/address'); // Redirect to a relevant page after saving the address
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).send('Server Error');
    }
};


const getEditAddressForm = async (req, res) => {
    try {
        const addressId = req.params.id;
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).send('Address not found');
        }

        res.render('edit-address', { address });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        res.status(500).send('Server Error');
    }
};

const updateAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const { fname, lname, country, housename, city, state, pincode, phone } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { fname, lname, country, housename, city, state, pincode, phone },
            { new: true }  // Return the updated document
        );

        if (!updatedAddress) {
            return res.status(404).send('Address not found');
        }

        console.log('Address updated:', updatedAddress);

        res.redirect('/address');  // Redirect to a relevant page after updating the address
    } catch (error) {
        console.error('Error updating address:', error.message);
        res.status(500).render('edit-address', { message: 'An error occurred while updating your address. Please try again.', address: req.body });
    }
};

const deleteAddress=async(req,res)=>{
    try {
        const addressId=req.params.id

        const deletedAddress=await Address.findByIdAndDelete(addressId) 

        if (!deletedAddress) {
            return res.status(404).send('Address not found');
        }

        console.log('Address deleted:', deletedAddress);

        // Redirect to a relevant page after deletion
        res.redirect('/address')

    } catch (error) {
        console.error('Error delteing address:', error.message);
        res.status(500).render('edit-address', { message: 'An error occurred while deleting your address. Please try again.', address: req.body });
    }
}

module.exports = {
    getAccount,
    getAddress,
    getAddressForm,
    addAddress,
    getEditAddressForm,
    updateAddress,
    deleteAddress,
    getUserProfile,
    editProfile,
    changePassword,
    verifyEmailOtp,
    getVerifyEmailOtpPage,
    resendEmailOtp
};
