const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
require('dotenv').config(); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   // callbackURL: '/auth/google/callback'
   callbackURL: 'https://shoesea.in/auth/google/callback'

  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Get the user's email from Google profile
      const email = profile.emails[0].value;
  
      // First, check if the user already exists by email
      let user = await User.findOne({ email: email });
      
      if (user) {
        // If the user exists but doesn't have a googleId, link the Google account
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
          
        }
        return done(null, user);
      } else {
        // If no user exists, create a new user with Google account details
        user = new User({
          username: profile.displayName,
          email: email,
          authType:'google',
          googleId: profile.id,
        });
        await user.save();
        return done(null, user);
      }

    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

module.exports = passport;
