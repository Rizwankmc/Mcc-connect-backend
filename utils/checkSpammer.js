import MessageModel from '../models/gameChatModel.js';
export const isSpammer = async(gameId, userId) => {
    try{
    const find = await MessageModel.findOne({ gameId });
    let lastthree = find.chats.slice(Math.max(find.chats.length - 3, 0));
    console.log(lastthree)
    if(lastthree[0].userId.toString() === lastthree[1].userId.toString() && lastthree[1].userId.toString() === lastthree[2].userId.toString() && lastthree[2].userId.toString() === userId.toString()){
        return true
    }
    else
    return false
    }catch(err){
        console.log('Error in isSpammer =>', err);
        return false
    }
}