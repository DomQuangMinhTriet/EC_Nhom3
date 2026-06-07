// repositories/testRepo.js

const users = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
];

class TestRepo {
  async getAllUsers() {
    return users;
  }

  async getUserById(id) {
    return users.find((user) => user.id === Number(id));
  }
}

export default new TestRepo();
