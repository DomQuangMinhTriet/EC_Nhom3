import type { AppRole, UserStatus } from "../../shared/auth/jwt";
import { AppError } from "../../shared/errors/AppError";
import { UsersRepository } from "./users.repository";

type UpdateUserInput = {
  userId: string;
  status?: UserStatus;
  roleCode?: AppRole;
  actorRole: AppRole;
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

  async updateUser({
    userId,
    status,
    roleCode,
    actorRole,
  }: UpdateUserInput) {
    if (roleCode !== undefined && actorRole !== "Super_Admin") {
      throw new AppError("Only Super Admin can update user roles", 403);
    }

    const updatedUser = await this.usersRepository.updateUser(userId, {
      status,
      roleCode,
    });

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return {
      message: "User updated successfully.",
      user: updatedUser,
    };
  }
}
