

const jwt = require('jsonwebtoken')
require('dotenv').config();
// 보낼 데이터 형식 함수
function response (a,b,c) {
  return {
    "status":a, // true false
    "error":b, // status code - 200인 경우 null
    "data":c  // 내용 있는 경우에만 
  }
};



// 로그인 / 비로그인 검사 미들웨어
exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json(response(false,401,null));
    }
  };
  
  exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json(response(false,403,null));
    }
  };

  // JWT 검증 미들웨어
  exports.verifyToken = (req, res, next) => {
    try {
      req.decoded = jwt.verify(req.headers.authorization, process.env.COOKIE_SECRET);
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') { // 유효기간 초과
        return res.status(419).json({
          code: 419,
          message: '토큰이 만료되었습니다',
        });
      }
      return res.status(401).json({
        code: 401,
        message: '유효하지 않은 토큰입니다',
      });
    }
  };

