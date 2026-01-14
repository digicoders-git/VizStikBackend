import mongoose from 'mongoose'

const outletSchema = new mongoose.Schema({
  activity: {
    type: String
  },
  outletMobile: {
    type: String
  },
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
  outletImages: [
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  }
}, { timestamps: true })

const Outlet = mongoose.model('Outlet', outletSchema)
export default Outlet