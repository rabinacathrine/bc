const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required: [true, 'Enter a username.'],
        unique: [true, 'This username is taken.'],
        lowercase:true,
        validate: [validator.isAlphanumeric, 'Usernames may only have letters and numbers.'],
        min:1,
        max:20
    },
    email:{
        type:String,
        required: [true, 'Enter an email address.'],
        unique: [true, 'This email address already exists.'],
        lowercase: true,
        validate: [validator.isEmail, 'Enter a valid email address.']
    },
    password:{
        type:String,
        required: [true, 'Enter a password.'],
        minLength: [6, 'Password should be at least six characters']
    },
    confirmed:{
        type:Boolean,
        default:false
    },
    bio:{
        type:String,
        default:"",
        max:50
    },
    profilePicture:{
        type:String,
        default:"https://i.ibb.co/r0PgzHc/noAvatar.png"
    },
    followers:{
        type:Array,
        default:[]
    },
    following:{
        type:Array,
        default:[]
    }
},
{
    timestamps:true
},
{
    collection:'users'
});
//schema middleware to apply before saving
userSchema.pre('save', async function(next) {
    this.password = await bcrypt.hash(this.password, 10);
      next();
});
// model creation
const userModel = mongoose.model('users',userSchema)
module.exports = userModel
