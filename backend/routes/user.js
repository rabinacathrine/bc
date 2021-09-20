const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Imgbb = require('imgbbjs');
const imgbb = new Imgbb({
  key: process.env.IMGBB_API_TOKEN,
});
// verify token 
const authenticateToken = (req,res,next) => {
    const token = req.headers['x-access-token']
    if(token === null) return res.sendStatus(401)

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) return res.status(403).send(err)
        req.userId = decoded._id;
        next()
    })
};
// get all users
router.get('/', async(req, res) => {
    const list = await UserModel.find()
    res.send({
        list,
        message:"Users list"
    })
});
// get all following users
router.get('/following', async(req, res) => {
    const user = await UserModel.findById(req.body._id);
    res.send(user.following);
});
// get all non following users
router.get('/notfollowing/:_id', authenticateToken, async(req, res) => {
    const user = await UserModel.findById(req.params._id);
    const allUsers = await UserModel.find({confirmed:true});
    const notFollowing = await Promise.all(
        allUsers.filter(users=>{
            if(!users.followers.includes(user._id) && ((users._id).toString() !== req.params._id)){
                return users
            }
        })
    );
    res.send(notFollowing);
});
// update user
router.put('/update/:_id', authenticateToken, async(req,res)=>{
    if(req.body._id === req.params._id)
    {
        if(req.body.profilePicture)
        {
            const imgbbObj = await imgbb.upload(req.body.profilePicture);
            req.body.profilePicture = (imgbbObj.data.url).toString();
        }
        const user = await UserModel.findByIdAndUpdate(req.params._id, {
            $set:req.body
        })
        console.log(req.body)
        res.status(200).send({
            user,
            message:"User updated"
        })
    }
    else{
        res.status(403).json({messages:"You can updated only your account"})
    }
    //     if(req.body.password)
    //     {
    //         const hashPass = bcrypt.hash(req.body.password,10);
    //         req.body.password = (await hashPass).toString();
    //     }
});
// delete user
router.delete('/delete/:_id', async(req, res) => {
    if(req.body._id === req.params._id)
    {
        const user = await UserModel.findByIdAndDelete(req.params._id)
        res.status(200).send({
            user,
            message:"User deleted"
        })
    }
    else{
        res.status(403).json({messages:"You can only delete your account"})
    }
});
// get a user using name
router.get('/profile', async(req, res) => {
    const userName = req.query.userName;
    try {
        const user = await UserModel.findOne({userName:userName})
        const { password, updatedAt, confirmed, ...other } = user._doc
        res.status(200).send({
            other,
            message:"User find"
        })
    } catch (error) {
        res.status(500).json(error);
    }
});
// get a user
router.get('/:_id', async(req, res) => {
    try {
        const user = await UserModel.findById(req.params._id)
        const { password, updatedAt, confirmed, ...other } = user._doc
        res.status(200).send({
            other,
            message:"User find"
        })
    } catch (error) {
        res.status(500).json(error);
    }
});
// search user
router.get('/search/:searchName', authenticateToken, async(req,res)=>{
    try {
        const allUsers = await UserModel.find({confirmed:true})
        const users = await Promise.all(
            allUsers.filter((user)=>{
                if(user.userName.includes((req.params.searchName).toLowerCase())) return user
            })
        );
        res.send({users})
    } catch (error) {
         res.status(500).json(error);
    }
});
// toggle follow and unfollow
router.put('/:_id/follow', async(req,res) => {
    if(req.body._id !== req.params._id){
        try {
            // the user you wannna follow
            const user = await UserModel.findById(req.params._id);
            // you
            const currentUser = await UserModel.findById(req.body._id);
            // check if u are not following
            if(!currentUser.following.includes(req.params._id)){
                await user.updateOne( { $push: { followers : req.body._id } } );
                await currentUser.updateOne( { $push: { following : req.params._id } } );
                res.status(200).json("User has been followed");
            }
            // unfollowing the user
            else{
                await user.updateOne( { $pull: { followers : req.body._id } } );
                await currentUser.updateOne( { $pull: { following : req.params._id } } );
                res.status(200).json("User has been unfollowed");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    }
    else{
        res.status(403).json({messages:"You cannot follow yourself"})
    }
});

module.exports = router;
