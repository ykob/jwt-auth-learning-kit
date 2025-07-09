import { Request, Response } from 'express';

export const getMyProfile = (req: Request, res: Response) => {
  const user = req.user;

  res.json({
    message: `Welcome, user ${user?.userId}! This is your private profile.`,
    user,
  });
};
