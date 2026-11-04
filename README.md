# TREVOX IA Studio

Plataforma web para planejar, gerar, editar e renderizar vídeos com IA. O usuário final acessa pelo navegador; a inferência de modelos pesados roda em workers GPU separados.

## Estado atual

Esta primeira entrega é a fundação do produto: API FastAPI, interface web React/Vite, contratos de projeto/cenas, fila local de desenvolvimento, validações e testes automatizados. **Ainda não inclui inferência real dos modelos de vídeo, síntese de voz, lip-sync nem renderização MP4 integrada.** Esses motores serão conectados em etapas verificáveis.

## Arquitetura

- `apps/api`: FastAPI, validação de projetos e endpoints.
- `apps/web`: interface React/Vite.
- `packages/contracts`: contratos compartilhados documentados.
- `docs`: arquitetura, roadmap e decisões.
- `infra`: configuração de desenvolvimento.

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

Web:
```bash
cd apps/web
npm install
npm run dev
```

API docs: http://localhost:8000/docs

## Testes

```bash
cd apps/api
pip install -e ".[dev]"
pytest
```

## Princípios

- Sem limites artificiais fixos de cenas/projetos/duração no domínio.
- Trabalhos longos são divididos em cenas e processados por fila.
- Limites operacionais reais (GPU, armazenamento, tempo e custo) devem ser exibidos com transparência.
- Retentativas apenas para falhas transitórias; falhas permanentes ficam registradas.
- Segredos apenas em variáveis de ambiente; nunca commitar tokens.
- Não afirmar geração/renderização concluída sem artefato realmente produzido e validado.

## Roadmap

1. Fundação web/API e validações.
2. Persistência PostgreSQL, armazenamento de mídia e fila Redis.
3. Workers e adaptadores para motores de vídeo/áudio.
4. Continuidade de personagens, voz e lip-sync.
5. Timeline, legendas, trilha e renderização FFmpeg.
6. Autenticação, quotas transparentes, observabilidade e implantação.
