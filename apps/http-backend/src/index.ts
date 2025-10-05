import express from "express";
import { authRouter } from "./auth/index.js"
import { roomRouter } from "./rooms/index.js";

const app = express();
app.use(express.json());

app.use("/auth", authRouter)
app.use("/room", roomRouter)

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
