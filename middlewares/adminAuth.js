

// const isLogin=async (req,res,next)=>{
//     try{
//         if(req.session.isAuth){
            
//         console.log('admin session succes')
//         next()
//         }
//         else{
//             console.log('admin session end')
//             return res.redirect('/admin')
//         }
//        // next()
//     }
//     catch(error){
//         console.log(error.message)
//     }
// }


// const isLogout=async (req,res,next)=>{
//     try{
//         if(req.session.isAuth){
//             console.log('islogout')
//          return  res.redirect('/admin/dashboard')
//         }
//         console.log('not log')
//         next()

//     }
//     catch(error){
//         console.log(error.meassage)
//     }
// }

// module.exports={
//     isLogin,
//     isLogout
// }

// const isLogin = async (req, res, next) => {
//     try {
//         if (req.session.isAuth && req.session.adminId) {
//             console.log('Admin session active');
//             next();
//         } else {
//             console.log('Admin session inactive');
//             return res.redirect('/admin/login');
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

// const isLogout = async (req, res, next) => {
//     try {
//         if (req.session.isAuth && req.session.adminId) {
//             console.log('Admin already logged in');
//             return res.redirect('/admin/dashboard');
//         }
//         console.log('Admin not logged in');
//         next();
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// };

// // In adminAuth.js
// const checkAuth = (req, res, next) => {
//     if (req.session.isAuth && req.session.adminId) {
//         if (req.path === '/login') {
//             return res.redirect('/admin/dashboard');
//         }
//     } else {
//         if (req.path !== '/login' && req.path !== '/') {
//             return res.redirect('/admin/login');
//         }
//     }
//     next();
// };
// module.exports = {
//     isLogin,
//     isLogout,
//     checkAuth
// };

const isLogin = (req, res, next) => {
    if (req.session.isAuth && req.session.adminId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

const isLogout = (req, res, next) => {
    if (req.session.isAuth && req.session.adminId) {
        res.redirect('/admin/dashboard');
    } else {
        next();
    }
};

const checkAuth = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (req.session.isAuth && req.session.adminId) {
        if (req.path === '/login') {
            return res.redirect('/admin/dashboard');
        }
    } else {
        if (req.path !== '/login' && req.path !== '/') {
            return res.redirect('/admin/login');
        }
    }
    next();
};

module.exports = {
    isLogin,
    isLogout,
    checkAuth
};