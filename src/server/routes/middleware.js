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