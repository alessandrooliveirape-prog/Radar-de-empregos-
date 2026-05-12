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
  Briefcase,
  X,
  Calendar
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
  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
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
      if (!res.ok) return; // Silent fail for status
      const data = await res.json();
      if (data && !data.error) {
        setStatus(data);
      }
    } catch (err) {
      // Ignore background status errors to avoid console spam
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
  }, [fonteFilter, search]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Atualiza status a cada 10s
    return () => clearInterval(interval);
  }, []);

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

                    <div 
                      onClick={() => setSelectedVaga(vaga)}
                      className="cursor-pointer"
                    >
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
                        {vaga.descricao || 'Clique para ver os detalhes da vaga.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-xs font-bold text-gray-900">
                        {vaga.salario ? `R$ ${vaga.salario}` : 'Salário não informado'}
                      </div>
                      <button 
                        onClick={() => setSelectedVaga(vaga)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Detalhes */}
      <AnimatePresence>
        {selectedVaga && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVaga(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white sticky top-0 z-10">
                <div className="space-y-1 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedVaga.fonte === FonteVaga.SEDEPE 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {selectedVaga.fonte}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Publicado em {new Date(selectedVaga.dataPublicacao).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-snug">
                    {selectedVaga.titulo}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedVaga(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                {/* Job Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Empresa</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedVaga.empresa}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Localização</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedVaga.localizacao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Salário</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedVaga.salario ? `R$ ${selectedVaga.salario}` : 'A combinar'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Coletado em</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedVaga.coletadoEm).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DescriptionSection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-gray-900">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                    Descrição e Requisitos
                  </h3>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    {selectedVaga.descricao || 'Nenhuma descrição detalhada fornecida pela fonte.'}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <p className="text-[10px] text-gray-400 max-w-[200px]">
                  * As informações da vaga são extraídas automaticamente do portal {selectedVaga.fonte}.
                </p>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setSelectedVaga(null)}
                    className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                  >
                    Fechar
                  </button>
                  <a 
                    href={selectedVaga.linkOriginal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    Candidatar-se na Fonte
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
