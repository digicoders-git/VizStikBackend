import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    /* ================= BASIC SHOP INFO ================= */

    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 100
    },

    shopCode: {
      type: String,
      unique: true,
      trim: true,
      default: function () {
        return "SHOP-" + Math.floor(100000 + Math.random() * 900000);
      }
    },

    shopType: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    /* ================= OWNER INFO ================= */

    ownerName: {
      type: String,
      trim: true
    },

    ownerPhone: {
      type: String,
      trim: true
    },

    ownerEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    // ✅ OWNER IMAGE (SINGLE)
    ownerImage: {
      url: {
        type: String,
        default: ""
      },
      public_id: {
        type: String,
        default: ""
      }
    },

    /* ================= CONTACT INFO ================= */

    // phone: {
    //   type: String,
    //   required: [true, "Shop phone number is required"]
    // },

    // alternatePhone: {
    //   type: String
    // },

    // email: {
    //   type: String,
    //   lowercase: true
    // },

    /* ================= ADDRESS ================= */

    address: {
      type: String,
      required: true
    },

    city: {
      type: String,
      trim: true
    },

    state: {
      type: String,
      trim: true
    },

    pincode: {
      type: String,
      trim: true
    },

    country: {
      type: String,
      default: "India"
    },

    /* ================= LOCATION ================= */

    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },

    /* ================= SHOP IMAGES ================= */

    // ✅ SHOP IMAGES (MAX 2)
    shopImages: [
      {
        url: {
          type: String,
          required: true
        },
        public_id: {
          type: String,
          required: true
        }
      }
    ],

    /* ================= BUSINESS DETAILS ================= */

    gstNumber: {
      type: String,
      trim: true
    },

    openingTime: {
      type: String
    },

    closingTime: {
      type: String
    },

    isOpen: {
      type: Boolean,
      default: true
    },

    /* ================= STATUS ================= */

    isActive: {
      type: Boolean,
      default: true
    },

    /* ================= AUDIT ================= */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/* ================= INDEXES ================= */

shopSchema.index({ shopName: 1 });
shopSchema.index({ city: 1 });
shopSchema.index({ shopType: 1 });
shopSchema.index({ createdBy: 1 });
shopSchema.index({
  "location.latitude": 1,
  "location.longitude": 1
});

export default mongoose.model("Shop", shopSchema);
