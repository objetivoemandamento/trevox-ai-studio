# Roadmap

## Fase 1 — Fundação (este commit)
- [x] Repositório inicial e documentação.
- [x] API FastAPI com health, catálogo de capacidades e validação de projetos.
- [x] Interface web inicial.
- [x] Testes de validação de cenas e duração.
- [ ] Integração de persistência durável.

## Fase 2 — Execução assíncrona
- [ ] PostgreSQL e migrações.
- [ ] Redis/Celery ou Dramatiq.
- [ ] Estados persistentes, idempotência e recuperação após reinício.
- [ ] Storage S3/R2 e URLs assinadas.

## Fase 3 — Motores reais
- [ ] Adaptador ComfyUI.
- [ ] Adaptador de modelo de vídeo aprovado por licença.
- [ ] Adaptador TTS.
- [ ] Adaptador de lip-sync.
- [ ] Testes de integração com worker GPU real.

## Fase 4 — Edição e render
- [ ] Timeline no navegador.
- [ ] Corte, ordenação, transições e trilha.
- [ ] Legendas e mixagem de áudio.
- [ ] Render MP4 com FFmpeg e validação com ffprobe.

## Fase 5 — Produto
- [ ] Autenticação e workspaces.
- [ ] Controle de acesso e isolamento de arquivos.
- [ ] Orçamento e observabilidade de GPU/storage.
- [ ] Deploy, backups e monitoramento.
