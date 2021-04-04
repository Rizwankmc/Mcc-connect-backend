import mongoose from 'mongoose'

const schema = mongoose.Schema({
    message: {
        type: String
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const MessageModel = mongoose.model('Message', schema);

export default MessageModel;