

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
        // res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        // res.setHeader('Pragma', 'no-cache');
        // res.setHeader('Expires', '0');
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