const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: true,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index: MongoDB auto-removes documents after expiresAt
    }
  },
  {
    timestamps: true
  }
);

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
module.exports = Otp;

