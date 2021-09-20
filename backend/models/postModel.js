const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    content:{
        type:String,
        max:500
    },
    image:{
        type:String,
        default:''
    },
    likes:{
        type:Array,
        default:[]
    },
    comments:{
        type:Array,
        default:[]
    }
},
{
    timestamps:true
},
{
    collection:'posts'
});

// model creation
const postModel = mongoose.model('posts',postSchema)
module.exports = postModel
