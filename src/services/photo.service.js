import { db } from '../utils/db.util.js';

export const createPhoto = async (userId, url, size, caption) => {
  return await db.photo.create({
    data: {
      userId,
      url,
      size,
      caption
    }
  });
};

export const deletePhoto = async (id) => {
  return await db.photo.update({
    where: {
      id
    },
    data: {
      deletedAt: new Date()
    }
  });
};

export const getPhoto = async (id) => {
  return await db.photo.findUnique({
    where: {
      id
    }
  });
};

// valid keys in photoObj are photoName and photoCaption
export const updatePhoto = async (id, photoObj) => {
  return await db.photo.update({
    where: {
      id
    },
    data: {
      ...photoObj
    }
  });
};

export const getAllPhotosForUserId = async (userId) => {
  return await db.photo.findMany({
    where: {
      userId,
      deletedAt: null
    }
  });
};
