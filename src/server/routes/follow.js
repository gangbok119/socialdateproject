const express = require('express');
const router = express.Router();
const db = require('../models');

//following create
router.post('/', async (req,res,next) => {
    try {
        const newFollow = await db.Follow.create({
            follower:req.body.follower,
            target:req.body.target
        });
        res.status(200).json(newFollow);
    } catch (e) {
        console.error(e);
        next(e);
    }
});


// router.post('/users/:id/follow', function (req, res, next) {

//     let follower = {
//         "follower": req.body.follower,
//         "target": req.params.id
//     }
//     console.log(req.body.follower);

//     let sql = 'INSERT INTO follow SET ?';

//     db.query(sql, follower, function (err, rows) {
//         if (err) {
//             console.log("error ocurred", err);
//             res.send({
//                 "code": 400,
//                 "failed": "error ocurred"
//             })
//         } else {
//             console.log('The solution is: ', rows);
//             res.send({
//                 "code": 200,
//                 "success": "follow sucessfully",
//             });
//         }
//     });
// });

//following delete

router.delete('/:id', async (req,res,next) => {
    try {
        await db.Follow.delete({
            where:{
                id:req.params.id
            }
        })
    } catch (e) {
        console.error(e);
        next(e);
    }
});

// router.delete('/users/:id/unfollow', (req, res) => {

//     let follower = [req.body.follower, req.params.id];
//     let sql = 'DELETE FROM follow WHERE follower = ? AND target = ?';

//     db.query(sql, follower, (err, rows) => {
//         if (err) {
//             console.log("error ocurred", err);
//             res.send({
//                 "code": 400,
//                 "failed": "error ocurred"
//             })
//         } else {
//             console.log('The solution is: ', rows);
//             res.send({
//                 "code": 200,
//                 "success": "follow sucessfully",
//             });
//         }
//     });
// });

//user list read
router.get('/users', async (req, res, next) => {
    try {
        let sql =
        `SELECT target, COUNT(follower), users.nickname, users.local, users.content FROM follow JOIN users ON follow.target=users.id GROUP BY target ORDER BY COUNT(follower) DESC;`
        const result = await db.sequelize.query(sql);
            
        res.send(result);
        
    } catch(e) {
        console.error(e);
        next(e);
    };
    
});

module.exports = router;