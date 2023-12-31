import { resFailure, resSuccess } from '../utils/responseObject.util.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  storage,
  deleteObject
} from '../utils/firebase.util.js';
import {
  createPhoto,
  deletePhoto,
  getAllPhotosForUserId,
  getPhoto,
  updatePhoto
} from '../services/photo.service.js';
import { photoErrors } from '../errors/photo.error.js';
import { updateStorage } from './helpers/photo.helper.js';

const UPDATE_STORAGE_INCREASE = 'increase';
const UPDATE_STORAGE_DECREASE = 'decrease';

export const uploadPhoto = async (req, res) => {
  try {
    let { captions } = req.body;
    const { user, files } = req;
    const userId = user.data.id;

    if (!Array.isArray(captions)) {
      captions = [captions];
    }

    if (!files.length) {
      return resFailure(res, photoErrors.PHOTO_NOT_PROVIDED);
    }

    const photosUploaded = await Promise.all(
      files.map(async (file, index) => {
        const caption = captions[index];
        const timestamp = Date.now();
        const refFileName = file.originalname.split('.')[0];
        const type = file.originalname.split('.')[1];
        // get the file size in bytes
        const size = parseInt(file.size);
        const fileName = `${refFileName}_${timestamp}.${type}`;

        const imageRef = ref(storage, fileName);

        await uploadBytes(imageRef, file.buffer);

        const url = await getDownloadURL(imageRef);

        const photo = await createPhoto(userId, url, size, caption);

        await updateStorage(req, res, size, UPDATE_STORAGE_INCREASE);

        return {
          id: photo.id,
          userId,
          url: photo.url,
          caption: photo.caption,
          size: photo.size
        };
      })
    );

    return resSuccess(res, 'Photo Uploaded Successfully', photosUploaded);
  } catch (err) {
    console.log(err.message);
    return resFailure(res, err.message);
  }
};

export const deletePhoto_ = async (req, res, next) => {
  try {
    let { id } = req.body;
    const { user } = req;
    const userId = user.data.id;
    let photoNotFound = false;
    let isAuthorized = true;

    id = [...new Set(id)];

    const photosToBeDeleted = await Promise.all(
      id.map(async (element) => {
        const photo = await getPhoto(element);
        if (!photo || photo.deletedAt) {
          photoNotFound = true;
        }

        if (photo && photo.userId !== parseInt(userId)) {
          isAuthorized = false;
        }
        return photo;
      })
    );

    if (photoNotFound) {
      return resFailure(res, photoErrors.PHOTO_NOT_EXISTENT);
    }

    if (!isAuthorized) {
      return resFailure(res, photoErrors.UNAUTHORIZED_RESOURCE_ACCESS, {}, 403);
    }

    id.forEach(async (element, index) => {
      const photo = photosToBeDeleted[index];

      const fileRef = ref(storage, photo.url);
      await deleteObject(fileRef);
      await deletePhoto(photo.id);
      await updateStorage(req, res, photo.size, UPDATE_STORAGE_DECREASE);
    });

    return resSuccess(res, 'Photo(s) Deleted Successfully');
  } catch (err) {
    console.log(err.message);
    return resFailure(res, err.message);
  }
};

export const updatePhoto_ = async (req, res, next) => {
  try {
    let { id } = req.body;
    id = parseInt(id);
    const { caption } = req.body;
    const { user, file } = req;
    const userId = user.data.id;

    if (!file && !caption) {
      return resFailure(res, photoErrors.UPDATE_FIELD_NOT_PROVIDED);
    }

    let photo = await getPhoto(id);

    if (!photo || photo.deletedAt) {
      return resFailure(res, photoErrors.PHOTO_NOT_EXISTENT);
    }

    if (photo.userId !== userId) {
      return resFailure(res, photoErrors.UNAUTHORIZED_RESOURCE_ACCESS, {}, 403);
    }

    const prevSize = photo.size;
    let downloadUrl = null;
    let size = null;
    // if the photo itself has to be updated
    if (file) {
      // delete the existing file from firebase
      const fileRef = ref(storage, photo.url);
      await deleteObject(fileRef);

      // upload the new file to firebase
      const timestamp = Date.now();
      const refFileName = file.originalname.split('.')[0];
      const type = file.originalname.split('.')[1];
      // get the file size in bytes
      size = parseInt(file.size);
      const fileName = `${refFileName}_${timestamp}.${type}`;

      const imageRef = ref(storage, fileName);

      await uploadBytes(imageRef, file.buffer);

      downloadUrl = await getDownloadURL(imageRef);
    }

    photo = await updatePhoto(id, {
      url: !downloadUrl ? photo.url : downloadUrl,
      size: !size ? photo.size : size,
      caption: !caption ? photo.caption : caption
    });

    const sizeDiff = prevSize - size;
    console.log('->>>>', prevSize, size, sizeDiff)
    if (prevSize < size) {
      await updateStorage(req, res, Math.abs(sizeDiff), UPDATE_STORAGE_INCREASE);
    } else if (prevSize > size) {
      await updateStorage(req, res, Math.abs(sizeDiff), UPDATE_STORAGE_DECREASE);
    }
    return resSuccess(res, 'Photo Uploaded Successfully', {
      id: photo.id,
      userId,
      url: photo.url,
      caption: photo.caption,
      size: photo.size
    });
  } catch (err) {
    console.log(err.message);
    return resFailure(res, err.message);
  }
};

export const getAllPhotos = async (req, res, next) => {
  try {
    const { user } = req;
    const allPhotos = await getAllPhotosForUserId(user.data.id);
    return resSuccess(res, 'My Photos Returned Successfully', { allPhotos });
  } catch (err) {
    console.log(err.message);
  }
};
