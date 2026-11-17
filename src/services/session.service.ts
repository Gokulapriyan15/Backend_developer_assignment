import { PipelineStage, Types } from 'mongoose';
import { SessionModel, SessionStatus } from '../models/session.model';
import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { getUtcDayRange } from '../utils/date';
import { CreateSessionInput } from '../validators/session.validator';

interface SessionTeacherView {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
}

export interface SessionView {
  _id: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatus;
  completedAt: Date | null;
  teacher: SessionTeacherView | null;
}

export interface UserSessionsView {
  upcomingSessions: SessionView[];
  completedSessions: SessionView[];
}

/** Joins the teacher document and shapes every session the same way. */
const withTeacherStages: PipelineStage[] = [
  {
    $lookup: {
      from: TeacherModel.collection.name,
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      userId: 1,
      startTime: 1,
      endTime: 1,
      status: 1,
      completedAt: 1,
      teacher: {
        _id: '$teacher._id',
        fullName: '$teacher.fullName',
        email: '$teacher.email',
        specialization: '$teacher.specialization',
        experience: '$teacher.experience',
      },
    },
  },
];

export const createSession = async (input: CreateSessionInput) => {
  const teacherExists = await TeacherModel.exists({ _id: input.teacherId });
  if (!teacherExists) {
    throw ApiError.notFound('Teacher not found');
  }

  return SessionModel.create(input);
};

export const getAvailableSessions = async (dateTimestamp: number): Promise<SessionView[]> => {
  const { start, end } = getUtcDayRange(dateTimestamp);

  return SessionModel.aggregate<SessionView>([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: start, $lt: end },
      },
    },
    { $sort: { startTime: 1 } },
    ...withTeacherStages,
  ]);
};

export const bookSession = async (sessionId: string, userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  // Status is part of the filter so two concurrent requests can't both book the same session.
  const bookedSession = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true },
  );
  if (bookedSession) {
    return bookedSession;
  }

  const session = await SessionModel.findById(sessionId).select('status').lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  throw ApiError.conflict(`Session cannot be booked because it is already ${session.status}`);
};

export const completeSession = async (sessionId: string) => {
  const completedSession = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true },
  );
  if (completedSession) {
    return completedSession;
  }

  const session = await SessionModel.findById(sessionId).select('status').lean();
  if (!session) {
    throw ApiError.notFound('Session not found');
  }
  throw ApiError.conflict(
    `Only BOOKED sessions can be completed. Current status: ${session.status}`,
  );
};

export const getUserSessions = async (userId: string): Promise<UserSessionsView> => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw ApiError.notFound('User not found');
  }

  const [result] = await SessionModel.aggregate<UserSessionsView>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    ...withTeacherStages,
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return result;
};
