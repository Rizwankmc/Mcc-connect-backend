import sentryCapture from '../services/sentry.service.js';
import UsersModel from '../models/userModel.js';
import fs from 'fs';
import multiparty from 'multiparty'; 
import NotificationModal from '../models/notification.js';
import User from '../models/userModel.js';

// fetch user details
export const getUserDetails = async (req, res) => {
  try {
    const { user } = req.body;

    const userfind = await UsersModel.findOne({ _id: user }).select('-password');
    if (userfind) {
      res.send({ code: 200, userInfo: userfind });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// edit User details API
export const editUserDetails = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const { userId } = req.body;

    const user = await UsersModel.updateOne(
      { _id: userId },
      {
        firstName,
        lastName,
        username
      }
    );
    if (user.nModified === 1) {
      res.send({ code: 200, msg: 'Profile Updated Successfully.' });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// edit User details API
export const uploadUserImage = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(req.file.path);
    const path = req.file.path.split('\\')
    const user = await UsersModel.updateOne(
      { _id: userId },
      {
        photo: path.join('/'),
      }
    );
    console.log(user)
    if (user.nModified === 1) {
      res.send({ code: 200, msg: 'Image Uploaded Successfully.' });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (e) {
    sentryCapture(e);
    console.log("Error in profile image upload =>", e.message);
    res.send({
      code: 404,
      msg: 'Some error occured!',
    });
  }
};

export const uploadUserCoverImage = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(req.file.path);
    const path = req.file.path.split('\\')
    const user = await UsersModel.updateOne(
      { _id: userId },
      {
        coverPhoto: path.join('/'),
      }
    );
    console.log(user)
    if (user.nModified === 1) {
      res.send({ code: 200, msg: 'Image Uploaded Successfully.' });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (e) {
    sentryCapture(e);
    console.log("Error in profile image upload =>", e.message);
    res.send({
      code: 404,
      msg: 'Some error occured!',
    });
  }
};
// edit gamer Tags API
export const editGamerTags = async (req, res) => {
  try {
    const { xbox, psn, epic, activision, steam } = req.body;
    const { userId } = req.body;

    const user = await UsersModel.updateOne(
      { _id: userId },
      {
        gamerTags: {
          xbox,
          psn,
          epic,
          activision,
          steam,
        },
      }
    );
    if (user.nModified === 1) {
      res.send({ code: 200, msg: 'Tags Updated Successfully.' });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// fetch user details
export const fetchGamerTags = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await UsersModel.findOne({ _id: userId }).select('-password');
    if (user) {
      res.send({ code: 200, GamerTags: user.gamerTags });
    } else {
      res.send({ code: 404, msg: 'User not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const changePassword = async (req, res) => {
  const user = await UsersModel.findOne({ _id: req.body.userId }).select('-password');
  if (user) {
    try {
      const hashPasword = await bcryptService().password(req.body.password);
      const updateUser = await UsersModel.updateOne(
        { _id: req.body.userId },
        { password: hashPasword }
      );
      if (updateUser) {
        res.send({ code: 200, msg: 'Password Changed successfully.' });
      } else {
        return res.send({ code: 300, msg: 'Unable to update Password' });
      }
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      res.send({ code: 500, msg: 'Internal Server Error' });
    }
  } else {
    return res.send({ code: 400, msg: 'Unathorised Access' });
  }
  return 0;
};

export const getMessage = async (req, res) => {
  try {
    const { gameId, matchId } = req.body;
    let latestMessage;
    if (gameId)
      latestMessage = await MessageModel.findOne({ gameId }).populate({
        path: 'chats.userId',
        select: '_id, photo',
      });
    else if (matchId)
      latestMessage = await MessageModel.findOne({ gameId: matchId }).populate({
        path: 'chats.userId',
        select: '_id, photo',
      });
    if (latestMessage && latestMessage.chats) {
      const chat = latestMessage.chats.slice(Math.max(latestMessage.chats.length - 10, 0));
      res.send({ code: 200, chats: chat });
    } else res.send({ code: 200, chats: [] });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in GetMessage ==>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const submitKyc = async (req, res) => {
  try {
    const { body } = req;
    const check = await UsersModel.findOne({ _id: body.userId });
    if (check) {
      const form = new multiparty.Form();
      form.parse(req, async (error, fields, files) => {
        if (error) throw new Error(error);
        try {
          const s3handler = async (filename) => {
            var path;
            var type;
            if (filename === 'idaddress') {
              path = files.idaddress[0].path;
              type = files.idaddress[0].originalFilename.split('.')[1];
            }
            if (filename === 'idback') {
              path = files.idback[0].path;
              type = files.idback[0].originalFilename.split('.')[1];
            }
            if (filename === 'idfront') {
              path = files.idfront[0].path;
              type = files.idfront[0].originalFilename.split('.')[1];
            }
            if (filename === 'idselfi') {
              path = files.idselfi[0].path;
              type = files.idselfi[0].originalFilename.split('.')[1];
            }

            const buffer = fs.readFileSync(path);
            const timestamp = Date.now().toString();
            const fileName = `bucketFolder/${timestamp}-lg`;
            const data = await sign_s3(buffer, fileName, type);
            return data.Location;
          };

          const payload = {
            firstName: fields.firstName[0],
            lastName: fields.lastName[0],
            dateOfBirth: fields.dateOfBirth[0],
            nationality: fields.nationality[0],
            country: fields.country[0],
            politicallyExposed: fields.politicallyExposed[0],
            paypalId: fields.paypalId[0],
            fullAddress: fields.fullAddress[0],
            stripe: fields.stripe[0],
            idProofFront: await s3handler('idfront'),
            idProofBack: await s3handler('idback'),
            idSelfi: await s3handler('idselfi'),
            addressProof: await s3handler('idaddress'),
          };

          if (check && check.kyc.kycId) {
            const kyc = await KycModel.updateOne({ _id: check.kyc.kycId }, payload);
            const ID = await UsersModel.findOne({ _id: body.userId }).select({ kyc: 1 });
            const user = await UsersModel.updateOne(
              { _id: body.userId },
              { kyc: { status: 'submited', kycId: ID.kyc.kycId } }
            );
            res.send({ code: 200, msg: 'Kyc Updated Succesfully' });
          } else {
            const kyc = await KycModel.create(payload);

            const user = await UsersModel.updateOne(
              { _id: body.userId },
              { kyc: { status: 'submited', kycId: kyc._id } }
            );
            res.send({ code: 200, msg: 'Kyc Submitted Succesfully' });
          }
        } catch (err) {
          sentryCapture(err);
          console.log(err);
          res.send({ code: 500, msg: 'Internal Server Error' });
        }
      });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in the submitkyc controller =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const kycStatus = async (req, res) => {
  try {
    const { body } = req;
    const status = await UsersModel.findOne({ _id: body.userId })
      .select({ kyc: 1 })
      .populate({ path: 'kyc.kycId' });

    if (status) {
      console.log('status ==> ', status);
      res.send({ code: 200, data: status, status: status.kyc.status });
    }
  } catch (err) {
    sentryCapture(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const unreadNotification = async (req, res) => {
  try {
    const { userId } = req.body;

    const unreadNotify = await NotificationModal.find({
      $and: [{ readStatus: false, userId }],
    }).sort({ _id: -1 });
    res.send({
      code: 200,
      notifications: unreadNotify,
      totalCount: unreadNotify.length,
      msg: 'Success',
    });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in unreadNotification =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const sendFollowRequest = async (req, res) => {
  try {
    const { userId, followingUser } = req.body;
    const follow = await User.updateOne({
      $and: [{ _id: userId }, { following: { $ne: followingUser } }]
    }, {
      $push: {
        following: followingUser,
      }
    });
    if (follow.nModified === 1) {
      res.send({ code: 200, msg: 'Follow request is send' });
      await User.updateOne({ _id: followingUser },
       {
        $push: {
          followers: userId,
        }
      });
    }else
    res.send({
      code: 300,
      msg: 'Either already following or send follow request',
    });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in sendFollowRequest =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const acceptFollowRequest = async (req, res) => {
  try {
    const { userId, followingUser } = req.body;
    const follow = await User.updateOne({
      $and: [{ _id: userId }, { follower: { $ne: followingUser } }, {receiveFollowRequest: {$eq: followingUser}}]
    }, {
      $push: {
        follower: followingUser,
      },
      $pop: {
        receiveFollowRequest: followingUser
      }
    });
    if (follow.nModified === 1) {
      res.send({ code: 200, msg: 'User added in your followers list' });
      await User.updateOne({ _id: followingUser },
        {
          $push: {
            following: userId,
          }
        });
    } else
      res.send({
        code: 300,
        msg: 'Either already following or send follow request',
      });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in acceptFollowRequest =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};


export const cancelSendFollowRequest = async (req, res) => {
  try {
    const { userId, followingUser } = req.body;

    const follow = await User.updateOne({
      $and: [{ _id: userId },{sendFollowRequest: {$eq: followingUser }}]
    }, {
      $pop: {
        sendFollowRequest: followingUser
      }
    });
    if (follow.nModified === 1) {
      res.send({ code: 200, msg: 'Send request is cancelled' });
    } else
      res.send({
        code: 300,
        msg: 'Either already following or send follow request',
      });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in cancelSendFollowRequest =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const cancelReceiveFollowRequest = async (req, res) => {
  try {
    const { userId, followingUser } = req.body;

    const follow = await User.updateOne({
      $and: [{ _id: userId }, { receiveFollowRequest: { $eq: followingUser } }]
    }, {
      $pop: {
        receiveFollowRequest: followingUser
      }
    });
    if (follow.nModified === 1) {
      res.send({ code: 200, msg: 'Receive request is cancelled' });
    } else
      res.send({
        code: 300,
        msg: 'Either already following or send follow request',
      });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in cancelReceiveFollowRequest =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const unFollowRequest = async (req, res) => {
  try {
    const { userId, followingUser } = req.body;

    const follow = await User.updateOne({
      $and: [{ _id: userId }, { following: { $eq: followingUser } }]
    }, {
      $pop: {
        following: followingUser
      }
    });
    if (follow.nModified === 1) {
      res.send({ code: 200, msg: 'Send request is cancelled' });
      await User.updateOne({ _id: followingUser },
        {
          $push: {
            follower: userId,
          }
        });
    } else
      res.send({
        code: 300,
        msg: 'Either already following or send follow request',
      });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in unFollowRequest =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};
