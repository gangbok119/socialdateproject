const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const multer = require('multer');
const db = require('../models');

const fs = require('fs');
const path = require('path');
// 이메일 인증 모듈 부분
const nodemailer = require('nodemailer');

// 임시비밀번호 및 인증코드 작성 부분
const math = require('math');
function makeRandomStr() {
  let randomStr = "";
  let possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    randomStr += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return randomStr;
};

// 보낼 데이터 형식 함수
function response (a,b,c) {
  return {
    "status":a, // true false
    "error":b, // status code - 200인 경우 null
    "data":c  // 내용 있는 경우에만 
  }
};




// 로그인, 로그아웃 여부 검사 미들웨어
const { isLoggedIn, isNotLoggedIn } = require('./middleware');

const router = express.Router();


router.get('/', isLoggedIn, (req, res) => { // /api/user/
  const user = Object.assign({}, req.user.toJSON());
  delete user.password;
  return res.json(user);
});

// multer 설정
fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      console.log(file);
      
      const ext = path.extname(file.originalname);
      cb(null, path.basename(req.body.email, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});


// 회원가입
router.post('/join',upload.single('join'), async (req, res, next) => { // POST /api/user 회원가입
  try {
    // 인증코드 생성 부분
    let verify_key = makeRandomStr();

    // 사진 url 생성부분
    let photourl = `/uploads/${req.file.filename}`; // or 처리
  
    
    const hashedPassword = await bcrypt.hash(req.body.password, 12); // salt는 10~13 사이로
    const newUser = await db.User.create({

      email: req.body.email,
      password: hashedPassword,
      gender: req.body.gender,
      nickname: req.body.nickname,
      photo:photourl,
      local: req.body.local,
      birthday: req.body.birthday,
      email_auth: 'f',
      login_type: req.body.login_type,
      create_date: new Date(),
      verify_key: verify_key
    });

    //인증 메일 발송 부분
    let Transporter = nodemailer.createTransport({
      service: 'Gmail',

      // 내 메일 인증으로 메일보내는 부분
      // 차후 비밀로 수정
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD
      }

    });
    let url = 'http://localhost:3065/confirmEmail' + '?key=' + verify_key;
    let mailOpt = {
      from: process.env.EMAIL_ID,
      to: req.body.email,
      subject: '이메일 인증을 진행해주세요',
      html: '<h1>이메일 인증을 위해 URL을 클릭해주세요.</h1><br>' + '<a>' + url + '</a>'
    };
    // 전송
    Transporter.sendMail(mailOpt, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log('email has been sent');
      }

    });
    console.log(newUser);
    return res.status(200).json(response(true,null,newUser));
  } catch (e) {
    console.error(e);
    // 에러 처리를 여기서
    return next(e);
  }
});

// 이메일 중복확인 url
router.post('/emailDoubleCheck', async (req,res,next) => {
  try {
    const exUser = await db.User.findOne({where:{
      email:req.body.email
    }});
    if (exUser) {
      return res.json(response(false,303,null));
    }
   
    return res.json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 닉네임 중복확인 url
router.post('/nickDoubleCheck', async (req,res,next) => {
  try {
    const exUser = await db.User.findOne({where:{
      nickname:req.body.nickname
    }});
    if (exUser) {
      return res.json(response(false,303,null));
    }
    return res.json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 이메일 인증 url 처리부분
router.get('/confirmEmail', (req, res, next) => {
  db.User.update({
    email_auth: 't'
  }, {
    where: {
      verify_key: req.query.key
    }
  });

  return res.status(200).json(response(true,null,null));

});

// 로그아웃
router.post('/logout',isLoggedIn, (req, res) => { // /api/user/logout
  req.logout();
  req.session.destroy();
  res.status.json(response(true,null,null));
});

// 로그인
router.post('/login',isNotLoggedIn, (req, res, next) => { // POST /api/user/login
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      // response로 고쳐야함
      return res.json(info.reason);
    }
    return req.login(user, async (loginErr) => {
      try {
        if (loginErr) {
          
          return next(loginErr);
        }
        const fullUser = await db.User.findOne({
          where: { id: user.id },

        });
        console.log(fullUser);
        return res.status(200).json(response(true,null,fullUser));
      } catch (e) {
        next(e);
      }
    });
  })(req, res, next);
});

// 비밀번호 수정
router.patch('/password', isLoggedIn, async (req, res, next) => {
  try {
    const newpassword = await bcrypt.hash(req.body.password, 12)
    db.User.update({
      password: newpassword,
      where: {
        id: req.user.id
      }
    });
    return res.status(200).json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});


// 프로필 수정 부분 만들어야 함.
router.patch('/profile', isLoggedIn, async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const exUser = await db.User.update({

      password: hashedPassword,
      gender: req.body.gender,
      nickname: req.body.nickname,
      local: req.body.local,
      birthday: req.body.birthday,


    }, {
      where: { id: req.user.id },
    });
    return res.status(200).json(response(true,null,exUser));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 아이디 찾기
// 성명을 받아서 맞으면 id 반환 - 가려서 보내줄지 여부 신경써야할듯 
// 작동은 함
// 성명은 겹칠 수 있으므로 차후 이메일 주소를 받아 아이디 알려주거나 혹은 이메일 주소로 아이디 전송으로 바꿔야 함.
// router.post('/findId', isNotLoggedIn, async (req, res, next) => {
//   try {
//     const exUser = await db.User.findOne({
//       where: {
//         username: req.body.username
//       }
//     });
//     res.send(exUser.userId);
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// });

// 비밀번호 찾기
router.post('/findPassword', isNotLoggedIn, async (req, res, next) => {
  try {
    // 임시비밀번호 생성 부분
    let randompassword = makeRandomStr();

    // db에 유저 비밀번호 임시비밀번호로 수정하는 부분
    const hashedPassword = await bcrypt.hash(randompassword, 12); // salt는 10~13 사이로
    db.User.update({
      password: hashedPassword
    }, {
      where: {
        email: req.body.email
      }
    });
    const exUser = await db.User.findOne({
      where: {
        email: req.body.email
      }
    });

    //임시비밀번호 메일 발송 부분
    let Transporter = nodemailer.createTransport({
      service: 'Gmail',

      // 내 메일 인증으로 메일보내는 부분
      // 차후 비밀로 수정
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD
      }

    });
    
    let mailOpt = {
      from: process.env.EMAIL_ID,
      to: exUser.email,
      subject: '발급된 임시비밀번호를 확인하세요',
      html: randompassword
    };
    // 전송
    Transporter.sendMail(mailOpt, (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log('email has been sent');
      }

    });
    return res.status(200).json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
})

// 회원 탈퇴
router.post('/resign', isLoggedIn, async (req, res, next) => {
  try {
    const exUser = await db.User.findOne({
      where: {
        id: req.user.id
      }
    });
    exUser.update({ email_verified: 'f' });
    return res.status(200).json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});


// user all list (미완성)
router.get('/userlist', async (req, res) => {
  try {
    const userlist = await db.User.findAll();
    res.status(200).json(response(true,null,userlist));
  } catch (e) {
    console.error(e);
    next(e);
  }


  
});

// 카카오 로그인 관련
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
 return res.status(200).json('success');
});


// 구글 로그인 관련
router.get('/google', passport.authenticate('google',
  {
    scope: [ 'https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email']

    

  }
));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/',
}), (req, res) => {
 return res.status(200).json('success');
});





//

// 회원가입 로그인 로그아웃 아이디찾기 비밀번호찾기 비밀번호수정
// 프로필 올리기
// 팔로우 crud
// 코멘트 crud

module.exports = router;