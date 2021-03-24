import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    photo: {
      type: String,
      default: 'admin/default.png',
    },
    otpHex: {
      type: String,
    },

    // you can pass true just for testing
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    refresh_token: {
      type: String,
    },
    roles: {
      userManagement: {
        type: Boolean,
        default: false,
      },
      adminManagement: {
        type: Boolean,
        default: false,
      },
      gameManagement: {
        type: Boolean,
        default: false,
      },
      matchmakingManagement: {
        type: Boolean,
        default: false,
      },
      kycManagement: {
        type: Boolean,
        default: false,
      },
      withdrawManagement: {
        type: Boolean,
        default: false,
      },
      transactionManagement: {
        type: Boolean,
        default: false,
      },
      commissionManagement: {
        type: Boolean,
        default: false,
      },
    },
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

const AdminModel = mongoose.model('Admin', schema);

export default AdminModel;
