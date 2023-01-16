import express from 'express';
import morgan from 'morgan';
import globalErrorHandler from './controllers/errorController';
import organizationRoutes from './routes/organizationRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

// use as logger during development
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/organizations/', organizationRoutes);
app.use('/api/v1/users/', userRoutes);

// Use global error handling middleware
app.use(globalErrorHandler);

export default app;
