import GameTitle from "../models/game.js";
import TransactionModel from "../models/transactionModel.js";
import User from "../models/userModel.js";
import AdminWallet from "../models/walletModel.js";
import sentryCapture from "../services/sentry.service.js"

export const deductEntryFee = async(userId, entryFee, gameId) => {
    try {
        const game = await GameTitle.findOne({ _id: gameId });
        const deductAmount = await User.updateOne({ $and: [{ _id: userId }, {wallet: { $gte: entryFee }}]}, {
            $inc: {
                wallet: -entryFee
            }
        });
        if(deductAmount.nModified === 1 ) {
            const updateTransaction = await TransactionModel.create({
                source: game.gameName,
                isHold: false,
                isDeposit: false,
                amount: entryFee,
                userId
            });
            const wallet = await AdminWallet.find({});
            const commissionAmt = entryFee * wallet[0].commissionPercent / 100 
            const adminWallet = await AdminWallet.updateOne({_id:wallet[0]._id}, {
            $inc: {
                totalAmount: -entryFee,
                depositAmount: -entryFee,
                withdrawAmount: entryFee,
                totalCommission: commissionAmt
            }
            });
            if(adminWallet)
                return { commissionAmt };
        }else{
            return false
        }
    } catch (err) {
        sentryCapture(err);
        console.log('Error in deductEntryFee Function =>', err.message);
        return false;
    }
}