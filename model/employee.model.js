import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */

    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return v.includes("@") && v.includes(".");
        },
        message: "Please enter a valid email address"
      }
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },

    /* ================= PROFILE ================= */

    profilePhoto: {
      url: {
        type: String,
        default: ""
      },
      public_id: {
        type: String,
        default: ""
      }
    },

    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || v.length >= 10;
        },
        message: "Phone number must be at least 10 digits"
      }
    },

    designation: {
      type: String,
      trim: true,
      maxlength: [50, "Designation cannot exceed 50 characters"]
    },

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true
    },

    /* ================= LOGIN TRACKING ================= */

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/* ================= INDEX FOR PERFORMANCE ================= */
employeeSchema.index({ email: 1 });

/* ================= SAFE RESPONSE (HIDE PASSWORD) ================= */
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("Employee", employeeSchema);
