// routes/testRoute.js

import express from "express";
import testController from "../controllers/testController.js";

const router = express.Router();

router.get("/users", testController.getAllUsers);
router.get("/users/:id", testController.getUserById);

export default router;
