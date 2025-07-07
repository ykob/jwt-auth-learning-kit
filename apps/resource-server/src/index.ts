import express from 'express';
import { env } from './config';
import { protect } from './middleware/auth.middleware';

const app = express();

app.use(express.json());

app.get('/api/public', (_, res) => {
  res.json({ message: 'This is a public endpoint.' });
});

app.get('/api/private/profile', protect, (req, res) => {
  const user = req.user;
  res.json({
    message: `Welcome, user ${user?.userId}! This is a protected endpoint.`,
    user,
  });
});

app.listen(env.PORT, () => {
  console.log(`Resource Server is running on port ${env.PORT}`);
});
