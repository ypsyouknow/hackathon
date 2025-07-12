const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update googleId if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          photo: profile.photos[0].value,
          googleId: profile.id,
          password: 'googleauth', // Will be hashed by pre-save hook
          passwordConfirm: 'googleauth',
          active: true,
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
