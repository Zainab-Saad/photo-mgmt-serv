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

export const uploadPhoto = async (req, res) => {
  try {
    const { user, file } = req;
    const { caption } = req.body;
    const userId = user.data.id;
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

export const deletePhoto_ = async (req, res, next) => {
  try {
    const { id } = req.body;
    let photoNotFound = false;

    const photosToBeDeleted = await Promise.all(
      id.map(async (element) => {
        const photo = await getPhoto(element);
        if (!photo || photo.deletedAt) {
          photoNotFound = true;
        }
        return photo;
      })
    );

    if (photoNotFound) {
      return resFailure(res, photoErrors.PHOTO_NOT_EXISTENT);
    }

    id.forEach(async (element, index) => {
      const photo = photosToBeDeleted[index];

      const fileRef = ref(storage, photo.url);
      await deleteObject(fileRef);
      await deletePhoto(photo.id);
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
    const allPhotos = await getAllPhotosForUserId(user.id);
    return resSuccess(res, 'My Photos Returned Successfully', { allPhotos });
  } catch (err) {
    console.log(err.message);
  }
};
