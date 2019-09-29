const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const db = require('../models');
// 앱 자체 로그인 전략 설정. 
module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      const user = await db.User.findOne({ where: { email:email } });
      
      if (!user) {
        return done(null, false, { reason: '존재하지 않는 사용자입니다!' });
      }
      if (user.email_auth === 'f') {
        return done(null, false, {reason:'이메일 인증이 되지 않았습니다.'});
      }
      
      const result = await bcrypt.compare(password, user.password);

      
      if (result) {
        return done(null, user);
      }
      return done(null, false, { reason: '비밀번호가 틀립니다.' });
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }));
};