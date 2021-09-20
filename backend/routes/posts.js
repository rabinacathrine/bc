const express = require('express');
const router = express.Router();
const PostModel = require('../models/postModel');
const UserModel = require('../models/UserModel');
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
// create post
router.post('/:_id', async(req,res)=>{
    if(req.body.image) {
        const imgbbObj = await imgbb.upload(req.body.image);
        const imageURL = (imgbbObj.data.url).toString();
        try {
            const { userId, content } = req.body;
            const newPost = new PostModel({
                userId: userId,
                content: content,
                image: imageURL
            });
            await newPost.save();
            res.status(200).json("New post added");
            }
        catch (error) {
            res.status(500).json(error);
        }
    }
    else {
        try {
            const newPost = new PostModel(req.body);
            await newPost.save();
            res.status(200).json("New post added");
        }
        catch (error) {
            res.status(500).json(error);
        }
    }
});
// update post
router.put('/update/:_id', async(req,res)=>{
    if(req.body.image) {
        const imgbbObj = await imgbb.upload(req.body.image);
        req.body.image = (imgbbObj.data.url).toString();
    }
    const post = await PostModel.findByIdAndUpdate(req.params._id, {
            $set:req.body
        })
        console.log(req.body)
        res.status(200).send({
            post,
            message:"Post updated"
        })
});
// delete post
router.delete('/:_id', async(req,res)=>{
    try {
        const post = await PostModel.findById(req.params._id);
        if(post.userId === req.body.userId){
            await post.deleteOne();
            res.status(200).send({ messages:"Post deleted"})
        }else{
            res.status(403).json({messages:"You can delete only your post"})
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
// get a post
router.get('/:_id', async(req,res)=>{
    try {
        const post = await PostModel.findById(req.params._id)
        res.status(200).send({
            post,
            messages:"Post displayed"
        })
    } catch (error) {
        res.status(500).json(error);
    }
})
// like || dislike a post
router.put('/:_id/like', async(req,res)=>{
    try {
        const post = await PostModel.findById(req.params._id);
        if(!post.likes.includes(req.body.userId)){
            await post.updateOne({$push:{likes:req.body.userId}});
            res.status(200).json("Post liked")
        }else{
            await post.updateOne({$pull:{likes:req.body.userId}});
            res.status(200).json("Post disliked")
        }
    } catch (error) {
        res.status(500).json(error);
    }
});
// get feed posts
router.get('/feed/:userId', authenticateToken, async(req,res)=>{
    try {
        const currentUser = await UserModel.findById(req.params.userId);
        const userPosts = await PostModel.find({userId:currentUser._id});
        const followingPost = await Promise.all(
            currentUser.following.map((friendId)=>{
                return PostModel.find({userId:friendId});
            })
        );
        res.status(200).json(userPosts.concat(...followingPost));
    } catch (error) {
        res.status(500).json(error);
    }
})
// get user post using name
router.get('/userpost/:userName',authenticateToken, async(req,res)=>{
    try {
        const user = await UserModel.findOne({userName:req.params.userName});
        const userPosts = await PostModel.find({userId:user._id});
        res.status(200).json(userPosts);
    } catch (error) {
        res.status(500).json(error);
    }
})
// get user post
router.get('/user/userpost/:userId',async(req,res)=>{
    try {
        const currentUser = await UserModel.findById(req.params.userId);
        const userPosts = await PostModel.find({userId:currentUser._id});
        res.json(userPosts);
    } catch (error) {
        res.status(500).json(error);
    }
})
// comment in post
// update comment
// delete comment


module.exports = router;
