import Branch from "../model/branchSubadmin.model.js";
import Prefield from "../model/prefield.model.js";

export const subLogin = async (req, res) => {
  try {
    const {name, password} = req.body
    const existBranch = await Branch.findOne({name})
    if (!existBranch) {
      return res.status(401).json({message:"branch not found"})
    }
    if (existBranch.password !== password) {
      return res.status(401).json({message:"wrong password"})
    }
    const data = await Prefield.find({Branch:name})
    res.status(200).json({message:"branch login successful", total:data.length ,data: data})
  } catch (error) {
    console.error("Create Branch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
}