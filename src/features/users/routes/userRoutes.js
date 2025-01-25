import express from 'express';
import {
  registerUserHandler,
  loginUserHandler,
  getUserProfileHandler,
} from '../controllers/userController.js';

import { authMiddleware } from '../../../middleware/authMiddleware.js';

const router = express.Router();


router.post('/register', registerUserHandler);
router.post('/login', loginUserHandler);
router.get('/:userId', getUserProfileHandler);

export default router;
