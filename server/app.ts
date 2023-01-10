import express from 'express';
import morgan from 'morgan';
import organizationRoutes from './routes/organizationRoutes';

const app = express();

// use as logger during development
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/organization', organizationRoutes);

export default app;
