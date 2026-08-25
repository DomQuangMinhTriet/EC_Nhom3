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
  actorRole: AppRole;
};

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getUsers({ page, limit, role, status, actorRole }: GetUsersInput) {
    if (
      actorRole === "Operational_Admin" &&
      role !== undefined &&
      role !== "Partner" &&
      role !== "Branch"
    ) {
      throw new AppError("Operational Admin can only view Partner and Branch users", 403);
    }

    const roles =
      actorRole === "Operational_Admin"
        ? role
          ? [role]
          : (["Partner", "Branch"] satisfies AppRole[])
        : role
          ? [role]
          : undefined;

    const { users, total } = await this.usersRepository.findAll(
      page,
      limit,
      roles,
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

    if (actorRole === "Operational_Admin") {
      const targetUser = await this.usersRepository.findById(userId);

      if (!targetUser) {
        throw new AppError("User not found", 404);
      }

      if (targetUser.roleCode !== "Partner" && targetUser.roleCode !== "Branch") {
        throw new AppError("Operational Admin can only update Partner and Branch users", 403);
      }
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
