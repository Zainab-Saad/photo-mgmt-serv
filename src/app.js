import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';

import { photoRouter } from './routes/photo.route.js';

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(photoRouter);

const PORT = process.env.NODE_DOCKER_PORT;
app.listen(PORT, () => {
  console.info(`photo-mgmt-serv running at port ${PORT}`);
});
