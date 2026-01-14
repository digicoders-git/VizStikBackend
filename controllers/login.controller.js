import generateToken from "../config/token.js";
import Login from "../model/login.model.js";

/* =========================
   CREATE LOGIN USER
========================= */
export const createLoginUser = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, password and role are required"
      });
    }

    // Check already exists
    const exist = await Login.findOne({ name });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this name"
      });
    }

    const user = await Login.create({
      name,
      password,   // 👈 plain text save
      role
    });

    res.status(201).json({
      success: true,
      message: "Login user created successfully",
      data: user
    });

  } catch (error) {
    console.error("Create Login User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const loginUser = async (req,res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({message:"Please Enter All Fields"})
    }
    const user = await Login.findOne({name})
    if (!user) {
      return res.status(400).json({message:"User Not Found"})
    }
    if(user.password !== password){
      return res.status(400).json({message:"Incorrect Password"})
    }
    let token;
    try {
      token = generateToken(user._id)
    } catch (error) {
      return res.status(500).json({ message: "Token not found !" })
    }
    return res.status(200).json({
      name: user.name,
      password: user.password,
      role: user.role,
      token
    })
  } catch (error) {
    console.error("Create Login User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
}