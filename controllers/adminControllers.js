/* eslint-disable no-underscore-dangle */
/* eslint-disable radix */
import AdminModel from '../models/adminModel.js';
import UserModel from '../models/userModel.js';
import authService from '../services/auth.service.js';
import bcryptService from '../services/bcrypt.service.js';
import sendEmail from '../services/mail.service.js';
import sentryCapture from '../services/sentry.service.js';
import { signupHTML, forgetHTML, addAdminMail } from '../templates/signupHTML.js';
import generateOTP from '../utils/generateOtp.js';
import fs from 'fs';
import multiparty from 'multiparty';
import { sign_s3 } from '../utils/imageUpload.js';
import NotificationModal from '../models/notification.js';
import { match } from 'assert';

//----------------------------------------------------------------------------------------------
// Add Admin
// access = superadmin

export const addAdmin = async (req, res) => {
  try {
    const { body } = req;
    const adminExist = await AdminModel.findOne({
      email: body.email,
    });
    if (adminExist) return res.send({ code: 402, msg: 'email already exists' });
    const otp = generateOTP();
    const admin = await AdminModel.create({
      email: body.email,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
      country: body.country,
      photo: body.photo,
      otpHex: otp,
      roles: body.roles,
    });
    const html = addAdminMail(body.email, body.firstName, otp, body.password);
    sendEmail(html);
    return res.send({ code: 200, email: admin.email, msg: 'Admin added successfully' });
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    return res.send({ code: 500, msg: 'Internal server error' });
  }
};

//----------------------------------------------------------------------------------------------
// Delete subAdmin
// access = superadmin

export const deleteAdmin = async (req, res) => {
  try {
    const { body } = req;
    const checkadmin = await AdminModel.findOne({
      $and: [{ email: body.email }, { isSuperAdmin: false }],
    });
    if (checkadmin) {
      await AdminModel.deleteOne({
        email: body.email,
      });
      res.send({ code: 200, msg: `${checkadmin.username} Deleted Successfully` });
    } else {
      return res.send({ code: 401, msg: 'Admin Doesnt Exist' });
    }
    return 0;
  } catch (err) {
    return res.send({ code: 500, msg: 'Internal server error' });
  }
};

//----------------------------------------------------------------------------------------------
// Login Admin
// access = superadmin,subadmin

export const loginAdmin = async (req, res) => {
  const { email, password, remember } = req.body;

  if (email && password) {
    try {
      const admin = await AdminModel.findOne({
        email,
      });
      if (admin && !admin.isVerified)
        return res.send({ code: 400, email: admin.email, msg: 'Please Verify OTP.' });
      if (admin && admin.isDisabled)
        return res.send({ code: 402, email: admin.email, msg: 'Admin Disabled.' });
      if (!admin) {
        return res.send({ code: 404, msg: 'Admin not found' });
      }
      if (bcryptService().comparePassword(password, admin.password)) {
        const token = authService().issue({ id: admin.id });

        if (remember) {
          const refresh_token = authService().refresh_issue({ id: admin.id });
          await AdminModel.updateOne(
            {
              email,
            },
            { refresh_token }
          );

          return res.send({
            code: 200,
            token,
            username: admin.username,
            superadmin: admin.isSuperAdmin,
            roles: admin.roles,
          });
        } else {
          await AdminModel.updateOne(
            {
              email,
            },
            { refresh_token: '' }
          );
          return res.send({
            code: 200,
            token,
            username: admin.username,
            superadmin: admin.isSuperAdmin,
            roles: admin.roles,
          });
        }
      }
      return res.send({ code: 401, msg: 'Password is incorrect' });
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      return res.send({ code: 500, msg: 'Internal server error' });
    }
  }
  return res.send({
    code: 400,
    msg: 'Bad Request: Email or password is wrong',
  });
};

//----------------------------------------------------------------------------------------------
// get all sub-admin
// access = superadmin

export const getAllSubAdmin = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);
    const adminList = await AdminModel.find({ _id: { $ne: req.body.userId } })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);
    const listCount = await AdminModel.countDocuments({ _id: { $ne: req.body.userId } });

    res.send({ code: 200, list: adminList, total: listCount });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllSubAdmin =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

//----------------------------------------------------------------------------------------------
// forget password
// access = self

// forget Password
export const forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (email) {
    try {
      const admin = await AdminModel.findOne({
        email,
      });
      if (!admin) return res.send({ code: 404, msg: 'Bad Request: Admin not found' });
      const otp = generateOTP();
      await AdminModel.updateOne({ _id: admin._id }, { otpHex: otp });

      const html = forgetHTML(email, admin.username, otp);
      await sendEmail(html);
      return res.send({
        code: 200,
        username: admin.username,
        email: admin.email,
        msg: 'OTP send to Your Email.',
      });
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      return res.send({ code: 500, msg: 'Internal server error' });
    }
  }
  return res.send({
    code: 400,
    msg: 'Bad Request: Email is required',
  });
};

//----------------------------------------------------------------------------------------------
// otp Verify
// access = self
// verfiy otp API

export const otpVerify = async (req, res) => {
  const { otp, email } = req.body;
  if (otp && email) {
    try {
      const admin = await AdminModel.findOne({ email });
      if (!admin) {
        return res.send({ code: 404, msg: 'Admin not Found' });
      }
      if (admin.otpHex !== otp) return res.send({ code: 400, msg: 'Wrong OTP' });
      await AdminModel.updateOne({ email }, { isVerified: true });
      return res.send({ code: 200, email: admin.email, username: admin.username });
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      res.send({ code: 500, msg: 'Internal Server Error' });
    }
  }
  return res.send({ code: 400, msg: ' OTP required' });
};

//----------------------------------------------------------------------------------------------
// reset password
// access = self
export const resetPassword = async (req, res) => {
  const { password, email } = req.body;
  if (password && email) {
    try {
      const hashPasword = await bcryptService().password(password);
      const updateAdmin = await AdminModel.updateOne({ email }, { password: hashPasword });
      if (updateAdmin) {
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
    return res.send({ code: 400, msg: 'Password and Email is required' });
  }
  return 0;
};

//----------------------------------------------------------------------------------------------
// Get User Detail
// access = superadmin,subadmin

export const getUser = async (req, res) => {
  try {
    const { body } = req;
    const User = await UserModel.find({ email: body.email });
    res.send({ code: 200, UserData: User });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getUser =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

//----------------------------------------------------------------------------------------------
// Get All Users
// access = superadmin,subadmin

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);

    const pagedUser = await UserModel.find({})
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);

    const allUser = await UserModel.countDocuments({});

    res.send({ code: 200, list: pagedUser, total: allUser });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllUser =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

//----------------------------------------------------------------------------------------------
// Block A User
// access = superadmin,subadmin

export const blockUser = async (req, res) => {
  try {
    const { body } = req;

    const checkuser = await UserModel.findOne({ email: body.email });
    if (!checkuser) return res.send({ code: 402, msg: "User Doesn't exists" });

    const User = await UserModel.updateOne(
      {
        email: body.email,
      },
      {
        isBlocked: !checkuser.isBlocked,
      }
    );

    if (User.nModified === 1) {
      res.send({
        code: 200,
        msg: `User ${checkuser.isBlocked ? 'Unblocked' : 'Blocked'} Successfully`,
      });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in blocking User =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
  return 0;
};

//----------------------------------------------------------------------------------------------
// Block A sub-Admin
// access = superadmin

export const blockAdmin = async (req, res) => {
  try {
    const { body } = req;
    const checkuser = await AdminModel.findOne({ email: body.email });
    if (!checkuser) return res.send({ code: 402, msg: "Admin Doesn't exists" });

    const admin = await AdminModel.updateOne(
      {
        email: body.email,
      },
      {
        isDisabled: !checkuser.isDisabled,
      }
    );

    if (admin.nModified === 1) {
      res.send({
        code: 200,
        msg: `Admin ${checkuser.isDisabled ? 'Unblocked' : 'Blocked'} Successfully`,
      });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in blocking admin =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }

  return 0;
};

//----------------------------------------------------------------------------------------------
// Edit subAdmin
// access = superadmin

export const editAdmin = async (req, res) => {
  try {
    const { body } = req;

    const checkadmin = await AdminModel.findOne({ email: req.body.email });

    if (!checkadmin) return res.send({ code: 402, msg: "Admin Doesn't exists" });

    const admin = await AdminModel.updateOne(
      { email: req.body.email },
      {
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
        country: body.country,
        roles: body.roles,
      }
    );
    if ((await admin.nModified) === 1) {
      res.send({ code: 200, msg: 'Profile Updated Successfully.' });
    } else {
      res.send({ code: 404, msg: 'Admin not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in EditProfile =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
  return 0;
};

//  below updates are made by rizwan sir
// admin
export const addEntryFee = async (req, res) => {
  try {
    const { body } = req;
    const entry = await EntryFee.create({
      title: body.title,
      description: body.description,
    });
    if (entry) {
      res.send({ code: 200, msg: 'Entry Added Successfully.' });
    } else res.send({ code: 200, msg: 'Some error Occuered' });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in addEntryFee =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// admin or superadmin
export const getAllEntryFee = async (req, res) => {
  try {
    const data = await EntryFee.find({});
    res.send({ code: 200, data });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in addEntryFee =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const addGame = async (req, res) => {
  try {
    const { body } = req;
    const form = new multiparty.Form();
    form.parse(req, async (error, fields, files) => {
      if (error) throw new Error(error);
      try {
        const { path } = files.photo[0];
        const buffer = fs.readFileSync(path);
        const type = files.photo[0].originalFilename.split('.')[1];
        const timestamp = Date.now().toString();
        const fileName = `bucketFolder/${timestamp}-lg`;
        const data = await sign_s3(buffer, fileName, type);
        if (data.Location) {
          const game = await GameTitle.create({
            gameName: fields.gameName[0],
            description: fields.description[0],
            category: fields.category[0],
            photo: data.Location,
            addBy: body.userId,
          });
          if (game) {
            res.send({ code: 200, msg: 'Add Successfully.' });
          } else {
            res.send({ code: 404, msg: 'Some Error Occured' });
          }
        }
      } catch (err) {
        sentryCapture(err);
        console.log(err);
        res.send({ code: 500, msg: 'Internal Server Error' });
      }
    });
  } catch (e) {
    sentryCapture(e);
    console.log(e);
    res.send({
      code: 404,
      msg: 'Some error occured!',
    });
  }
};
export const addGameVersion = async (req, res) => {
  try {
    const { body } = req;

    const game = await GameModel.create({
      gameName: body.gameName,
      description: body.description,
      category: body.category,
      rules: body.rules,
      photo: body.photo,
      formate: body.formate,
      addBy: body.userId,
    });
    if (game) {
      await PlatformModel.updateOne(
        { _id: body.platformId },
        {
          $push: {
            games: game.id,
          },
        }
      );
      res.send({ code: 200, msg: 'Added Successfully.' });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in addGameVersion =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// admin or superadmin
export const addPlatform = async (req, res) => {
  try {
    const { body } = req;
    const platform = await PlatformModel.create({
      name: body.name,
      description: body.description,
      addBy: body.userId,
    });
    if (platform) {
      await GameTitle.updateOne(
        { _id: body.gameId },
        {
          $push: {
            platform: platform.id,
          },
        }
      );
      res.send({ code: 200, msg: 'Platform Added Successfully ' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in addGame =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// public access
export const getAllGame = async (req, res) => {
  try {
    const game = await GameTitle.find({});
    if (game) {
      res.send({ code: 200, games: game });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllGame =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const getAllGameVersionByPlatformId = async (req, res) => {
  try {
    const { body } = req;
    const { games } = await PlatformModel.findOne({ _id: body.platformId });
    const game = await GameModel.find().where('_id').in(games).exec();
    if (game) {
      res.send({ code: 200, games: game });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllGame =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const getAllPlatformByGameId = async (req, res) => {
  try {
    const { body } = req;
    const { platform } = await GameTitle.findOne({ _id: body.gameId });
    const platforms = await PlatformModel.find().where('_id').in(platform).exec();
    if (platforms) {
      res.send({ code: 200, platforms });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllPlatform =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const getCounts = async (req, res) => {
  try {
    const data = {};
    data.users = await UserModel.countDocuments();
    data.subAdmin = await AdminModel.countDocuments({ isSuperAdmin: false });
    data.superAdmin = await AdminModel.countDocuments({ isSuperAdmin: true });
    data.blockedUsers = await UserModel.countDocuments({ isBlocked: true });
    data.blockedSubAdmin = await AdminModel.countDocuments({ isDisabled: true });
    data.games = await GameTitle.countDocuments();
    data.online = await UserModel.countDocuments({ online: true });
    data.wallet = await AdminWallet.find({});

    if (data) {
      res.send({ code: 200, list: data });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getCounts =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { body } = req;
    const user = await UserModel.findOne({
      email: body.email,
    });
    if (user) {
      await UserModel.deleteOne({
        email: body.email,
      });
      res.send({ code: 200, msg: `${user.username} Deleted Successfully` });
    } else {
      return res.send({ code: 400, msg: 'User Not Found' });
    }
    return 0;
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    return res.send({ code: 500, msg: 'Internal server error' });
  }
};

export const getAllGameVersion = async (req, res) => {
  try {
    const game = await GameModel.find({});
    if (game) {
      res.send({ code: 200, games: game });
    } else {
      res.send({ code: 300, msg: 'Some Error Occured' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllGame =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// Admin Profile Section

// fetch Admim details
export const getAdminDetails = async (req, res) => {
  try {
    const { userId } = req.body;

    const admin = await AdminModel.findOne({ _id: userId }).select('-password');
    if (admin) {
      res.send({ code: 200, adminInfo: admin });
    } else {
      res.send({ code: 404, msg: 'Admin not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// edit Admin details API
export const editAdminDetails = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const { userId } = req.body;
    const admin = await AdminModel.updateOne(
      { _id: userId },
      {
        firstName,
        lastName,
        username,
      }
    );
    if (admin.nModified === 1) {
      res.send({ code: 200, msg: 'Profile Updated Successfully.' });
    } else {
      res.send({ code: 404, msg: 'Admin not Found' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

// edit Admin Photo API
export const uploadAdminImage = async (req, res) => {
  try {
    const { userId } = req.body;

    const form = new multiparty.Form();
    form.parse(req, async (error, files) => {
      if (error) throw new Error(error);
      try {
        console.log(files);
        const { path } = files.photo[0];
        const buffer = fs.readFileSync(path);
        const type = files.photo[0].originalFilename.split('.')[1];
        const timestamp = Date.now().toString();
        const fileName = `bucketFolder/${timestamp}-lg`;
        const data = await sign_s3(buffer, fileName, type);
        if (data.Location) {
          const user = await AdminModel.updateOne(
            { _id: userId },
            {
              photo: data.Location,
            }
          );
          if (user.nModified === 1) {
            res.send({ code: 200, msg: 'Image Uploaded Successfully.' });
          } else {
            res.send({ code: 404, msg: 'User not Found' });
          }
        }
      } catch (err) {
        sentryCapture(err);
        console.log(err);
        res.send({ code: 500, msg: 'Internal Server Error' });
      }
    });
  } catch (e) {
    sentryCapture(e);
    console.log(e);
    res.send({
      code: 404,
      msg: 'Some error occured!',
    });
  }
};

export const changePassword = async (req, res) => {
  const user = await AdminModel.findOne({ _id: req.body.userId }).select('-password');
  if (user) {
    try {
      const hashPasword = await bcryptService().password(req.body.password);
      const updateUser = await AdminModel.updateOne(
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

// fetch Admim details
// access superadmin

export const getAdmin = async (req, res) => {
  try {
    const { body } = req;
    const checkadmin = await AdminModel.findOne({ email: body.email });

    if (!checkadmin) return res.send({ code: 402, msg: "Admin Doesn't exists" });

    return res.send({ code: 200, admininfo: checkadmin });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getProfile =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
  return 0;
};

export const kycList = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);
    const kyc = await UserModel.find({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'submited' } }],
    })
      .select({ kyc: 1, email: 1 })
      .populate({ path: 'kyc.kycId' })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);

    const total = await UserModel.countDocuments({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'submited' } }],
    });

    res.send({ code: 200, list: kyc, total });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllKyc =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const kycVerify = async (req, res) => {
  try {
    const { body } = req;
    const mod = await UserModel.updateOne(
      { 'kyc.kycId': body.kycId },
      { 'kyc.status': body.status === 'verify' ? 'verified' : 'rejected' }
    );
    if (mod.nModified === 1) {
      res.send({
        code: 200,
        msg: body.status === 'verify' ? 'Verified Successfully' : 'Rejected Successfully',
      });
    } else {
      res.send({ code: 500, msg: 'Internal Server Error' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('Error in Verify =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const matchesList = async (req, res) => {
  try {
    const { page, pagination } = req.body;
    const list = await DirectChallenge.find({})
      .populate({ path: 'players', select: { username: 1, photo: 1 } })
      .populate({ path: 'gameId', select: { category: 1, gameName: 1 } })
      .populate({ path: 'platformId', select: 'name' })
      .populate({ path: 'gameVersionId', select: { gameName: 1, formate: 1, rules: 1 } })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);
    const totalCount = await DirectChallenge.countDocuments({});
    res.send({ code: 200, list, totalCount });
  } catch (error) {
    sentryCapture(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const fetchCommission = async (req, res) => {
  try {
    const walletConfiguration = await AdminWallet.find({});
    res.send({ code: 200, walletConfiguration });
  } catch (err) {
    sentryCapture(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const updateCommission = async (req, res) => {
  try {
    const { Id } = req.body;
    const wallet = await AdminWallet.updateOne({ _id: Id }, req.body);
    if (wallet.nModified === 1) {
      res.send({ code: 200, msg: 'Updated Successfully.' });
    } else res.send({ code: 300, msg: 'Some Error Occured' });
  } catch (err) {
    sentryCapture(err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const unreadNotification = async (req, res) => {
  try {
    const { userId } = req.body;

    const unreadNotify = await NotificationModal.find({
      $and: [{ readStatus: false, isAdminNotification: true }],
    });
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

export const chnageNotificationStatus = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const updateStatus = await NotificationModal.updateOne(
      {
        _id: notificationId,
      },
      { readStatus: true }
    );
    if (updateStatus.nModified === 1) res.send({ code: 200, msg: 'success' });
    else res.send({ code: 404, msg: 'Not found' });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in readNotification =>', err.message);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const verifiedKycList = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);

    const kyc = await UserModel.find({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'verified' } }],
    })
      .select({ kyc: 1, email: 1 })
      .populate({ path: 'kyc.kycId' })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);

    const total = await UserModel.countDocuments({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'verified' } }],
    });

    res.send({ code: 200, list: kyc, total });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllKyc =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const rejectedKycList = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);

    const kyc = await UserModel.find({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'rejected' } }],
    })
      .select({ kyc: 1, email: 1 })
      .populate({ path: 'kyc.kycId' })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);

    const total = await UserModel.countDocuments({
      $and: [{ kyc: { $exists: true } }, { 'kyc.status': { $eq: 'rejected' } }],
    });

    res.send({ code: 200, list: kyc, total });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in getAllKyc =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const disputeMatchList = async (req, res) => {
  try {
    const page = parseInt(req.body.page);
    const pagination = parseInt(req.body.pagination);
    const total = await DirectChallenge.countDocuments({
      $and:[{'result.isDenied': {$eq: 2 }}, {'result.isDisputeResolved': false }]
    });

    const matches = await DirectChallenge.find({
      $and: [{ 'result.isDenied': { $eq: 2 } }, { 'result.isDisputeResolved': false }]
    }).populate({ path: 'players', select: { username: 1, photo: 1 } })
      .populate({ path: 'gameId', select: { category: 1, gameName: 1 } })
      .populate({ path: 'platformId', select: 'name' })
      .populate({ path: 'gameVersionId', select: { gameName: 1, formate: 1, rules: 1 } })
      .sort({ _id: -1 })
      .skip((page - 1) * pagination)
      .limit(pagination);

    res.send({ code: 200, list: matches, total });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in disputeMatchList =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};

export const resolveDisputeMatch = async (req, res) => {
  try {
    const { winner, winnerScore, loserScore, matchId } = req.body;

    const matches = await DirectChallenge.updateOne({ _id: matchId }, {
      'result.winner': winner,
      'result.loserScore': loserScore,
      'result.winnerScore': winnerScore,
      'result.isDisputeResolved': true
    })
    if(matches.nModified === 1)
      res.send({ code: 200, msg: 'Dispute Resolved.' });
    else
      res.send({ code: 404, msg: 'Match not Found.' });
  } catch (err) {
    sentryCapture(err);
    console.log('Error in resolveDispiteMatch =>', err);
    res.send({ code: 500, msg: 'Internal Server Error' });
  }
};