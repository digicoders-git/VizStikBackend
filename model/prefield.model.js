import mongoose from "mongoose";

const prefieldSchema = new mongoose.Schema(
  {
    Branch: String,
    Govt_District: String,
    Circle_AM: String,
    Section_AE: String,
    City: String,
    WD_Code: String
  },
  { timestamps: false }
);

// ⚠️ IMPORTANT: third parameter = exact collection name from MongoDB
export default mongoose.model("Prefield", prefieldSchema, "Prefields");
