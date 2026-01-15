import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */

    WD_Code: {
      type: String
    },
    Branch: {
      type: String
    },
    Govt_District: {
      type: String
    },
    Circle_AM: {
      type: String
    },
    Section_AE: {
      type: String
    },
    City: {
      type: String
    },
    typeOfDs: {
      type: String
    },
    dsName: {
      type: String
    },
    dsMobile: {
      type: String
    },

    /* ================= SHOPS ADDED BY EMPLOYEE ================= */

    addedOutlet: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Outlet"
      }
    ],
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

    isVerified: {
      type: Boolean,
      default: false
    },
    tempData: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  },

);





/* ================= METHODS ================= */

// Add outlet to employee's addedOutlet
employeeSchema.methods.addOutlet = function (outletId) {
  if (!this.addedOutlet.includes(outletId)) {
    this.addedOutlet.push(outletId);
  }
  return this.save();
};

// Get employee with populated outlets
employeeSchema.statics.getWithOutlets = function (employeeId) {
  return this.findById(employeeId).populate('addedOutlet');
};

/* ================= INDEX FOR PERFORMANCE ================= */
employeeSchema.index({ email: 1 });

export default mongoose.model("Employee", employeeSchema);
