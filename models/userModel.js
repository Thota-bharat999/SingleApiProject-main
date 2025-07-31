const mongoose=require("mongoose")
const userSchema=new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  loginToken: String,
  resetPasswordToken:String,
  resetPasswordExpires: Date,
})
module.exports=mongoose.model('User', userSchema)