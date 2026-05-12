# Radar de Empregos PE 🚀

Sistema full-stack para coleta automática e monitoramento de vagas de emprego dos portais governamentais de Pernambuco.

## Portais Monitorados
1. **SEDEPE** (Secretaria de Desenvolvimento Econômico de Pernambuco)
2. **Go Recife** (Prefeitura do Recife)

## Funcionalidades
- **Scraping Automático**: SEDEPE (6h/6h) e Go Recife (4h/4h).
- **API REST**: Endpoints para listagem, filtros e execução manual de scrapers.
- **Armazenamento Híbrido**: Salva localmente em JSON por padrão, com suporte opcional a Supabase.
- **Dashboard**: Interface moderna para visualização e busca de vagas.

## Stack Técnica
- **Backend**: Node.js, Express, tsx.
- **Scraping**: Axios + Cheerio (SEDEPE), Playwright (Go Recife).
- **Agendamento**: Node-Cron.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.

## Configuração para Vercel (Produção)

Para que o sistema funcione na Vercel, adicione as seguintes variáveis de ambiente (Environment Variables) no painel da Vercel:

1. `API_KEY`: Crie uma chave secreta e coloque o mesmo valor nas configurações do dashboard para coletar vagas.
2. `USE_FIREBASE`: `true`
3. `FIREBASE_CONFIG`: O conteúdo do arquivo `firebase-applet-config.json` (isso evita erros de leitura de arquivo em ambiente serverless).

### Como rodar o Scraper
O sistema possui agendamento automático, mas você pode forçar a coleta no App cliando em **Coletar Vagas Agora**.
> **Nota:** Em ambientes Serverless (Vercel Free), o agendamento em segundo plano pode não ser persistente. Recomenda-se usar o botão manual ou um provedor como Railway/Render para agendamentos críticos.

## Como Executar Localmente
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` (baseado no `.env.example`).
3. Inicie o servidor:
   ```bash
   npm run dev
   ```

## API Endpoints
- `GET /api/vagas`: Lista todas as vagas (query params: `fonte`, `busca`, `pagina`, `limite`).
- `GET /api/vagas/status`: Status atual dos scrapers e total de vagas.
- `POST /api/scraper/executar`: Dispara scraping manual (requer `x-api-key`).

## Deploy
Este projeto pode ser facilmente deployado em plataformas como:
- **Render / Railway**: Escolha o runtime Node.js e configure o comando de build `npm run build` e start `npm start`.
- **Vercel**: Suporta o frontend automaticamente, mas requer configuração adicional para scrapers agendados (use Vercel Cron ou serviço externo).

---
*Desenvolvido como uma ferramenta de utilidade pública para Pernambuco.*
