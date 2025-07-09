import express from 'express';
import profileRouter from './api/profiles/profiles.routes';
import { env } from './config';

const app = express();

app.use(express.json());

app.get('/api/public', (_, res) => {
  res.json({ message: 'This is a public endpoint.' });
});

app.use('/api/profile', profileRouter);

app.listen(env.PORT, () => {
  console.log(`Resource Server is running on port ${env.PORT}`);
});
