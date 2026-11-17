import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import sessionRoutes from './routes/session.routes';
import teacherRoutes from './routes/teacher.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use('/users', userRoutes);
app.use('/teachers', teacherRoutes);
app.use('/sessions', sessionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
