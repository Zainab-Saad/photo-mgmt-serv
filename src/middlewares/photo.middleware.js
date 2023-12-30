import { check } from 'express-validator';
import axios from 'axios';
import dotenv from 'dotenv';
import { resFailure } from '../utils/responseObject.util.js';
import { photoErrors } from '../errors/photo.error.js';

const isNumericArray = (value) => {
  if (value.length === 0) {
    return false;
  }
  return value.every(
    (element) => typeof element === 'number' && !isNaN(element)
  );
};

dotenv.config();
export const deletePhotoValidator = [
  check(
    'id',
    'Id of the photo to be deleted cannot be undefined or non-numeric'
  )
    .notEmpty()
    .isArray()
    .custom(isNumericArray)
];

export const updatePhotoValidator = [
  check(
    'id',
    'Id of the photo to be updated cannot be undefined or non-numeric'
  )
    .notEmpty()
    .isNumeric()
];

export const hasAuthToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return resFailure(res, photoErrors.INVALID_AUTH_HEADER, {}, 403);
  }
  next();
};

export const authenticateUser = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization.split(' ')[1];
    const response = await axios.get(
      `http://${process.env.USER_ACC_MGMT_SERV_IP}:${process.env.USER_ACC_MGMT_SERV_PORT}/get-me`,
      {
        headers: {
          Authorization: `Bearer ${authorizationHeader}`
        }
      }
    );
    req.user = response.data;
    next();
  } catch (err) {
    console.log(err.message);
    return resFailure(res, err.message);
  }
};

const sumFileSize = (files, numberOfFiles) => {
  const selectedFiles = files.slice(0, numberOfFiles);

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return totalSize;
};

export const checkStorageUpload = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization.split(' ')[1];
  const { files } = req;
  let storageOk = true;
  let errMsg = '';
  try {
    const responses = await Promise.all(
      files.map(async (file, index) => {
        const response = await axios.get(
          `http://${process.env.STORAGE_MGMT_SERV_IP}:${
            process.env.STORAGE_MGMT_SERV_PORT
          }/check-storage?imageSize=${sumFileSize(files, index+1)}`,
          {
            headers: {
              Authorization: `Bearer ${authorizationHeader}`
            }
          }
        );
        return response.data.data;
      })
    );

    for (const resp of responses) {
      console.log(resp)
      if (!resp.canUpload) {
        return resFailure(res, resp.reason)
      }
    }
    next();
  } catch (err) {
    console.log(err);
    return resFailure(res, err.message);
  }
};

export const checkStorageUpdate = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization.split(' ')[1];
  const { file } = req;
  try {
    const response = await axios.get(
      `http://${process.env.STORAGE_MGMT_SERV_IP}:${
        process.env.STORAGE_MGMT_SERV_PORT
      }/check-storage?imageSize=${parseInt(file.size)}`,
      {
        headers: {
          Authorization: `Bearer ${authorizationHeader}`
        }
      }
    );
    if (!response.data.data.canUpload) {
      return resFailure(res, response.data.data.reason);
    }
  } catch (err) {
    console.log(err);
    return resFailure(res, err.message);
  }
};
