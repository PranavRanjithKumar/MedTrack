import express from 'express';
import morgan from 'morgan';
import globalErrorHandler from './controllers/errorController';
import organizationRoutes from './routes/organizationRoutes';
import userRoutes from './routes/userRoutes';
import requestRoutes from './routes/requestRoutes';
import drugRoutes from './routes/drugRoutes';
import assetRoutes from './routes/assetRoutes';

const app = express();

// use as logger during development
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/organizations/', organizationRoutes);
app.use('/api/v1/users/', userRoutes);
app.use('/api/v1/requests/', requestRoutes);
app.use('/api/v1/drugs/', drugRoutes);
app.use('/api/v1/assets/', assetRoutes);

// Use global error handling middleware
app.use(globalErrorHandler);

export default app;
