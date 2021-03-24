/**
 * third party libraries
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const socket = require('socket.io');

// import * as Sentry from '@sentry/node';

// server configuration
import auth from './services/auth.service.js';
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

// Sentry configuration
// Sentry.init({
//   dsn: process.env.SENTRY_DNS,

//   // We recommend adjusting this value in production, or using tracesSampler
//   // for finer control
//   tracesSampleRate: 1.0,
// });

// // RequestHandler creates a separate execution context using domains, so that every
// // transaction/span/breadcrumb is attached to its own Hub instance
// app.use(Sentry.Handlers.requestHandler());
// // TracingHandler creates a trace for every incoming request
// app.use(Sentry.Handlers.tracingHandler());

// // The error handler must be before any other error middleware and after all controllers
// app.use(Sentry.Handlers.errorHandler());

// parsing the request bodys
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// secure your private routes with jwt authentication middleware
app.all('/private/*', (req, res, next) => auth(req, res, next));
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
