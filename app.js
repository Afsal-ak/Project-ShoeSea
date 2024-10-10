

const express = require('express');
const app = express();
const env=require('dotenv').config();
const dbConnect=require('./config/dbconnect')
const passport = require('./config/passport')
const session=require('express-session')
app.use(express.urlencoded({extended:true}))
app.use(express.json())
  
const path=require('path')

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory where the views are located
app.set('views', './views/user');
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
  
    cookie: { secure: false } 
}))


app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
const PORT = process.env.PORT || 3002;
//userRoute.use(express.static(path.join(__dirname, '../public/uploads'))); // Ensure correct path for uploads
app.use('/public', express.static(path.join(__dirname, '../public'))); // Ensure correct path for public
//userRoute.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views/user'));
app.use(passport.initialize())
app.use(passport.session())
const adminRoute=require('./routes/adminRoute')

app.use('/admin',adminRoute)


const userRoute=require('./routes/userRoute')

app.use('/',userRoute)

app.listen(PORT, () => {
    console.log(`Server connected successfully on port ${PORT}`);
});
