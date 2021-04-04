import mongoose from 'mongoose';

const schema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        title: {
            type: String
        },
        tags: {
            type: String
        },
        description: {
            type: String
        },
        images: [{
            type: String
        }],
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        }]
    },
    { timestamps: true }
);

const PostModel = mongoose.model('Post', schema);

export default PostModel;
