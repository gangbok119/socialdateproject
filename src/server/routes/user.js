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


// 이미지 업로드 미들웨어 - multer - uploads폴더에 올라감
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
  limits: { fileSize: 20 * 1024 * 1024 },
});


// 회원가입
// upload.field('img',3), - img1,2,3 key - 이미지 파일 value
router.post('/join', upload.fields([{ name: 'img1' }, { name: 'img2' }, { name: 'img3' }]), async (req, res, next) => { // POST /api/user 회원가입
  try {
    // 인증코드 생성 부분
    let verify_key = makeRandomStr();

    console.log(req.files);

    // 사진 url 생성부분
    let photourl = [req.files.img1[0].path, req.files.img2[0].path, req.files.img3[0].path]; // or 처리


    // user 로그인 종류가 local이 아니면 바로 로그인 가능하게 함. 
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

      birthday: req.body.birthday,
      email_auth: e_auth,
      login_type: req.body.login_type,
      create_date: new Date(),
      verify_key: verify_key
    });
    let nub = newUser.id


    const newPhoto1 = await db.Photo.create({
      src: photourl[0],
      order: 1,
      UserId: nub
    });
    newUser.addPhotos(newPhoto1);


    const newPhoto2 = await db.Photo.create({
      src: photourl[1],
      order: 2,
      UserId: nub
    });
    newUser.addPhotos(newPhoto2);

    const newPhoto3 = await db.Photo.create({
      src: photourl[2],
      order: 3,
      UserId: nub
    });
    newUser.addPhotos(newPhoto3);



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

    // user데이터를 json화하여 payload에 넣으면 생성 가능.
    let value = JSON.stringify(newUser);
    const token = jwt.sign(value, process.env.COOKIE_SECRET);

    return res.status(200).json(response(true, null, { value, token }));
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

// 로그아웃 - jwt 쓰게되면 다른 처리가 필요할듯
router.post('/logout', isLoggedIn, (req, res) => { // /api/user/logout
  req.logout();
  req.session.destroy();
  res.status.json(response(true, null, null));
});

// 로그인
// session에 토큰이 들어있는지 확인.
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
        const value = JSON.stringify(user)
        const token = jwt.sign(value, process.env.COOKIE_SECRET);
        
        return res.status(200).json(response(true, null, token));
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

// 프로필 수정요청 부분 - get api에서 필요한 부분을 보내줘야함. 포토까지 추가해서
// 
router.get('/profile', async (req, res, next) => {
  try {
    // token을 decode해서 그 id로 where를 걸어줌
    const exUser = await db.User.findone();
    // value에 photos부분도 추가해서 보냄.
    return res.status(200).json();
  } catch (e) {
    console.error(e);
    next(e);
  }
})


// 프로필 수정 부분 만들어야 함. - 비밀번호는 삭제.
// photos까지 다 가져와서 한번에 통짜로 수정하게 함. upload 걸고 삭제하는 부분까지 다 넣음.
router.patch('/profile', async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const exUser = await db.User.update({

      password: hashedPassword,
      gender: req.body.gender,
      nickname: req.body.nickname,

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
router.post('/img/:id', upload.single('img'), async (req, res, next) => {
  try {
    const newphoto = await db.Photo.findOne({ where: { id: req.params.id } });
    let path = newphoto.src;
    db.Photo.update({ src: req.file.path }, { where: { id: req.params.id } });

    var resultHandler = function (err) {
      if (err) {
        console.log("unlink failed", err);
      } else {
        console.log("file deleted");
      }
    }
    fs.unlink(path, resultHandler);
    return res.status(200).json(response(true, null, null));
  } catch (e) {
    console.error(e);
    next(e);
  }

});
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


// user all list (미완성) - photo 1번 넣어야 하고verifyToken
// 로그인 안되면 인기순 로그인 되면 거리순 뭐 이런식으로 보여주는 형태가 달라져야함.
router.get('/userlist',async (req, res) => {
 
    // const userlist = await db.Photo.findAll({attributes:['src'],where:{order:1},include:[{model:db.User,attributes:['email']}]});
    const userlist = await db.User.findAll({attributes:['email','gender','nickname','birthday','content'],include:[{model:db.Photo, as:'Photos',attributes:['src'],where:{order:1}}]});
    console.log(typeof(userlist));
    return res.status(200).json(userlist);
    
    
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
    const payl = JSON.stringify(exUser);
    const token = jwt.sign(payl, process.env.COOKIE_SECRET);
    if (exUser) {
      return res.json(response(true, null, token));
    }
    return res.json(response(false, null, null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});


// jwt 유효성 검사 API
router.get('/jwtcheck', (req, res) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.COOKIE_SECRET);
    return res.status(200).json(response(true, null, null));
  } catch (error) {
    if (error.name === 'TokenExpiredError') { // 유효기간 초과
      return res.status(419).json(response(false, 419, { message: '토큰이 만료되었습니다' }));
    }
    return res.status(401).json(response(false, 401, { message: '유효하지 않은 토큰입니다' }));
  }
});

// photos 제대로 가져오는지 테스트 api
// router.get('/getphoto:id', async (req,res,next) => {
//   try {
//     const exUser = await db.User.findOne({where:{id:req.params.id}});
//     const photos = await exUser.getPhotos();
//     return res.status(200).json(photos);
//   } catch (e) {
//     console.error(e);
//     next(e);
//   }
// });

// 회원가입 로그인 로그아웃 아이디찾기 비밀번호찾기 비밀번호수정
// 프로필 올리기
// 팔로우 crud
// 코멘트 crud

module.exports = router;