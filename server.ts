import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import vagasRoutes from "./src/routes/vagas";
import scraperRoutes from "./src/routes/scraper";
import { schedulerService } from "./src/services/scheduler";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Rotas da API
  app.use("/api/vagas", vagasRoutes);
  app.use("/api/scraper", scraperRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Inicializa o agendador
  schedulerService.init();

  // Vite middleware para desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("Erro ao iniciar o servidor:", err);
});
