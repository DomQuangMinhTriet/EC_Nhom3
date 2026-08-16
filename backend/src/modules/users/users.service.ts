import type { AppRole, UserStatus } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { UsersRepository } from "./users.repository";

type UpdateUserStatusInput = {
  userId: string;
  status: UserStatus;
};

type GetUsersInput = {
  page: number;
  limit: number;
  role?: AppRole;
  status?: UserStatus;
};

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getUsers({ page, limit, role, status }: GetUsersInput) {
    const { users, total } = await this.usersRepository.findAll(
      page,
      limit,
      role,
      status,
    );

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus({ userId, status }: UpdateUserStatusInput) {
    const updatedUser = await this.usersRepository.updateStatus(userId, status);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return {
      message: "User status updated successfully.",
      user: updatedUser,
    };
  }
}
