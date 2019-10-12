const KakaoStrategy = require('passport-kakao').Strategy;

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/api/user/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 인증해서 가입처리만 하고 업데이트로 바꾸기
      const exUser = await User.findOne({ where: { login_type: 'kakao' } });
      if (exUser) {
        console.log(profile._json.kakao_account.birthday);
        done(null, exUser);
      } else {
        console.log(profile._json);
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account.email,
          nickname: profile.displayName,
          gender: profile._json && profile._json.gender,
          birthday:'default',
          login_type: 'kakao',
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