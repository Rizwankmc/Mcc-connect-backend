/**
 * third party libraries
 */
import express from 'express';
import path from 'path';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const socket = require('socket.io');
const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(moduleURL.pathname);
console.log(__dirname);
// import * as Sentry from '@sentry/node';

// server configuration
import connectDB from './config/dbConnection.js';

// import All routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import socketConnection from './config/socketConnection.js';

connectDB();
// environment: development, staging, production
dotenv.config();
const environment = process.env.NODE_ENV;

/**
 * express application
 */
const app = express();
const server = http.createServer(app);
const io = socket(server);
// allow cross origin requests
// configure to only allow requests from certain origins
app.use(cors());



// parsing the request bodys
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// public folder to fetch images
app.use("/public", express.static("public"));
// secure your private routes with jwt auth *-+entication middleware
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
socketConnection(io);
server.listen(process.env.PORT, () => {
  console.log(`server running in ${environment} mode & listening on port ${process.env.PORT}`);
  if (environment !== 'production' && environment !== 'development' && environment !== 'testing') {
    console.error(
      `NODE_ENV is set to ${environment}, but only production and development are valid.`
    );
    process.exit(1);
  }
});
