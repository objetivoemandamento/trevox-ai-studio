import { useEffect, useState } from "react";
import { Clapperboard, Film, FolderOpen, Gauge, Plus, Settings2, Sparkles, UploadCloud, WandSparkles } from "lucide-react";

type Capability = { id: string; name: string; status: string; note: string };

const API = (import.meta.env.VITE_API_URL || "https://trevox-ai-studio-api.onrender.com").replace(/\/$/, "");

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [projectName, setProjectName] = useState("Meu primeiro projeto");
  const [sceneText, setSceneText] = useState("Apresentação cinematográfica do tema, com personagens consistentes e iluminação dramática.");
  const [duration, setDuration] = useState(30);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/health`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/capabilities`).then(r => r.ok ? r.json() : Promise.reject())
    ]).then(([health, caps]) => {
      setApiStatus(health.status === "ok" ? "online" : "offline");
      setCapabilities(caps);
    }).catch(() => setApiStatus("offline"));
  }, []);

  async function validateDraft() {
    setMessage("Validando estrutura...");
    try {
      const response = await fetch(`${API}/projects/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "draft-project",
          title: projectName,
          scenes: [{ id: "scene-1", prompt: sceneText, duration_seconds: Number(duration) }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail?.[0]?.msg ?? "Falha na validação");
      setMessage(`Estrutura válida: 1 cena, ${data.total_duration_seconds}s. Nenhum vídeo foi gerado.`);
    } catch {
      setMessage("Não foi possível validar. Confirme se a API está em execução.");
    }
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">T</div><div><b>TREVOX</b><small>IA STUDIO</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav active"><Clapperboard size={18}/> Estúdio</button>
      <button className="nav"><FolderOpen size={18}/> Meus projetos</button>
      <button className="nav"><Film size={18}/> Biblioteca de mídia</button>
      <button className="nav"><Gauge size={18}/> Processamentos</button>
      <div className="sidebar-bottom"><button className="nav"><Settings2 size={18}/> Configurações</button><div className="user"><div className="avatar">T</div><div><b>Meu espaço</b><small>Plano de desenvolvimento</small></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="crumb">Workspace /</span> Estúdio</div><div className="api-pill"><i className={apiStatus === "online" ? "dot online" : "dot"} /> API {apiStatus === "online" ? "conectada" : apiStatus === "checking" ? "verificando" : "desconectada"}</div></header>
      <section className="welcome"><div><div className="eyebrow"><Sparkles size={14}/> SEU ESTÚDIO CRIATIVO</div><h1>Transforme ideias em <span>vídeos.</span></h1><p>Crie projetos, organize cenas e prepare seu fluxo audiovisual em um só lugar.</p></div><div className="hero-orb"><WandSparkles size={54}/></div></section>

      <section className="section-heading"><div><h2>Novo projeto</h2><p>Comece definindo o conceito do seu vídeo.</p></div><span className="tag">BETA • FUNDAÇÃO</span></section>
      <section className="studio-grid">
        <div className="panel editor-panel">
          <label>Nome do projeto</label><input value={projectName} onChange={e => setProjectName(e.target.value)} />
          <label>Descrição da cena</label><textarea value={sceneText} onChange={e => setSceneText(e.target.value)} rows={5}/>
          <div className="two-fields"><div><label>Duração da cena (segundos)</label><input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))}/></div><div><label>Formato de saída</label><div className="format">16:9 <span>Full HD planejado</span></div></div></div>
          <button className="primary" onClick={validateDraft}><Plus size={17}/> Validar projeto</button>
          {message && <div className="message">{message}</div>}
          <div className="disclaimer">Nesta versão, você pode estruturar e validar projetos. A geração de mídia será habilitada quando os workers de IA forem integrados.</div>
        </div>
        <div className="panel preview-panel"><div className="preview-head"><b>Pré-visualização</b><span>16:9</span></div><div className="preview"><div className="preview-icon"><UploadCloud size={30}/></div><b>Sua criação começa aqui</b><p>Adicione referências visuais na próxima etapa.</p></div><div className="preview-foot"><span>Sem mídia gerada</span><span>— : —</span></div></div>
      </section>

      <section className="section-heading capabilities-head"><div><h2>Motores e recursos</h2><p>Disponibilidade real das integrações nesta versão.</p></div></section>
      <div className="capability-grid">{capabilities.map(item => <div className="capability" key={item.id}><div className="cap-icon"><Sparkles size={17}/></div><div><b>{item.name}</b><small>{item.status === "available" ? "Disponível" : "Ainda não conectado"}</small></div><span className={item.status === "available" ? "status ready" : "status"}>{item.status === "available" ? "ON" : "OFF"}</span></div>)}</div>
      <footer> TREVOX IA STUDIO <span>APRENDER. CRIAR. TRANSFORMAR.</span></footer>
    </main>
  </div>;
}
