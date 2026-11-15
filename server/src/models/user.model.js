const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Recipient name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Recipient phone is required'],
    trim: true
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  zip: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [
        function() {
          return this.provider === 'local';
        },
        'Email is required'
      ],
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [
        function() {
          return this.provider === 'local';
        },
        'Password is required'
      ]
    },
    phone: {
      type: String,
      required: [
        function() {
          return this.provider === 'local' || this.provider === 'phone';
        },
        'Phone number is required'
      ],
      trim: true,
      index: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'phone'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    refreshToken: {
      type: String,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String
    },
    verificationTokenExpires: {
      type: Date
    },
    lastVerificationSentAt: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    addresses: [addressSchema]
  },
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
