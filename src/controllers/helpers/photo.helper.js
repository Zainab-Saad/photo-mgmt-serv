import axios from 'axios';
import dotenv from 'dotenv';
import { resFailure } from '../../utils/responseObject.util.js';
import { checkStorageUpdate } from '../../middlewares/photo.middleware.js';

dotenv.config();

export const checkStorage = async (req, res, imageSize) => {
  try {
    checkStorageUpdate(req, res, imageSize);
  } catch (err) {
    console.log(err);
    return resFailure(res, err.message);
  }
};

export const updateStorage = async (req, res, imageSize, action) => {
  const authorizationHeader = req.headers.authorization.split(' ')[1];
  try {
    const authorizationHeader = req.headers.authorization.split(' ')[1];
    const response = await axios.post(
      `http://${process.env.STORAGE_MGMT_SERV_IP}:${process.env.STORAGE_MGMT_SERV_PORT}/update-storage`,
      {
        imageSize,
        action
      },
      {
        headers: {
          Authorization: `Bearer ${authorizationHeader}`
        }
      }
    );
  } catch (err) {
    throw new Error(err.message)
  }
};
