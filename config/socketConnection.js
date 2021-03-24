import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import sentryCapture from '../services/sentry.service.js';
import NotificationModal from '../models/notification.js';

const socketConnection = (io) => {
  const secret = process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : 'secret';
  io.users = [];
  io.count = 0;

  io.on('connection', async (socket) => {
    try {
      io.count++;
      console.log(io.count, ' user connected===>', socket.id);
      let token = socket.request._query['token'];
      if (token !== 'undefined') {
        const checkVerify = await jwt.verify(token, secret);
        if (checkVerify) {
          //socket.id = checkVeify.userid;
          let lastSocketData = io.users;
          lastSocketData.push(checkVerify.id);
          io.users = lastSocketData;
          socket.customId = checkVerify.id;
          const m = await UserModel.updateOne(
            {
              _id: checkVerify.id,
            },
            {
              online: true,
            }
          );
          console.log(checkVerify.id);
          const admin = await AdminModel.findOne({ _id: checkVerify.id });
          const user = await UserModel.findOne({ _id: checkVerify.id });
          if (user) {
            socket.join(checkVerify.id.toString() + 'notify');
          } else if (admin) {
            socket.join('admin');
          }
          const gameRoom = await GameTitle.find({});
          for (const game of gameRoom) {
            socket.join(game._id.toString());
          }
        }
      }
    } catch (e) {
      console.log('error in connect block', e.message);
    }

    socket.on('joinGameRoom', (data) => {
      socket.rooms.forEach((item, i) => {
        if (i !== 0 && item.toString().search('notify') === -1) socket.leave(item.toString());
      });
      socket.join(data.gameId);
    });
    socket.on('newMatch', async (data) => {
      const { entryFee, gameTypeId, platformId, rules, gameVersionId, formateId, userId } = data;
      try {
        const userMatches = await MatchMaking.find({ userId: userId });
        if (userMatches.length === 2) {
          return socket.emit('matchFull');
        }
        const deductFee = await deductEntryFee(userId, entryFee, gameTypeId);
        if (!deductFee) {
          socket.emit('lowBalance');
          return false;
        }
        const opponent = await MatchMaking.findOne({
          $and: [
            { entryFee: entryFee },
            { gameVersionId: gameVersionId },
            { formate: formateId },
            { userId: { $ne: userId } },
          ],
        }).populate({ path: 'userId' });

        if (opponent) {
          const game = await DirectChallenge.create({
            gameId: gameTypeId,
            players: [userId, opponent.userId],
            platformId,
            gameVersionId,
            entryFee,
            formate: formateId,
            rules,
            winningAmt: (entryFee - deductFee.commissionAmt) * 2,
          });

          await MatchMaking.deleteOne({
            $and: [
              { entryFee: entryFee },
              { gameVersionId: gameVersionId },
              { formate: formateId },
              { userId: { $ne: userId } },
            ],
          });
          socket.emit('playerMatched', {
            userId: opponent.userId._id,
          });
        } else {
          await MatchMaking.create({
            gameId: gameTypeId,
            userId,
            entryFee,
            formate: formateId,
            rules,
            gameVersionId,
            platformId,
          });
          socket.emit('matchCreated');
        }

        const newMatch = await MatchMaking.find({})
          .populate({
            path: 'gameVersionId',
          })
          .populate({
            path: 'platformId',
          })
          .populate({
            path: 'gameId',
          })
          .lean();
        io.sockets.emit('instantMatch', newMatch);
      } catch (err) {
        sentryCapture(err);
        console.log('Error in newMatch Socket ==>', err.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        console.log('disconnected', socket.id);
        io.count--;
        //code for ofline the user when disconnected
        const lastSockets = io.users;
        let filteredSockets = lastSockets.filter((el) => el === socket.customId);
        if (filteredSockets.length > 0) {
          let index = lastSockets.indexOf(socket.customId);
          if (index !== -1) lastSockets.splice(index, 1);
          io.users = lastSockets;
          if (filteredSockets.length === 1) {
            await UserModel.updateOne(
              {
                _id: socket.customId,
              },
              {
                online: false,
              }
            );
          }
          socket.customId = null;
        }
      } catch (e) {
        console.log('error in disconnect block');
      }
      console.log('Player gone!');
    });

    socket.on('sendMessage', async (data) => {
      const spammer = await isSpammer(data.gameId, data.userId);
      if (spammer) {
        console.log('Spammer');
        setTimeout(() => {
          socket.emit('unBlockSpammer');
        }, 60000);
        return socket.emit('Spammer');
      }

      const find = await MessageModel.findOne({ gameId: data.gameId });

      if (find) {
        const messageappend = await MessageModel.updateOne(
          {
            gameId: data.gameId,
          },
          {
            $push: {
              chats: {
                userId: data.userId,
                message: data.message,
              },
            },
          }
        );
      } else {
        let gameRoom = '';
        const gameDetails = await GameTitle.findOne({ _id: data.gameId });
        if (data.matchId) gameRoom = 'Match Chat';
        else gameRoom = gameDetails.gameName;

        const messageappend = await MessageModel.create({
          roomName: gameRoom,
          gameId: data.gameId,
          chats: [
            {
              userId: data.userId,
              message: data.message,
            },
          ],
        });
      }

      const latestMessage = await MessageModel.findOne({ gameId: data.gameId }).populate({
        path: 'chats.userId',
        select: '_id, photo',
      });
      io.in(data.gameId).emit('newMessage', latestMessage);
    });

    // Notification Sockets
    socket.on('notifyUser', async (data) => {
      try {
        const { userId, msg, fromAdmin, photo, link } = data;
        console.log('Notification', data);
        const newNotification = await NotificationModal.create({
          userId,
          isAdminNotification: false,
          fromAdmin,
          msg,
          photo,
          link,
        });
        if (newNotification) io.in(userId + 'notify').emit('newNotificationUser', data);
      } catch (err) {
        console.log('Error in NotifyUser socket =>', err.message);
        sentryCapture(err);
      }
    });
    socket.on('notifyAdmin', async (data) => {
      console.log(data);
      try {
        const { userId, msg, photo, link } = data;
        const newNotification = await NotificationModal.create({
          userId,
          isAdminNotification: true,
          fromAdmin: false,
          msg,
          photo,
          link,
        });
        if (newNotification) {
          const unreadNotification = await NotificationModal.find({
            $and: [{ isAdminNotification: true }, { readStatus: false }],
          });
          io.in('admin').emit('newNotificationAdmin', unreadNotification);
        }
      } catch (err) {
        console.log('Error in NotifyAdmin socket =>', err.message);
        sentryCapture(err);
      }
    });
  });
};

export default socketConnection;
