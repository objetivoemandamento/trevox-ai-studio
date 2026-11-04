# TREVOX IA Studio

Fundação de uma plataforma web para planejar, gerar, editar e renderizar vídeos com IA. O usuário final deverá acessar pelo navegador; a inferência de modelos pesados será executada em workers GPU separados.

## Estado real desta versão

Implementado: interface React/Vite, API FastAPI, validação de projetos/cenas e testes automatizados.

Ainda não implementado: persistência durável, fila de jobs, workers, geração real de vídeo, síntese de voz, lip-sync, edição em timeline, renderização MP4, autenticação e deploy. A interface atual é um protótipo funcional de validação, não um editor audiovisual completo.

## Estrutura existente

- `apps/api`: API FastAPI e testes.
- `apps/web`: interface React/Vite.
- `docs`: arquitetura e roadmap.
- `.github/workflows`: CI para testes Python e build web.

## Requisitos

- Python 3.11+
- Node.js 20+
- npm

## Executar localmente

API:
```bash
cd apps/api
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn trevox_api.main:app --reload
```

Web (em outro terminal):
```bash
cd apps/web
npm install
npm run dev
```

Por padrão, a interface chama a API em `http://localhost:8000`. Para outro endereço, crie `apps/web/.env.local` com `VITE_API_URL=https://seu-dominio-da-api`.

Documentação da API: http://localhost:8000/docs

## Testes

```bash
cd apps/api
pip install -e ".[dev]"
pytest -q
```

O workflow de CI também executa o build TypeScript/Vite.

## Princípios

- Sem teto artificial fixo de cenas/projetos/duração no domínio.
- Quando o processamento assíncrono for implementado, trabalhos longos serão divididos por cenas.
- Limites reais de GPU, armazenamento, tempo e custo devem ser exibidos com transparência.
- Falhas não podem ser mascaradas como sucesso.
- Segredos apenas em variáveis de ambiente; nunca commitar tokens.
- Não afirmar geração/renderização concluída sem artefato realmente produzido e validado.

## Roadmap

1. Fundação web/API e validações.
2. Persistência PostgreSQL, armazenamento de mídia e fila Redis.
3. Workers e adaptadores para motores de vídeo/áudio.
4. Continuidade de personagens, voz e lip-sync.
5. Timeline, legendas, trilha e renderização FFmpeg.
6. Autenticação, quotas transparentes, observabilidade e implantação.


## Deploy do frontend na Vercel

O repositório está preparado para deploy do frontend React/Vite na Vercel por meio do arquivo `vercel.json`.

1. Na Vercel, escolha **Add New → Project** e importe `objetivoemandamento/trevox-ai-studio`.
2. Mantenha a raiz do projeto como a raiz do repositório. O `vercel.json` já define instalação, build e saída em `apps/web/dist`.
3. Configure a variável de ambiente `VITE_API_URL` com a URL pública da API FastAPI (sem barra final), por exemplo `https://api.seudominio.com`.
4. Clique em Deploy.

**Importante:** a Vercel hospedará a interface web. A API FastAPI precisa ser publicada separadamente em um serviço compatível com Python (por exemplo Render ou Railway), com `CORS_ORIGINS` configurada para a URL pública da Vercel. Sem a API publicada e a variável `VITE_API_URL` configurada, a página pode abrir, mas a validação de projetos mostrará a API como desconectada.

O arquivo de configuração não cria automaticamente um projeto nem um domínio na conta Vercel.
