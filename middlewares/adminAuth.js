

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


const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
  
    // Set the response status code (default to 500 for server errors)
    const statusCode = err.status || 500;
  
    // Render the error page
    res.status(statusCode).render('error', {
        message: err.message || 'Internal Server Error',
        statusCode
    });
  };

module.exports = {
    isLogin,
    isLogout,
    checkAuth,
    errorHandler
};