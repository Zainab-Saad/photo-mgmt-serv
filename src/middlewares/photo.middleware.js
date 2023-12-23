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
