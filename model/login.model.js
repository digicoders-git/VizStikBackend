import mongoose from 'mongoose'

const loginSchema = new mongoose.Schema({
  name:{
    type:String,
  },
  password:{
    type:String,
  },
  role:{
    type:String,
    enum:["admin","Branch","Circle_AM","Section_AE"]
  }
},{timestamps:true})

const Login = mongoose.model('Login',loginSchema)
export default Login