import express from 'express';

import {
  hasAuthToken,
  deletePhotoValidator,
  authenticateUser,
  updatePhotoValidator,
  checkStorageUpload
} from '../middlewares/photo.middleware.js';
import { validateResult } from '../utils/validationResult.util.js';
import { upload } from '../utils/multerStorage.util.js';
import {
  deletePhoto_,
  getAllPhotos,
  updatePhoto_,
  uploadPhoto
} from '../controllers/photo.controller.js';

export const photoRouter = express.Router();

photoRouter.post(
  '/upload',
  hasAuthToken,
  authenticateUser,
  upload.array('files'),
  checkStorageUpload,
  uploadPhoto
);

photoRouter.delete(
  '/delete',
  hasAuthToken,
  authenticateUser,
  deletePhotoValidator,
  validateResult,
  deletePhoto_
);

photoRouter.put(
  '/update-photo',
  hasAuthToken,
  authenticateUser,
  upload.single('file'),
  updatePhotoValidator,
  validateResult,
  updatePhoto_
);

photoRouter.get('/my-photos', hasAuthToken, authenticateUser, getAllPhotos);
