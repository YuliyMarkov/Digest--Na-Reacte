import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/category.routes.js";
import testRoutes from "./routes/test.routes.js";
import authRoutes from "./routes/auth.routes.js";
import articleRoutes from "./routes/article.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api", testRoutes);
app.use("/api", categoryRoutes);
app.use("/api", authRoutes);
app.use("/api", articleRoutes);

export default app;