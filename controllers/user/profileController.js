
// const bcrypt = require('bcrypt');
// const User = require('../../models/userModel');
// const nodemailer = require('nodemailer');
// const Product = require('../../models/productModel');
// const Address=require('../../models/addressModel')



// const getAccount=async(req,res)=>{
//     try {
//         res.render('user-account')
//     } catch (error) {
        
//     }
// }


// const getAddressForm=async(req,res)=>{
//     try {
//         res.render('address-form');
//     } catch (error) {
//         console.log(error.message)
//     }
// }



// const addAddress = async (req, res) => {
//     try {
//         const { userId, fname, lname, country, housename, city, state, pincode, phone } = req.body;

//         const newAddress = new Address({
//             userId,
//             fname,
//             lname,
//             country,
//             housename,
//             city,
//             state,
//             pincode,
//             phone,
           
//         });

//         await newAddress.save();
//         conslotchange.log(newAddress)
//         res.redirect('/home'); // redirect to a list or confirmation page
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };

// module.exports={
//     getAddressForm,
//     addAddress
// }

const Address = require('../../models/addressModel');

const User = require('../../models/userModel');
const bcrypt=require('bcrypt')

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

// Handle address form submission
// const addAddress = async (req, res) => {
//     try {
//         // Extract user ID from session or authentication token, not from form submission
//         const userId = req.user.id;

//         const { fname, lname, country, housename, city, state, pincode, phone } = req.body;

//         const newAddress = new Address({
//             userId,
//             fname,
//             lname,
//             country,
//             housename,
//             city,
//             state,
//             pincode,
//             phone,
//         });

//         await newAddress.save();
//         console.log(newAddress);
//         res.redirect('/home'); // Adjust redirection path as necessary
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };

//const Address = require('../../models/addressModel');

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

        res.render('user-profile', { user, addresses });
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).send('Server Error');
    }
};


// // Route to handle profile update
// const editProfile= async (req, res) => {
//     try {
//         const { username, email, number } = req.body;
//         const userId = req.session.userId; // Assuming user ID is stored in session or JWT

//         // Find the user and update details
//         await User.findByIdAndUpdate(userId, { username, email, number });

//         // Redirect or send success response
//         res.redirect('/profile'); // Redirect to profile page after update
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// }

const editProfile = async (req, res) => {
    try {
      const { username, email, number } = req.body;
      const userId = req.session.isAuth; // Assume user ID is stored in session
  
      if (!userId) {
        req.flash('error_msg', 'Unauthorized');
        return res.redirect('/profile');
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
  
      // Update user details
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
  
// Function to handle password change
// const changePassword = async (req, res) => {
//     try {
//       const { currentPassword, newPassword, confirmPassword } = req.body;
//       const userId = req.session.isAuth; // Assume user ID is stored in session
  
//       if (!userId) {
//         return res.status(401).json({ success: false, message: 'Unauthorized' });
//       }
  
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//       }
  
//       // Check if the current password is correct
//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ success: false, message: 'Current password is incorrect' });
//       }
  
//       // Check if new passwords match
//       if (newPassword !== confirmPassword) {
//         return res.status(400).json({ success: false, message: 'New passwords do not match' });
//       }
  
//       // Hash the new password
//       const hashedPassword = await bcrypt.hash(newPassword, 10);
  
//       // Update the user's password
//       user.password = hashedPassword;
//       await user.save();
  
//       res.status(200).json({ success: true, message: 'Password updated successfully' });
//     } catch (error) {
//       console.error('Error changing password:', error);
//       res.status(500).json({ success: false, message: 'Server error' });
//     }
// }

const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.isAuth; // Assume user ID is stored in session
  
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
  

const addAddress = async (req, res) => {
    try {
        const userId = req.session.isAuth; // Assuming the user ID is stored in the session after login
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

        res.redirect('/home'); // Redirect to a relevant page after saving the address
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

        res.redirect('/profile');  // Redirect to a relevant page after updating the address
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
        res.redirect('/profile')

    } catch (error) {
        console.error('Error delteing address:', error.message);
        res.status(500).render('edit-address', { message: 'An error occurred while deleting your address. Please try again.', address: req.body });
    }
}

module.exports = {
    getAccount,
    getAddressForm,
    addAddress,
    getEditAddressForm,
    updateAddress,
    deleteAddress,
    getUserProfile,
    editProfile,
    changePassword
};
