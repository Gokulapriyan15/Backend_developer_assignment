import * as teacherService from '../services/teacher.service';
import { asyncHandler } from '../utils/asyncHandler';
import { createTeacherSchema } from '../validators/teacher.validator';

export const createTeacher = asyncHandler(async (req, res) => {
  const input = createTeacherSchema.parse(req.body);
  const teacher = await teacherService.createTeacher(input);
  res.status(201).json({ success: true, data: teacher });
});
