import dotenv from "dotenv";
import app from "./app.js";
import { startTelegramBot } from "./bot/index.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);

  startTelegramBot().catch((error) => {
    console.error("Telegram bot failed to start:", error);
  });
});