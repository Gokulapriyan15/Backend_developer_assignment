import { InferSchemaType, Schema, model } from 'mongoose';

export enum SessionStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
}

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.AVAILABLE,
      required: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// Supports "available sessions for a date" lookups
sessionSchema.index({ status: 1, startTime: 1 });
// Supports "sessions of a user" lookups
sessionSchema.index({ userId: 1, status: 1 });

export type Session = InferSchemaType<typeof sessionSchema>;

export const SessionModel = model('Session', sessionSchema);
