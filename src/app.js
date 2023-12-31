import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';

import { photoRouter } from './routes/photo.route.js';

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: 'http://34.69.126.218:3000/', // Allow requests from this origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    optionsSuccessStatus: 200,
    exposedHeaders: ['Set-cookie']
  })
);
app.use(photoRouter);

const PORT = process.env.NODE_DOCKER_PORT;
app.listen(PORT, () => {
  console.info(`photo-mgmt-serv running at port ${PORT}`);
});
