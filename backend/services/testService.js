// services/testService.js

import testRepo from "../repositories/testRepo.js";

class TestService {
  async getAllUsers() {
    const users = await testRepo.getAllUsers();

    return {
      total: users.length,
      data: users,
    };
  }

  async getUserById(id) {
    const user = await testRepo.getUserById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

export default new TestService();
