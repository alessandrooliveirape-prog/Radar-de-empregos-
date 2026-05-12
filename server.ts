import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import vagasRoutes from "./src/routes/vagas";
import scraperRoutes from "./src/routes/scraper";
import { schedulerService } from "./src/services/scheduler";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. Rotas da API (Devem vir primeiro)
app.use("/api/vagas", vagasRoutes);
app.use("/api/scraper", scraperRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Inicializa o agendador (Nota: Em serverless, o cron do Node pode não ser persistente. Use Vercel Crons para produção real)
schedulerService.init();

// 2. Ambiente de Execução
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Middleware do Vite para desenvolvimento local
  const setupDevServer = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor de desenvolvimento pronto em http://localhost:${PORT}`);
    });
  };
  setupDevServer();
}

// 3. Exportação para Vercel
export default app;
