import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Film, FolderOpen, Gauge, Plus, Settings2, Sparkles, Trash2, WandSparkles, Save, RefreshCw } from "lucide-react";

type Capability = { id: string; name: string; status: string; note: string };
type Scene = { id: string; prompt: string; duration_seconds: number };
type Project = { id: string; title: string; scenes: Scene[]; updatedAt: string };
type View = "studio" | "projects" | "library" | "jobs" | "settings";
const API = (import.meta.env.VITE_API_URL || "https://trevox-ai-studio-api.onrender.com").replace(/\/$/, "");
const STORAGE = "trevox.projects.v1";
const makeScene = (): Scene => ({ id: crypto.randomUUID(), prompt: "", duration_seconds: 10 });

function readProjects(): Project[] {
  try { const value = JSON.parse(localStorage.getItem(STORAGE) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

export default function App() {
  const [view, setView] = useState<View>("studio");
  const [apiStatus, setApiStatus] = useState("checking");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [omniStatus, setOmniStatus] = useState<{configured:boolean;status:string;note:string}>({configured:false,status:"checking",note:"Verificando gateway..."});
  const [projects, setProjects] = useState<Project[]>(readProjects);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("Meu primeiro projeto");
  const [scenes, setScenes] = useState<Scene[]>([{ id: crypto.randomUUID(), prompt: "Apresentação cinematográfica do tema, com iluminação dramática.", duration_seconds: 30 }]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const totalDuration = useMemo(() => scenes.reduce((sum, scene) => sum + Number(scene.duration_seconds || 0), 0), [scenes]);

  async function refreshApi() {
    setApiStatus("checking");
    try {
      const [health, caps, omni] = await Promise.all([
        fetch(`${API}/health`).then(r => { if (!r.ok) throw new Error("health"); return r.json(); }),
        fetch(`${API}/capabilities`).then(r => { if (!r.ok) throw new Error("capabilities"); return r.json(); }),
        fetch(`${API}/integrations/omniroute/status`).then(r => { if (!r.ok) throw new Error("omniroute"); return r.json(); })
      ]);
      setApiStatus(health.status === "ok" ? "online" : "offline");
      setCapabilities(caps);
      setOmniStatus(omni);
    } catch { setApiStatus("offline"); setCapabilities([]); setOmniStatus({configured:false,status:"unavailable",note:"Não foi possível consultar o gateway."}); }
  }
  useEffect(() => { void refreshApi(); }, []);
  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(projects)); }, [projects]);

  function newProject() {
    setProjectId(""); setProjectName("Novo projeto"); setScenes([makeScene()]);
    setMessage("Novo projeto iniciado. Salve para mantê-lo neste navegador."); setView("studio");
  }
  function saveProject() {
    if (!projectName.trim() || scenes.length === 0 || scenes.some(s => !s.prompt.trim() || !Number.isFinite(Number(s.duration_seconds)) || Number(s.duration_seconds) <= 0)) {
      setMessage("Preencha o nome e todas as cenas com descrição e duração maior que zero."); return;
    }
    const item: Project = { id: projectId || crypto.randomUUID(), title: projectName.trim(), scenes, updatedAt: new Date().toISOString() };
    setProjects(current => [item, ...current.filter(p => p.id !== item.id)]);
    setProjectId(item.id); setMessage("Projeto salvo neste navegador.");
  }
  function openProject(item: Project) {
    setProjectId(item.id); setProjectName(item.title); setScenes(item.scenes); setMessage("Projeto carregado."); setView("studio");
  }
  function deleteProject(id: string) {
    setProjects(current => current.filter(p => p.id !== id));
    if (projectId === id) newProject();
    setMessage("Projeto removido deste navegador.");
  }
  function exportProject() {
    if (!projectName.trim() || projectName.trim().length > 200 || scenes.length === 0 || scenes.some(scene => !scene.id.trim() || scene.id.length > 100 || !scene.prompt.trim() || !Number.isFinite(Number(scene.duration_seconds)) || Number(scene.duration_seconds) <= 0)) { setMessage("Revise o nome e todas as cenas. Cada cena precisa de descrição e duração maior que zero."); return; }
    const payload: Project = { id: projectId || crypto.randomUUID(), title: projectName.trim(), scenes, updatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.title.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "projeto"}.trevox.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Projeto exportado em JSON.");
  }
  async function importProject(file?: File) {
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!data || typeof data !== "object") throw new Error("Arquivo inválido.");
      const item = data as Partial<Project>;
      if (typeof item.title !== "string" || !item.title.trim() || item.title.trim().length > 200 || !Array.isArray(item.scenes) || item.scenes.length === 0) throw new Error("O JSON precisa conter título de até 200 caracteres e ao menos uma cena.");
      if (item.id !== undefined && (typeof item.id !== "string" || !item.id.trim() || item.id.length > 100)) throw new Error("O identificador do projeto é inválido.");
      const importedScenes = item.scenes.map((scene, index) => {
        if (!scene || typeof scene.id !== "string" || !scene.id.trim() || scene.id.length > 100 || typeof scene.prompt !== "string" || !scene.prompt.trim() || typeof scene.duration_seconds !== "number" || !Number.isFinite(scene.duration_seconds) || scene.duration_seconds <= 0) throw new Error(`A cena ${index + 1} tem dados inválidos.`);
        return { id: scene.id, prompt: scene.prompt, duration_seconds: scene.duration_seconds };
      });
      if (new Set(importedScenes.map(scene => scene.id)).size !== importedScenes.length) throw new Error("O arquivo contém IDs de cena repetidos.");
      const imported: Project = { id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(), title: item.title.trim(), scenes: importedScenes, updatedAt: new Date().toISOString() };
      setProjectId(imported.id); setProjectName(imported.title); setScenes(imported.scenes);
      setProjects(current => [imported, ...current.filter(project => project.id !== imported.id)]);
      setMessage("Projeto importado e salvo neste navegador.");
      setView("studio");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível importar este arquivo.");
    }
    if (importInput.current) importInput.current.value = "";
  }
  async function validateDraft() {
    if (!projectName.trim() || scenes.length === 0) { setMessage("Informe um nome e adicione pelo menos uma cena."); return; }
    setBusy(true); setMessage("Validando projeto na API...");
    try {
      const response = await fetch(`${API}/projects/validate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId || "draft-project", title: projectName, scenes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((e: {msg:string}) => e.msg).join("; ") : "Falha na validação");
      setMessage(`Projeto válido: ${data.scene_count} cena(s), ${data.total_duration_seconds}s. Validação não gera vídeo.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "API indisponível. Tente novamente."); }
    finally { setBusy(false); }
  }
  const nav = (id: View, label: string, icon: React.ReactNode) => <button className={`nav ${view === id ? "active" : ""}`} onClick={() => setView(id)}>{icon}{label}</button>;

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">T</div><div><b>TREVOX</b><small>IA STUDIO</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      {nav("studio","Estúdio",<Clapperboard size={18}/>)}{nav("projects","Meus projetos",<FolderOpen size={18}/>)}{nav("library","Biblioteca",<Film size={18}/>)}{nav("jobs","Processamentos",<Gauge size={18}/>)}
      <div className="sidebar-bottom">{nav("settings","Configurações",<Settings2 size={18}/>)}<div className="user"><div className="avatar">T</div><div><b>Meu espaço</b><small>Armazenamento local</small></div></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="crumb">Workspace /</span> {({studio:"Estúdio",projects:"Meus projetos",library:"Biblioteca",jobs:"Processamentos",settings:"Configurações"} as Record<View,string>)[view]}</div><div className="api-pill"><i className={apiStatus === "online" ? "dot online" : "dot"}/> API {apiStatus === "online" ? "conectada" : apiStatus === "checking" ? "verificando" : "desconectada"} <button className="icon-button" onClick={() => void refreshApi()} title="Testar conexão"><RefreshCw size={13}/></button></div></header>
      {view === "studio" && <>
        <section className="welcome"><div><div className="eyebrow"><Sparkles size={14}/> SEU ESTÚDIO CRIATIVO</div><h1>Transforme ideias em <span>vídeos.</span></h1><p>Organize projetos e cenas em um único espaço de trabalho.</p></div><div className="hero-orb"><WandSparkles size={54}/></div></section>
        <section className="section-heading"><div><h2>{projectId ? "Editar projeto" : "Novo projeto"}</h2><p>Seus projetos ficam salvos neste navegador.</p></div><span className="tag">ESTÚDIO</span></section>
        <section className="studio-grid"><div className="panel editor-panel">
          <label>Nome do projeto</label><input value={projectName} maxLength={200} onChange={e => setProjectName(e.target.value)}/>
          {scenes.map((scene,index)=><div className="scene-editor" key={scene.id}><div className="scene-title"><b>Cena {index+1}</b>{scenes.length > 1 && <button className="icon-button danger" onClick={() => setScenes(current => current.filter(s => s.id !== scene.id))} title="Excluir cena"><Trash2 size={15}/></button>}</div>
            <label>Descrição da cena</label><textarea value={scene.prompt} rows={3} onChange={e => setScenes(current => current.map(s => s.id === scene.id ? {...s,prompt:e.target.value} : s))}/>
            <label>Duração (segundos)</label><input type="number" min="1" step="1" value={scene.duration_seconds} onChange={e => setScenes(current => current.map(s => s.id === scene.id ? {...s,duration_seconds:Number(e.target.value)} : s))}/>
          </div>)}
          <div className="actions"><button className="secondary" onClick={() => setScenes(current => [...current,makeScene()])}><Plus size={15}/> Adicionar cena</button><button className="secondary" onClick={saveProject}><Save size={15}/> Salvar</button><button className="secondary" onClick={exportProject}>Exportar JSON</button><button className="secondary" onClick={() => importInput.current?.click()}>Importar JSON</button><input ref={importInput} type="file" accept=".json,application/json" hidden onChange={e => void importProject(e.target.files?.[0])}/></div>
          <button className="primary" disabled={busy || apiStatus !== "online"} onClick={() => void validateDraft()}>{busy ? "Validando..." : "Validar projeto"}</button>
          {message && <div className="message" role="status">{message}</div>}
          <div className="disclaimer">A validação confere os dados. Geração de vídeo, voz, lip-sync e exportação MP4 ainda exigem motores de mídia conectados.</div>
        </div><div className="panel preview-panel"><div className="preview-head"><b>Resumo do projeto</b><span>16:9</span></div><div className="preview"><div className="preview-icon"><Film size={30}/></div><b>{projectName || "Projeto sem título"}</b><p>{scenes.length} cena(s) • {totalDuration || 0} segundos</p><p>Prévia de vídeo indisponível sem motor de geração.</p></div><div className="preview-foot"><span>{scenes.length} cenas</span><span>{Math.floor(totalDuration/60)}:{String(Math.round(totalDuration%60)).padStart(2,"0")}</span></div></div></section>
      </>}
      {view === "projects" && <><section className="section-heading"><div><h2>Meus projetos</h2><p>Projetos salvos localmente neste navegador.</p></div><button className="primary" onClick={newProject}><Plus size={16}/> Novo projeto</button></section>{projects.length ? <div className="project-list">{projects.map(p=><div className="project-row" key={p.id}><div><b>{p.title}</b><small>{p.scenes.length} cena(s) • Atualizado em {new Date(p.updatedAt).toLocaleString("pt-BR")}</small></div><button className="secondary" onClick={() => openProject(p)}>Abrir</button><button className="icon-button danger" onClick={() => deleteProject(p.id)} title="Excluir"><Trash2 size={15}/></button></div>)}</div> : <div className="panel empty-state">Nenhum projeto salvo. Crie um projeto no Estúdio.</div>}</>}
      {view === "library" && <><section className="section-heading"><div><h2>Biblioteca de mídia</h2><p>Área reservada para referências e arquivos de projeto.</p></div></section><div className="panel empty-state">Nenhum arquivo armazenado. Upload e armazenamento em nuvem ainda não estão conectados.</div></>}
      {view === "jobs" && <><section className="section-heading"><div><h2>Processamentos</h2><p>Status dos motores conectados à plataforma.</p></div></section><div className="capability-grid">{capabilities.map(item=><div className="capability" key={item.id}><div className="cap-icon"><Sparkles size={17}/></div><div><b>{item.name}</b><small>{item.note}</small></div><span className={item.status === "available" ? "status ready" : "status"}>{item.status === "available" ? "ON" : "OFF"}</span></div>)}</div></>}
      {view === "settings" && <><section className="section-heading"><div><h2>Configurações</h2><p>Conexão e dados locais do TREVOX.</p></div></section><div className="panel settings-panel"><b>API</b><p>{API}</p><button className="secondary" onClick={() => void refreshApi()}><RefreshCw size={15}/> Testar conexão</button><div className="capability" style={{marginTop:18}}><div className="cap-icon"><Sparkles size={17}/></div><div><b>Gateway OmniRoute</b><small>{omniStatus.note}</small></div><span className={omniStatus.configured ? "status ready" : "status"}>{omniStatus.configured ? "ON" : "OFF"}</span></div><div className="disclaimer">Projetos são armazenados no localStorage deste navegador. Limpar os dados do navegador pode removê-los. Sincronização entre dispositivos e contas ainda não está implementada.</div></div></>}
      <footer>TREVOX IA STUDIO <span>APRENDER. CRIAR. TRANSFORMAR.</span></footer>
    </main>
  </div>;
}
