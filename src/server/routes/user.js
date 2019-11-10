const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const multer = require('multer');
const db = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
function response(a, b, c) {
  return {
    "status": a, // true false
    "error": b, // status code - 200인 경우 null
    "data": c  // 내용 있는 경우에만 
  }
};




// 로그인, 로그아웃 여부 검사 미들웨어
const { isLoggedIn, isNotLoggedIn, verifyToken } = require('./middleware');

const router = express.Router();


router.get('/', isLoggedIn, (req, res) => { // /api/user/
  const user = Object.assign({}, req.user.toJSON());
  delete user.password;
  return res.json(user);
});

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
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});



// 이미지 저장
// key:img로 하여 파일 세 개 넣게 하면 됨.
// user 테이블에 photo 컬럼에 세 개 넣는 로직.
// 1. :id를 받아서 이를 통해 user를 특정하고 user.photo에 넣는 방법
// 2. filename 자체를 특정 userprofile을 받게 하여 찾는 방법.
router.post('/img', upload.fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), (req, res) => {
  console.log(req.files);
  console.log(req.files.img1[0].path);
  console.log(req.files.img2[0].path);
  console.log(req.files.img3[0].path);


  return res.json('success');
});

// 회원가입
// upload.array('img',3),
router.post('/join', upload.fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), async (req, res, next) => { // POST /api/user 회원가입
  try {
    // 인증코드 생성 부분
    let verify_key = makeRandomStr();

    console.log(req.files);

    // 사진 url 생성부분
    let photourl = [req.files.img1[0].path, req.files.img2[0].path, req.files.img3[0].path]; // or 처리
    // 
    let e_auth = 'f';
    if (req.body.login_type != 'email') {
      e_auth = 't';
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12); // salt는 10~13 사이로
    const newUser = await db.User.create({

      email: req.body.email,
      password: hashedPassword,
      gender: req.body.gender,
      nickname: req.body.nickname,
      local: req.body.local,
      birthday: req.body.birthday,
      email_auth: 'email',
      login_type: req.body.login_type,
      create_date: new Date(),
      verify_key: verify_key
    }).then(async (newUser) => {
      let nub = newUser.id

      const newPhoto1 = await db.Photo.create({
        src: photourl[0],
        order: 1,
        UserId: nub
      });
      newUser.setPhotos(newPhoto1);


      const newPhoto2 = await db.Photo.create({
        src: photourl[1],
        order: 2,
        UserId: nub
      });
      newUser.setPhotos(newPhoto2);

      const newPhoto3 = await db.Photo.create({
        src: photourl[2],
        order: 3,
        UserId: nub
      });
      newUser.setPhotos(newPhoto3);
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
    let url = '13.209.7.135:3000/api/user/confirmEmail' + '?key=' + verify_key;
    let mailOpt = {
      from: process.env.EMAIL_ID,
      to: req.body.email,
      subject: '이메일 인증을 진행해주세요',
      html: '<h1>이메일 인증을 위해 URL을 클릭해주세요.</h1><br>' + '<a>' + url + '</a>'
    };
    // 전송 - e_auth가 f인 경우에만 메일 전송
    if (e_auth === 'f') {
      Transporter.sendMail(mailOpt, (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log('email has been sent');
        }

      });

    }
    console.log(newUser);
    return res.status(200).json(response(true, null, newUser));
  } catch (e) {
    console.error(e);
    // 에러 처리를 여기서
    return next(e);
  }
});

// 이메일 중복확인 url
router.post('/emailDoubleCheck', async (req, res, next) => {
  try {
    const exUser = await db.User.findOne({
      where: {
        email: req.body.email
      }
    });
    if (exUser) {
      return res.json(response(false, 303, null));
    }

    return res.json(response(true, null, null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 닉네임 중복확인 url
router.post('/nickDoubleCheck', async (req, res, next) => {
  try {
    const exUser = await db.User.findOne({
      where: {
        nickname: req.body.nickname
      }
    });
    if (exUser) {
      return res.json(response(false, 303, null));
    }
    return res.json(response(true, null, null));
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

  return res.status(200).json(response(true, null, null));

});

// 로그아웃
router.post('/logout', isLoggedIn, (req, res) => { // /api/user/logout
  req.logout();
  req.session.destroy();
  res.status.json(response(true, null, null));
});

// 로그인
router.post('/login', (req, res, next) => { // POST /api/user/login
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      // response로 고쳐야함
      return res.json(info.reason);
    }
    return req.login(user, { session: false }, async (loginErr) => {
      try {
        if (loginErr) {

          return next(loginErr);
        }
        const token = jwt.sign(user.toJSON(), process.env.COOKIE_SECRET);

        return res.status(200).json(response(true, null, { user, token }));
      } catch (e) {
        next(e);
      }
    });
  })(req, res, next);
});

// router.get('/token',passport.authenticate('jwt',{session:false}),)



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
    return res.status(200).json(response(true, null, null));
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
    return res.status(200).json(response(true, null, exUser));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 프로필 사진 수정
// uploads를 single로 하고 url을 받아서 해당 부분만 삭제하는걸로
// router.post('/img/:url',uploads.single('img'), (req,res,next) => {
//  const exPhoto = db.Photo.update({src:req.file.path}{where:{src:req.params.url}})
//});
// url로 user.photo 찾고 해당 업데이트 + uploads폴더 파일 삭제 
// 

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
    return res.status(200).json(response(true, null, null));
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
    return res.status(200).json(response(true, null, null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});


// user all list (미완성)
router.get('/userlist', verifyToken, async (req, res) => {
  try {
    const userlist = await db.User.findAll();
    res.status(200).json(response(true, null, userlist));
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
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']



  }
));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/',
}), (req, res) => {
  return res.status(200).json('success');
});


// tokencheck API
// email컬럼에 해당 snsid 있는지 확인 있으면 true 없으면 false
router.post('/tokencheck', async (req, res, next) => {
  try {
    const exUser = await db.User.findOne({
      where: {
        email: req.body.email
      }
    });
    if (exUser) {
      return res.json(response(true, null, null));
    }
    return res.json(response(false, null, null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});


//

// 회원가입 로그인 로그아웃 아이디찾기 비밀번호찾기 비밀번호수정
// 프로필 올리기
// 팔로우 crud
// 코멘트 crud

module.exports = router;