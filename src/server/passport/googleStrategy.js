const googleStrategy = require('passport-google-oauth20').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/user/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 인증해서 가입처리만 하고 업데이트로 바꾸기
      const exUser = await User.findOne({ where: { login_type: 'google' } });
      if (exUser) {
        console.log(profile);
        return done(null, exUser);
      } else {
        console.log(profile);
        const newUser = await User.create({
          email: profile.emails[0].value,
          nickname: profile.displayName,
          gender: 'default',
          birthday:'default',
          login_type: 'google',
          local:"default",
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};