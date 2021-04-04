import MessageModel from "../models/messageModel.js";

export const fetchRecentChatUser = async(req, res) => {
    try {
        const { userId } = req.body;
        const users = await MessageModel.find({ $or: [{ sender: userId }, { userId: { $elemMatch: userId } }] });
        if (users && users.length) {
            res.send({ code: 200, chatUsers: users });
        } else
            res.send({ code: 404, msg: 'No recent Chat User', chatUsers: []})
    } catch (err) {
        console.log('Error in fetchRecentChatUser Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal srver error' })
    }
}

export const fetchRecentChats = async (req, res) => {
    try {
        const { userId, chatWith } = req.body;
        const users = await MessageModel.find({ $or: [{ sender: userId }, { sender: chatWith }, { userId: { $elemMatch: userId } }, { userId: { $elemMatch: chatWith } }] });
        if (users && users.length) {
            res.send({ code: 200, chatUsers: users });
        } else
            res.send({ code: 404, msg: 'No recent Chat User', chatUsers: [] })
    } catch (err) {
        console.log('Error in fetchRecentChatUser Controller =>', err.message);
        res.send({ code: 500, msg: 'Internal srver error' })
    }
}