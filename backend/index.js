import dotenv from "dotenv";
import express from "express";
import testRoute from "./routes/testRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello Express!");
});

app.use(express.json());

app.use("/api/test", testRoute);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
