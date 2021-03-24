import mongoose from 'mongoose';

const schema = mongoose.Schema(
  {
    readStatus: {
      type: Boolean,
      default: false,
    },
    isAdminNotification: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    msg: {
      type: String,
    },
    link: {
      type: String,
    },
    fromAdmin: {
      type: Boolean,
    },
    photo: {
      type: String,
    },
  },
  { timestamps: true }
);

const NotificationModal = mongoose.model('Notification', schema);
export default NotificationModal;
