// const jwt = require('jsonwebtoken');
// // verify token 
// const authenticateToken = async (req,res,next) => {
//     const authHeader = await req.headers['authorization']
//     const token = await authHeader && authHeader.split(' ')[1]
//     if(token ===  null) return res.sendStatus(401)

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if(err) return res.status(403).send(err)
//         req.user = user
//         next()
//     })
// };
// module.exports=authenticateToken