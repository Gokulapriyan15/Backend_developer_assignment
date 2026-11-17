import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { CreateUserInput } from '../validators/user.validator';

export const createUser = async (input: CreateUserInput) => {
  const emailTaken = await UserModel.exists({ email: input.email });
  if (emailTaken) {
    throw ApiError.conflict('A user with this email already exists');
  }

  return UserModel.create(input);
};
