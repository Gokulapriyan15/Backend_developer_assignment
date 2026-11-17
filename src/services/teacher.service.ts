import { TeacherModel } from '../models/teacher.model';
import { ApiError } from '../utils/ApiError';
import { CreateTeacherInput } from '../validators/teacher.validator';

export const createTeacher = async (input: CreateTeacherInput) => {
  const emailTaken = await TeacherModel.exists({ email: input.email });
  if (emailTaken) {
    throw ApiError.conflict('A teacher with this email already exists');
  }

  return TeacherModel.create(input);
};
