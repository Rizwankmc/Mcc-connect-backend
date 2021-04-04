import express from 'express';
import { chnageNotificationStatus } from '../controllers/adminControllers.js';
import { fetchRecentChats, fetchRecentChatUser } from '../controllers/messageControllers.js';
import { commentOnPost, createNewPost, deletePost, fetchPosts, fetchPostsByUser, likeComment, likePost, updatePost } from '../controllers/postControllers.js';
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
import { profileImage } from '../utils/imageUpload.js';

const router = express.Router();

// GET /api/user/myprofile Private
router.post('/myprofile', authService().protect, getUserDetails);

// POST /api/user/editProfile Private
router.post('/editprofile', authService().protect, editUserDetails);

// POST /api/user/uploadImagee Private
router.post('/uploadImage', profileImage.single('img'), authService().protect, uploadUserImage);

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


// .................... POST & COMMENT & LIKE .................. //

// POST create a new Post
router.post('/createPost', authService().protect, createNewPost);

// POST update a post
router.post('/updatePost', authService().protect, updatePost);

// POST delete a post
router.post('/deletePost', authService().protect, deletePost);

// POST fetch all post
router.post('/posts', authService().protect, fetchPosts);

// POST fetch  posts by User
router.post('/usersPost', authService().protect, fetchPostsByUser);

// POST like a post
router.post('/likePost', authService().protect, likePost);

// POST comment on a post
router.post('/commentPost', authService().protect, commentOnPost);

// POST like a comment
router.post('/likeComment', authService().protect, likeComment);

// ................... MESSAGE ROUTES .........................//

// POST fetch recent chat user
router.post('/fetchRecentUser', authService().protect, fetchRecentChatUser);

// POST fetch recent chats
router.post('/fetchRecentChats', authService().protect, fetchRecentChats);

export default router;
