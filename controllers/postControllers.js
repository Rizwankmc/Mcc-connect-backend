import CommentModel from "../models/commentModel.js";
import PostModel from "../models/postModel.js";

export const createNewPost = async (req, res) => {
    try {
        const { title, description, images, userId, tags } = req.body;
        const newPost = await PostModel.create({
            title,
            tags,
            description,
            images,
            userId
        });
        if (newPost) {
            res.send({ code: 200, msg: 'Post created successfully' })
        } else {
            res.send({ code: 402, msg: 'Some Error Occured' });
        }
    } catch (err) {
        console.log('Error in createNewPost Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const fetchPosts = async (req, res) => {
    try {
        const { page, pagination } = req.body;
        const recentPost = await PostModel.find({})
            .sort({ _id: -1 })
            .skip((page - 1) * pagination)
            .limit(pagination);
        res.send({ code: 200, posts: recentPost });
    } catch (err) {
        console.log('Error in fetchPosts Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const fetchPostsByUser = async (req, res) => {
    try {
        const { page, pagination, userId } = req.body;
        const recentPost = await PostModel.find({ userId })
            .sort({ _id: -1 })
            .skip((page - 1) * pagination)
            .limit(pagination);
        if(recentPost && recentPost.length)
            res.send({ code: 200, posts: recentPost });
        else
            res.send({ code: 404, msg:'No recent Post', posts: []})
    } catch (err) {
        console.log('Error in fetchPostsByUser Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const deletePost = async (req, res) => {
    try {
        const { userId, postId } = req.body;
        const deletedPost = await PostModel.deleteOne({ $and: [{ userId }, { _id: postId }] });
        if (deletedPost) {
            res.send({ code: 200, msg: 'Post deleted Successfully'})
        } else
            res.send({ code: 404, msg: 'No Such Post' })
    } catch (err) {
        console.log('Error in deletePost Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const updatePost = async (req, res) => {
    try {
        const { title, description, images, userId, tags,postId } = req.body;
        const updatePost = await PostModel.updateOne({ _id: postId },{
            title,
            tags,
            description,
            images,
            userId
        });
        if (updatePost) {
            res.send({ code: 200, msg: 'Post updated Successfully' })
        } else
            res.send({ code: 404, msg: 'No Such Post' })
    } catch (err) {
        console.log('Error in UpdatePost Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const likePost = async (req, res) => {
    try {
        const {userId, postId } = req.body;
        const updatePost = await PostModel.updateOne({ _id: postId }, {
            $push: {
                likes: userId
            }
        });
        if (updatePost) {
            res.send({ code: 200, msg: 'Post liked Successfully' })
        } else
            res.send({ code: 404, msg: 'No Such Post' })
    } catch (err) {
        console.log('Error in likePost Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const { userId, postId, comment } = req.body;
        const checkPost = await PostModel.findOne({ _id: postId })
        if (!checkPost)
            return res.send({ code: 404, msg: 'No Such Post' });
        await CommentModel.create({
            postId,
            userId,
            comment
        });
            res.send({ code: 200, msg: 'Commented Successfully' })
    } catch (err) {
        console.log('Error in commentOnPost Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}

export const likeComment = async (req, res) => {
    try {
        const { userId, commentId } = req.body;
        const updatePost = await CommentModel.updateOne({ _id: commentId }, {
            $push: {
                likes: userId
            }
        });
        if (updatePost) {
            res.send({ code: 200, msg: 'Comments liked Successfully' })
        } else
            res.send({ code: 404, msg: 'No Such Post' })
    } catch (err) {
        console.log('Error in likeComment Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal Server Error' })
    }
}