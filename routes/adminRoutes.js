import express from 'express';

import {
  addAdmin,
  addEntryFee,
  addGame,
  addGameVersion,
  addPlatform,
  blockUser,
  blockAdmin,
  getAllEntryFee,
  getAllSubAdmin,
  getCounts,
  getUser,
  getAllUsers,
  loginAdmin,
  editAdmin,
  deleteAdmin,
  resetPassword,
  forgetPassword,
  otpVerify,
  deleteUser,
  getAdminDetails,
  editAdminDetails,
  uploadAdminImage,
  changePassword,
  getAdmin,
  kycList,
  kycVerify,
  matchesList,
  fetchCommission,
  updateCommission,
  unreadNotification,
  chnageNotificationStatus,
  verifiedKycList,
  rejectedKycList,
  disputeMatchList,
  resolveDisputeMatch,
} from '../controllers/adminControllers.js';

import authService from '../services/auth.service.js';

const router = express.Router();
// ADMIN SECTION ------------------------------------------------------------------------------------------------------------

// POST /api/admin/login

router.post('/login', loginAdmin);

// ------------------------------------------------------- //
// -------------------------POST-------------------------- //
// ------------------------------------------------------- //

// POST /api/admin/addAdmin
router.post('/addAdmin', authService().protect, addAdmin);

// POST /api/admin/editAdmin
router.post('/editAdmin', authService().protect, editAdmin);
router.post('/getAdmin', authService().protect, getAdmin);

// POST /api/admin/forgetPassword
// self
router.post('/forgetpassword', forgetPassword);

router.post('/otpVerify', otpVerify);

// POST /api/admin/resetPassword
// self
router.post('/resetpassword', resetPassword);

// Delete /api/admin/deleteadmin
router.post('/deleteAdmin', authService().protect, deleteAdmin);

// GET /api/admin/getAllAdmin
router.post('/getAllAdmin', authService().protect, getAllSubAdmin);

// Block Particular admin
router.post('/blockadmin', authService().protect, blockAdmin);

/////   Admin Profile Section

router.get('/getAdminDetails', authService().protect, getAdminDetails);
router.post('/editAdminDetails', authService().protect, editAdminDetails);
router.post('/uploadAdminImage', authService().protect, uploadAdminImage);

router.post('/changepassword', authService().protect, changePassword);
// USER SECTION -----------------------------------------------------------------------------------------------------------------

// get All User
router.get('/getAllUser', authService().protect, getAllUsers);

// get User Info
router.get('/getUser', authService().protect, getUser);

// Block Particular User
router.post('/blockUser', authService().protect, blockUser);

// Delete /api/admin/deleteadmin
router.post('/deleteUser', authService().protect, deleteUser);



// ------------------------------------------------------- //
// -------------------------GET--------------------------- //
// ------------------------------------------------------- //

// GET /api/admin/getCount
router.get('/getCount', authService().protect, getCounts);

// GET /api/admin/getAllAdmin
router.get('/getAllAdmin', authService().protect, getAllSubAdmin);



// POST /api/admin/getUnreadNotification
router.post('/getUnreadNotification', authService().protect, unreadNotification);

// POST /api/admin/readNotification
router.post('/readNotification', authService().protect, chnageNotificationStatus);


export default router;
