import express from 'express';
import { chnageNotificationStatus } from '../controllers/adminControllers.js';
import {
  editUserDetails,
  getUserDetails,
  uploadUserImage,
  editGamerTags,
  fetchGamerTags,
  changePassword,
  getMessage,
  unreadNotification,
  sendFollowRequest,
  acceptFollowRequest,
  cancelSendFollowRequest,
  cancelReceiveFollowRequest,
  unFollowRequest,
} from '../controllers/userControllers.js';
import authService from '../services/auth.service.js';

const router = express.Router();

// GET /api/user/myprofile Private
router.post('/myprofile', authService().protect, getUserDetails);

// POST /api/user/editProfile Private
router.post('/editprofile', authService().protect, editUserDetails);

// POST /api/user/uploadImagee Private
router.post('/uploadImage', authService().protect, uploadUserImage);





// user self change password
router.post('/changepassword', authService().protect, changePassword);


 

// POST /api/user/getUnreadNotification
router.post('/getUnreadNotification', authService().protect, unreadNotification);

// POST /api/user/readNotification
router.post('/readNotification', authService().protect, chnageNotificationStatus);



// POST /api/user/sendFollowRequest
router.post('/sendFollowRequest', authService().protect, sendFollowRequest);

// POST /api/user/acceptFollowRequest
router.post('/acceptFollowRequest', authService().protect, acceptFollowRequest);

// POST /api/user/cancelSendFollowRequest
router.post('/cancelSendFollowRequest', authService().protect, cancelSendFollowRequest);

// POST /api/user/cancelReceiveFollowRequest
router.post('/cancelReceiveFollowRequest', authService().protect, cancelReceiveFollowRequest);

// POST /api/user/unFollowRequest
router.post('/unFollowRequest', authService().protect, unFollowRequest);

export default router;
