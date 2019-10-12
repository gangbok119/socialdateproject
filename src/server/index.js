

// npm i passport-kakao

const express = require("express");

const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
// dotenv 작동이 안 되는 중
const path = require('path');
require('dotenv').config();
const passport = require("passport");


//
const logger = require('./logger');
const helmet = require('helmet');
const hpp = require('hpp');
//
const passportConfig = require("./passport");
const db = require("./models");
const userAPIRouter = require("./routes/user");
const commentAPIRouter = require("./routes/comment");
const followAPIRouter = require('./routes/follow');

//
const prod = process.env.NODE_ENV === "production";
const app = express();
db.sequelize.sync();
passportConfig();

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(helmet());
  app.use(hpp());
} else {
  app.use(morgan('dev'));
};

// req.body를 json으로 쓰기 위한 설정
// req.session.destroy();사용하기 위해 express-session 
app.use(express.static(path.join(__dirname,'public')));
app.use('/img', express.static(path.join(__dirname,'uploads'))); // /img/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false // https를 쓸 때 true
  }
};
if (process.env.NODE_ENV === 'production') {
  sessionOption.proxy = true;
  sessionOption.cookie.secure = true;
};
app.use(
  expressSession(sessionOption)
);

app.use(passport.initialize());
app.use(passport.session());

// 정상 동작하는지 테스트
app.get("/", (req, res) => {
  res.send("react nodebird 백엔드 정상 동작!");
});

// API는 다른 서비스가 내 서비스의 기능을 실행할 수 있게 열어둔 창구
app.use("/api/user", userAPIRouter);
app.use("/api/comment", commentAPIRouter);
app.use("/api/follow", followAPIRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  //로거 설정
  logger.info('hello');
  logger.error(err.message);
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.json(err.message);
});

// 포트 열기
app.listen(prod ? process.env.PORT : 3000, () => {
  console.log(`server is running on ${process.env.PORT}`);
});
