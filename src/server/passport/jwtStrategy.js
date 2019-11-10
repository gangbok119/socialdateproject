const passport = require('passport');
const { Strategy: JWTStrategy, ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcrypt');
const db = require('../models');
// 앱 자체 로그인 전략 설정. 
module.exports = () => {
  passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.COOKIE_SECRET
  }, async (jwtpayload, done) => {
    try {
      const exUser = await db.User.findOne({where:{id:jwtpayload.id}});
      return done(null, exUser);
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }));
};