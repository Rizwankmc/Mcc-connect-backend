import express from 'express';
import {
  registerUser,
  login,
  resetPassword,
  forgetPassword,
  otpVerify,
} from '../controllers/authControllers.js';

const router = express.Router();

// registering  user
router.post('/register/user', registerUser);

// login
router.post('/login', login);

// verify user
router.post('/verify', otpVerify);

// resetPassword by user
router.post('/resetPassword', resetPassword);

// forgetPassword by user
router.post('/forgetPassword', forgetPassword);

export default router;
