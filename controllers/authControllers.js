import UsersModel from '../models/userModel.js';
import authService from '../services/auth.service.js';
import bcryptService from '../services/bcrypt.service.js';
import sendEmail from '../services/mail.service.js';
import sentryCapture from '../services/sentry.service.js';
import { signupHTML, forgetHTML } from '../templates/signupHTML.js';
import generateOTP from '../utils/generateOtp.js';

// registering dealers account users
export const registerUser = async (req, res) => {
  console.log("-->>Singup", req.body);
  try {
    const { body } = req;
    const userExist = await UsersModel.findOne({
      $or:[{email: body.email}, {username: body.username}]
    });
    if (userExist) return res.send({ code: 402, msg: 'Email or Username already exists' });
    try {
      const otp = generateOTP();
      const user = await UsersModel.create({
        email: body.email,
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password,
        country: body.country,
        photo: body.photo,
        otpHex: otp,
        dateOfBirth: body.dateOfBirth,
      });
      const html = signupHTML(body.email, body.firstName, otp);
      sendEmail(html);
      return res.send({ code: 200, email: user.email, msg: 'Please Enter OTP to verify' });
    } catch (err) {
      console.log(err);
      return res.send({ code: 500, msg: 'Internal server error' });
    }
  } catch (err) {
    sentryCapture(err);
    console.log('error', err);
    return res.send({ code: 444, msg: 'Internal server error' });
  }
};

// logging user
export const login = async (req, res) => {
  const { email, password, remember } = req.body;
  if (email && password) {
    try {
      const user = await UsersModel.findOne({
        email,
      });
      if (user && user.isBlocked)
        return res.send({ code: 403, email: user.email, msg: 'User Blocked, Contact Admin.' });

      if (user && !user.isVerified)
        return res.send({ code: 400, email: user.email, msg: 'Please Verify OTP.' });
      if (!user) {
        return res.send({ code: 404, msg: 'User not found' });
      }
      if (bcryptService().comparePassword(password, user.password)) {
        const token = authService().issue({ id: user._id });

        console.log(user.id);

        if (remember) {
          const refresh_token = authService().refresh_issue({ id: user._id });
          await UsersModel.updateOne(
            {
              email,
            },
            { refresh_token }
          );
        }

        return res.send({ code: 200, token, username: user.username, userId: user.id });
      }
      return res.send({ code: 401, msg: 'Password is incorrect' });
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      return res.send({ code: 500, msg: 'Internal server error' });
    }
  }

  return res.send({
    code: 300,
    msg: 'Email or password is wrong',
  });
};

// forget Password
export const forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (email) {
    try {
      const user = await UsersModel.findOne({
        email,
      });
      if (!user) {
        return res.send({ code: 404, msg: 'User not found' });
      }
      const otp = generateOTP();
      const html = forgetHTML(user.email, user.username, otp);

      // eslint-disable-next-line no-underscore-dangle
      await UsersModel.updateOne({ _id: user._id }, { otpHex: otp });
      await sendEmail(html);
      return res.send({
        code: 200,
        username: user.username,
        email: user.email,
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
    msg: 'Email is required',
  });
};

// reset password API
export const resetPassword = async (req, res) => {
  const { password, email } = req.body;
  if (password && email) {
    try {
      const hashPasword = await bcryptService().password(password);
      const updateUser = await UsersModel.updateOne({ email }, { password: hashPasword });
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
    return res.send({ code: 400, msg: 'Password and Email is required' });
  }
  return 0;
};

// verfiy otp API
export const otpVerify = async (req, res) => {
  const { otp, email } = req.body;
  if (otp && email) {
    try {
      const user = await UsersModel.findOne({ email });
      if (!user) {
        return res.send({ code: 404, msg: 'User not Found' });
      }
      if (user.otpHex !== otp) return res.send({ code: 400, msg: 'Wrong OTP' });
      await UsersModel.updateOne({ email }, { isVerified: true });
      return res.send({ code: 200, email: user.email, username: user.username });
    } catch (err) {
      sentryCapture(err);
      console.log(err);
      res.send({ code: 500, msg: 'Internal Server Error' });
    }
  }
  return res.send({ code: 400, msg: ' OTP required' });
};
