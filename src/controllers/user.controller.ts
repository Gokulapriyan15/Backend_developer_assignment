import * as sessionService from '../services/session.service';
import * as userService from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../validators/common.validator';
import { createUserSchema } from '../validators/user.validator';

export const createUser = asyncHandler(async (req, res) => {
  const input = createUserSchema.parse(req.body);
  const user = await userService.createUser(input);
  res.status(201).json({ success: true, data: user });
});

export const getUserSessions = asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const sessions = await sessionService.getUserSessions(id);
  res.status(200).json({ success: true, data: sessions });
});
