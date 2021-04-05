import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otpHex: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    country: {
      type: String,
    },
    photo: {
      type: String,
      default: 'user/default.png',
    },
    coverPhoto: {
      type: String,
      default: 'user/default.png',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refresh_token: {
      type: String,
    },
    online: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    receiveFollowRequest: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sendFollowRequest: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

schema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hashSync(this.password, salt);
});

const User = mongoose.model('User', schema);

export default User;
