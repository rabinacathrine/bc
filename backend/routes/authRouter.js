const express = require('express');
const UserModel = require('../models/UserModel');
var router = express.Router();
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// user register
router.post('/register', async(req,res)=>{
    const list = await new UserModel(req.body);
        list.save((err,user)=>{
            if(user){
                res.status(201).send({
                list,
                message:"User added"
            });
            }
            else{
                try {
                    if(err.code && err.code == 11000){
                        console.log(Object.keys(err.keyValue).toString())
                        const field = Object.keys(err.keyValue).toString();
                        const code = 409;
                        const error = `An account with that ${field} already exists.`;
                        res.status(code).send({messages: error, fields: field});
                    }
                    if(err.name === 'ValidationError'){
                        let errors = Object.values(err.errors).map(el => el.message);
                        let fields = Object.values(err.errors).map(el => el.path);
                        let code = 400;
                        if(errors.length > 1) {
                            const formattedErrors = errors.join(' ');
                            res.status(code).send({messages: formattedErrors, fields: fields});
                        } else {
                            res.status(code).send({messages: errors, fields: fields})
                        }
                    }
                }
                catch (error) {
                    res.status(500).send('An unknown error occured.');
                }
            }
        });
})
// user login
router.post('/login', async(req,res)=>{
    const body = req.body;
    const user = await UserModel.findOne({email:body.email})
    if(!user){
        res.status(401).json({messages:"This email does not exist"})
    }
    if(!user.confirmed){
        res.status(401).json({messages:"Please confirm your email to login"})
    }
    const validPassword = await bcrypt.compare(body.password, user.password)
    if(!validPassword){
        res.status(403).json({messages:"Invalid password"})
    }
    const token = jwt.sign(
        {
            email: user.email,
            _id: user._id
        },
        process.env.JWT_SECRET,
        {expiresIn: "1hr"},
    )
    res.status(200).json({
        token
        : token,
        user,
        messages:"Login success"
    })
})
// user email verification send
router.post('/verify', async(req,res)=>{
    const {userName,email} = req.body;
    console.log(req.body);
    const emailToken = jwt.sign(
        {
            email: email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '1d',
        },
    );
    const url = `http://localhost:3001/auth/confirmtoken/${emailToken}`

    let smptTransport = nodemailer.createTransport({
        service:"Gmail",
        port:465,
        auth:{
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASS
        }
  });

  let mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: email,
    subject:`Confirm email`,
    html:`<p>Hey ${ userName }, Please click this link to verify your email: ${ url }</p>`
  };

  await smptTransport.sendMail(mailOptions,(err,res)=>{
    if(err){
      console.log(err)
    }else{
      res.send("sucess")
    }
  });

  smptTransport.close();
})
// user email verification receive
router.get('/confirmtoken/:token', async(req,res)=>{
    try{
        const data = jwt.verify(req.params.token, process.env.ACCESS_TOKEN_SECRET);
        console.log(data)
        console.log(data.email)
        await UserModel.findOneAndUpdate({email:data.email},{confirmed: true})
        res.send("Account confirmed. Kindly login");
    }
    catch(e){
        res.send(e);
    }
})

module.exports = router;
