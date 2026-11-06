const mongoose = require('mongoose');
  
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,

    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: ''
       
    },
    Bio: {
        type: String,
        default: ''
    },
    role:{
        type:String,
        default:'user'
    }
})
const users=mongoose.model('users', userSchema)


module.exports=users;