import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCcw, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink,
  Database,
  AlertCircle,
  CheckCircle2,
  Filter,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vaga, AppStatus, FonteVaga } from './types';

export default function App() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [search, setSearch] = useState('');
  const [fonteFilter, setFonteFilter] = useState< FonteVaga | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchVagas = async () => {
    try {
      const fonteQuery = (fonteFilter !== 'ALL') ? `&fonte=${fonteFilter}` : '';
      const searchQuery = search ? `&busca=${search}` : '';
      const res = await fetch(`/api/vagas?pagina=1&limite=50${fonteQuery}${searchQuery}`);
      if (!res.ok) throw new Error('Falha na resposta da API');
      const data = await res.json();
      setVagas(data.vagas || []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar vagas. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/vagas/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Erro ao carregar status');
    }
  };

  const triggerScraper = async (fonte?: string) => {
    setTriggering(true);
    try {
      const res = await fetch('/api/scraper/executar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'sua-chave-aqui' // Padrão no .env.example
        },
        body: JSON.stringify({ fonte })
      });
      if (!res.ok) throw new Error('Falha ao disparar scraper');
      // Aguarda um pouco e atualiza status
      setTimeout(() => {
        fetchStatus();
        setTriggering(false);
      }, 1000);
    } catch (err) {
      alert('Erro ao disparar scraper. Verifique a API Key.');
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchVagas();
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Atualiza status a cada 10s
    return () => clearInterval(interval);
  }, [fonteFilter, search]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Radar de Empregos PE</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Monitoramento em Tempo Real</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar vagas ou empresas..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full md:w-64 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setLoading(true); fetchVagas(); fetchStatus(); }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Atualizar lista"
            >
              <RefreshCcw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Status Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Status dos Scrapers
            </h2>
            <div className="space-y-4">
              {status?.scrapers?.map((s) => (
                <div key={s.fonte} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{s.fonte}</span>
                    {s.emExecucao ? (
                      <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                        Sincronizando
                      </span>
                    ) : s.ultimoErro ? (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Vagas Coletadas:</span>
                      <span className="text-gray-900">{s.totalVagasColetadas}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Última Sinc:</span>
                      <span className="text-gray-900">
                        {s.ultimaExecucao ? new Date(s.ultimaExecucao).toLocaleTimeString() : 'Nuca'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => triggerScraper()}
                disabled={triggering}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
                {triggering ? 'Processando...' : 'Coletar Vagas Agora'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filtrar por Fonte
            </h2>
            <div className="flex flex-col gap-2">
              {(['ALL', FonteVaga.SEDEPE, FonteVaga.GO_RECIFE] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFonteFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    fonteFilter === f 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {f === 'ALL' ? 'Todas as Fontes' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">
              {vagas.length} {vagas.length === 1 ? 'Vaga encontrada' : 'Vagas encontradas'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Atualizado em: {status?.ultimaExecucaoGeral ? new Date(status.ultimaExecucaoGeral).toLocaleString() : 'N/A'}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-150 animate-pulse rounded-2xl border border-gray-100" />
              ))}
            </div>
          ) : vagas.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Search className="text-gray-300 w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma vaga encontrada com os filtros selecionados.</p>
              <button 
                onClick={() => { setSearch(''); setFonteFilter('ALL'); }}
                className="text-blue-600 font-semibold text-sm hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {vagas?.map((vaga) => (
                  <motion.div
                    layout
                    key={vaga.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        vaga.fonte === FonteVaga.SEDEPE 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {vaga.fonte}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(vaga.coletadoEm).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">
                      {vaga.titulo}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{vaga.empresa}</span>
                      <span className="text-gray-200">•</span>
                      <MapPin className="w-3 h-3" />
                      <span>{vaga.localizacao}</span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-6 leading-relaxed">
                      {vaga.descricao || 'Detalhes da vaga disponíveis no link original.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-xs font-bold text-gray-900">
                        {vaga.salario ? `R$ ${vaga.salario}` : 'Salário não informado'}
                      </div>
                      <a 
                        href={vaga.linkOriginal} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 p-1"
                      >
                        Ver detalhes
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <AlertCircle className="w-5 h-5 font-bold" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-red-100">Erro de Conexão</p>
              <p className="text-xs">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-4 text-red-200 hover:text-white">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
