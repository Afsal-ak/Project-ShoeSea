
// const bcrypt = require('bcrypt');
// const User = require('../models/userModel');
// const adminRoute = require('../routes/adminRoute');

// // Admin Login
// const getAdminLogin = (req, res) => {
//     try {
//         const messages = req.flash('error');
//         res.render('adminlogin', { messages });
//     } catch (error) {
//         console.log(error.message)
//     }
    
// };

// const postAdminLogin = async (req, res) => {
//     const data = {
//         email: req.body.email,
//         password: req.body.password,
//     };

//     try {
//         const user = await User.findOne({ email: data.email,is_admin:true });
//         if (!user) {
//             req.flash('error', 'Please Enter Correct Email and Password');
//             return res.redirect('/admin/login');
//         }

//         const isPasswordMatch = await bcrypt.compare(data.password, user.password);
//         // if (!isPasswordMatch) {
//         //     req.flash('error', 'Please Enter Correct Email and Password');
//         //     return res.redirect('/admin/login');
//         // }
//         if (isPasswordMatch) {
//             req.session.isAuth = true;
//             req.session.adminId = user._id;
//             console.log('Admin session created', req.session.adminId);
//            // return res.redirect('/admin/dashboard');
//        return   res.render('dashboard')
//         } else {
//             req.flash('error', 'Please Enter Correct Email and Password');
//             return res.redirect('/admin/login');
//         }


//         // req.session.isAuth = user.email;
//         // console.log('session created',req.session.isAuth) // Store authentication status
        
           
//        //return res.render('dashboard');
//       // return res.redirect('/admin');
//        return res.redirect('/admin');
        
        
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

// // Admin Home
// const getAdminDashboard = (req, res) => {
//     try {
//         if(req.session.isAuth){
//             res.render('dashboard')
//         }
//         //       console.log('dashboe load')
//         //  res.render('dashboard');
        
      
//     } catch (error) {
//         console.log(error.message)
//     }
   
// };



// // Customer Management
// const getUser = async (req, res) => {
//     try {
//         const activeUser=await User.find({is_blocked:false})
//         const blockedUser=await User.find({is_blocked:true})
//         const allUser = activeUser.concat(blockedUser)
//         res.render('user-list', { users: allUser });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };



// const blockUser = async (req, res) => {
//     const id = req.query.id;
//     try {
//         // Update user status to blocked
//         const userData = await User.findByIdAndUpdate(id, { is_blocked: true });
//         if (!userData) {
//             return res.status(404).send('User not found');
//         }

//         // Invalidate session if the user is logged in
//         if (userData._id.toString() === req.session.userId) {
//             req.session.destroy(err => {
//                 if (err) {
//                     console.error('Error destroying session:', err);
//                     return res.status(500).send('Internal Server Error');
//                 }
//                 res.redirect('/login'); // Redirect to login page
//             });
//         } else {
//             console.log('block succes')
//             res.redirect('/admin/users-list'); // Redirect to user list after blocking
//         }
//     } catch (error) {
//         console.log('block failed')
//         console.error('Error blocking user:', error);
//         return res.status(500).send('Internal Server Error');
//     }
// };


// // Unblock User
// const unblockUser = async (req, res) => {
//     const id = req.query.id;
//     try {
//         const userData = await User.findByIdAndUpdate(id, { is_blocked: false }); // Corrected to unblock user
//         if (!userData) {
//             return res.status(404).send('User not found');
//         }
        
//         return res.redirect('/admin/users-list'); // Redirect to customer list after unblocking
//     } catch (error) {
//         console.log('unblock failed')
//         console.error('Error unblocking user:', error);
//         return res.status(500).send('Internal Server Error');
//     }
// };


// // // Logout
// // const logout = (req, res) => {
// //     console.log('admin session destryyed')
// //     req.session.destroy();
// //     console.log('admin session destryyed')
// //     return res.redirect('/admin/login');
// // };

// const logout = (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             console.error('Error destroying session:', err);
//         }
//         console.log('Admin session destroyed');
//         res.redirect('/admin/login');
//     });
// };
// // Export all functions with prefixed naming
// module.exports = {
//     getAdminLogin,
//     postAdminLogin,
//     getAdminDashboard,
//      getUser,
//      logout,
//     // getNewUser,
//     // postNewUser,
//     // getEditUser,
//     // postEditUser,
//      blockUser,
//      unblockUser,
//     // searchUser,
// };



const bcrypt = require('bcrypt');
const User = require('../../models/userModel');

// const getAdminLogin = (req, res) => {
//     try {
//         const messages = req.flash('error');
//         res.render('adminlogin', { messages });
//     } catch (error) {
//         console.log(error.message);
//     }
// };

// const postAdminLogin = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email: email, is_admin: true });
//         if (!user) {
//             req.flash('error', 'Please Enter Correct Email and Password');
//             return res.redirect('/admin/login');
//         }

//         const isPasswordMatch = await bcrypt.compare(password, user.password);
//         if (isPasswordMatch) {
//             req.session.isAuth = true;
//             req.session.adminId = user._id;
//             console.log('Admin session created', req.session.adminId);
//            return res.redirect('/admin/dashboard');
//           //res.render('dashboard')
//         } else {
//             req.flash('error', 'Please Enter Correct Email and Password');
//             return res.redirect('/admin/login');
//         }
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

const getAdminLogin = (req, res) => {
    try {
        if (req.session.isAuth && req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        const messages = req.flash('error');
        res.render('adminlogin', { messages });
    } catch (error) {
        console.log(error.message);
    }
};

const postAdminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email, is_admin: true });
        if (!user) {
            req.flash('error', 'Please Enter Correct Email and Password');
            return res.redirect('/admin/login');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            req.session.isAuth = true;
            req.session.adminId = user._id;
            console.log('Admin session created', req.session.adminId);
            return res.redirect('/admin/dashboard');
        } else {
            req.flash('error', 'Please Enter Correct Email and Password');
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const getAdminDashboard = (req, res) => {
    try {
        if (!req.session.isAuth || !req.session.adminId) {
            return res.redirect('/admin/login');
        }
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
};


// const getAdminDashboard = (req, res) => {
//     try {
//         res.render('dashboard');
//     } catch (error) {
//         console.log(error.message);
//     }
// };

const getUser = async (req, res) => {
    try {
        const activeUser = await User.find({ is_blocked: false });
        const blockedUser = await User.find({ is_blocked: true });
        const allUser = activeUser.concat(blockedUser);
        res.render('user-list', { users: allUser });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const blockUser = async (req, res) => {
    const id = req.query.id;
    try {
        const userData = await User.findByIdAndUpdate(id, { is_blocked: true });
        if (!userData) {
            return res.status(404).send('User not found');
        }
        console.log('Block success');
        res.redirect('/admin/users-list');
    } catch (error) {
        console.log('Block failed');
        console.error('Error blocking user:', error);
        return res.status(500).send('Internal Server Error');
    }
};

const unblockUser = async (req, res) => {
    const id = req.query.id;
    try {
        const userData = await User.findByIdAndUpdate(id, { is_blocked: false });
        if (!userData) {
            return res.status(404).send('User not found');
        }
        return res.redirect('/admin/users-list');
    } catch (error) {
        console.log('Unblock failed');
        console.error('Error unblocking user:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// const logout = (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             console.error('Error destroying session:', err);
//         }
//         console.log('Admin session destroyed');
//         res.redirect('/admin/login');
//     });
// };

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        console.log('Admin session destroyed');
        res.redirect('/admin/login');
    });
};
module.exports = {
    getAdminLogin,
    postAdminLogin,
    getAdminDashboard,
    getUser,
    blockUser,
    unblockUser,
    logout
};