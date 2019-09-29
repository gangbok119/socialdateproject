const express = require('express');
const db = require('../models');

const router = express.Router();


// 보낼 데이터 형식 함수
function response (a,b,c) {
  return {
    "status":a, // true false
    "error":b, // status code - 200인 경우 null
    "data":c  // 내용 있는 경우에만 
  }
};




// comment (create)

router.post('/create', async (req, res, next) => {
  try {
    
    const newComment = await db.Comment.create({
      type:req.body.type,
      writer:req.body.writer,
      target_id:req.body.target_id,
      // depth는 다른 로직을 적용해야함.
      depth:req.body.depth,
      create_date:new Date(),
      state:req.body.state,
      content:req.body.content

    });
    return res.status(200).json(response(true,null,newComment));
  } catch (e) {
    console.error(e);
    next(e);
  }
});
// router.post('/api/comment', (req, res) => {
//     let comment = {
//       "type": req.body.type, 
//       "writer": req.body.writer, 
//       "depth": req.body.depth, 
//       "state": req.body.state, 
//       "mod_time": new Date(),
//       "content": req.body.content
//     };

//     let sql = `INSERT INTO comment SET ?`;

//     connection.query(sql , comment, (error, results) => {
//       if (error) {
//         console.log("error ocurred", error);
//         res.send({
//             "code" : 400,
//             "failed": "error ocurred"
//         })
//       } else {
//           console.log('The solution is: ', results);
//           res.send({
//               "code": 200,
//               "success": "user registered sucessfully",
//           });
//       }
//     });
//   });



// 질문 all은?

router.get('/user/:targetId',async (req,res,next) =>{
  try {
    const userList = db.User.findAll({
      where:{
        id:req.params.targetId
      }
    })
    return res.status(200).json(response(true,null,userList));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// router.get('/api/user/comment/:targetID/:page', (req, res) => {
//   const targetID = req.params.targetID;
//   const page = req.params.page | 0;
//   const limit = 3;

//   const sql = `SELECT * FROM comment WHERE targetID=? order by id desc limit ${page * limit}, ${limit}`;

//   connection.query(sql, [userID], (err, rows) => {
//     console.log(rows);

//     res.send({
//       "code": 200,
//       "success": "user list sucessfully",
//       result: rows
//     });
//   });
// });



// comment (read)

router.get('/:Id', async (req,res,next) => {
  try {
    const comment = db.Comment.findOne({
      where:{
        id:req.params.Id
      }
    })
    return res.status(200).json(response(true,null,comment));
  } catch (e) {
    console.error(e);
    next(e);
  };
});

// router.get('/api/comment/:commentID', (req, res) => {
//   const commentID = req.params.commentID;
//   const commentSql = 'SELECT * FROM comment WHERE `id`=?';

//   connection.query(commentSql, [commentID], (err, rows) => {
//     res.send({
//       "code": 200,
//       "success": "user registered sucessfully",
//       result: rows
//     });
//   });
// });

//comment (edit)
router.patch('/:id', async (req,res,next) => {
  try {
   const exComment  = await db.Comment.update({
      
      
     
      mod_date:new Date(),
      state:req.body.state,
      content:req.body.content
      ,

      where:{
        id:req.params.Id
      }
    });
    return res.status(200).json(response(true,null,exComment));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// router.post('/api/comment/:commentID', (req, res) => {
//   const commentID = req.params.commentID;
//   let sql = `UPDATE comment SET ? WHERE id=${commentID}`;

//   let comment = {
//     "type": req.body.type,
//     "writer": req.body.writer,
//     "depth": req.body.depth,
//     "state": req.body.state,
//     "mod_time": new Date(),
//     "content": req.body.content,
//     "id": commentID
//   };

//   connection.query(sql, comment, (error, results) => {
//     if (error) {
//       console.log("error ocurred", error);
//       res.send({
//         "code": 400,
//         "failed": "error ocurred"
//       })
//     } else {
//       console.log('The solution is: ', results);
//       res.send({
//         "code": 200,
//         "success": "user edit sucessfully",
//       });
//     }
//   });
// });

//comment (delete)

router.delete('/:Id', async (req,res,next) => {
  try {
    await db.Comment.delete({
      where:{
        id:req.params.Id
      }
    });
    return res.status(200).json(response(true,null,null));
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// router.delete('/api/comment/:commentID', (req, res) => {
//   const commentID = req.params.commentID;
//   const sql = 'DELETE FROM comment WHERE id=?';

//   connection.query(sql, [commentID], () => {
//     res.send({
//       "code": 200,
//       "success": "user delete sucessfully",
//     });
//   });
// });

// user comment list (user게시판)
// ex ) localhost:8080/api/user/comment/userid/페이지(10단위)


module.exports = router;