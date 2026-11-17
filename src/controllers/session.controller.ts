import * as sessionService from '../services/session.service';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../validators/common.validator';
import {
  availableSessionsQuerySchema,
  bookSessionSchema,
  createSessionSchema,
} from '../validators/session.validator';

export const createSession = asyncHandler(async (req, res) => {
  const input = createSessionSchema.parse(req.body);
  const session = await sessionService.createSession(input);
  res.status(201).json({ success: true, data: session });
});

export const getAvailableSessions = asyncHandler(async (req, res) => {
  const { dateTimestamp } = availableSessionsQuerySchema.parse(req.query);
  const sessions = await sessionService.getAvailableSessions(dateTimestamp);
  res.status(200).json({ success: true, count: sessions.length, data: sessions });
});

export const bookSession = asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { userId } = bookSessionSchema.parse(req.body);
  const session = await sessionService.bookSession(id, userId);
  res.status(200).json({ success: true, data: session });
});

export const completeSession = asyncHandler(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const session = await sessionService.completeSession(id);
  res.status(200).json({ success: true, data: session });
});
