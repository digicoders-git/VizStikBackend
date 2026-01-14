import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["BRANCH", "CIRCLE", "SECTION"]
  }
})

const Branch = mongoose.model("Branch", branchSchema)
export default Branch
