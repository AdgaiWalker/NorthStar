import { config } from "dotenv";
import { pool } from "../db/client";
import { refreshSearchDocumentsInDb } from "../data/postgres";

config();

refreshSearchDocumentsInDb()
  .then((count) => {
    console.log(JSON.stringify({ refreshed: true, searchDocuments: count ?? 0 }));
  })
  .finally(async () => {
    await pool?.end();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
