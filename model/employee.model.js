import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */

    WD_Code:{
      type:String
    },
    Branch:{
      type:String
    },
    Govt_District:{
      type:String
    },
    Circle_AM:{
      type:String
    },
    Section_AE:{
      type:String
    },
    City:{
      type:String
    },
    typeOfDs:{
      type:String
    },
    dsName:{
      type:String
    },
    dsMobile:{
      type:String
    },

    /* ================= SHOPS ADDED BY EMPLOYEE ================= */

    addedShops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop"
      }
    ],

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true
    },

    /* ================= LOGIN TRACKING ================= */

    lastLogin: {
      type: Date,
      default: null
    },
    /* ================= OTP LOGIN ================= */

    otp: {
      type: String,
      default: null
    },

    otpExpire: {
      type: Date,
      default: null
    },
  },
  {
    timestamps: true,
    versionKey: false
  },

);



/* ================= METHODS ================= */

// Add shop to employee's addedShops
employeeSchema.methods.addShop = function (shopId) {
  if (!this.addedShops.includes(shopId)) {
    this.addedShops.push(shopId);
  }
  return this.save();
};

// Get employee with populated shops
employeeSchema.statics.getWithShops = function (employeeId) {
  return this.findById(employeeId).populate('addedShops');
};

/* ================= INDEX FOR PERFORMANCE ================= */
employeeSchema.index({ email: 1 });

export default mongoose.model("Employee", employeeSchema);
