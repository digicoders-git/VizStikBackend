import Branch from "../model/branchSubadmin.model.js";
import Prefield from "../model/prefield.model.js";

export const subLogin = async (req, res) => {
  try {
    const { name, password } = req.body
    const existBranch = await Branch.findOne({ name })
    if (!existBranch) {
      return res.status(401).json({ message: "branch not found" })
    }
    if (existBranch.password !== password) {
      return res.status(401).json({ message: "wrong password" })
    }
    const data = await Prefield.find({ Branch: name })
    res.status(200).json({ message: "branch login successful", total: data.length, data: data })
  } catch (error) {
    console.error("Create Branch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
}

export const mainLogin = async (req, res) => {
  try {
    const { role, name, password } = req.body
    if (role === "admin") {
      if (!name || !password) {
        return res.status(400).json({ message: "Please Enter email or password !" })
      }
      const existAdmin = await Admin.findOne({ name:email })
      if (!existAdmin) {
        return res.status(400).json({ message: "Admin not Found !" })
      }
      const passMatch = await bcrypt.compare(password, existAdmin.password)
      if (!passMatch) {
        return res.status(400).json({ message: "incorrect password !" })
      }
      let token;
      try {
        token = generateToken(existAdmin._id)
      } catch (error) {
        return res.status(500).json({ message: "Token not found !" })
      }
      return res.status(200).json({
        email: existAdmin.name,
        password: existAdmin.password,
        profilePhoto: existAdmin.profilePhoto,
        token
      })
    }
  } catch (error) {
    console.error("Create Branch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
}