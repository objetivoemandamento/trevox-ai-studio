# Arquitetura do TREVOX IA Studio

## Visão do sistema

Browser (React) -> API (FastAPI) -> banco de dados + fila -> workers CPU/GPU -> storage de mídia -> editor/timeline -> renderizador.

A aplicação web não deve executar modelos pesados no navegador. A inferência acontece em workers separados, escaláveis e monitorados.

## Domínio

- Workspace: espaço de trabalho do usuário.
- Project: projeto audiovisual sem teto artificial de duração ou número de cenas.
- Character: identidade visual persistente, referências, descrição e voz associada.
- Scene: unidade independente de roteiro, geração e revisão.
- GenerationJob: execução assíncrona, estado, tentativas, logs e artefatos.
- Asset: imagens, vídeos, áudios, legendas e versões.
- RenderJob: composição final e validação técnica do arquivo.

## Estados de job

queued -> running -> succeeded | retry_wait | failed | cancelled.

Falhas transitórias podem ser retentadas com backoff e limite operacional configurável. Erros de validação, parâmetros inválidos ou referências inexistentes são permanentes até correção. Nunca mascarar falha como sucesso.

## Motores previstos

Adaptadores desacoplados para geração de vídeo, TTS, lip-sync e pós-produção. Cada adaptador deve declarar disponibilidade, requisitos de hardware, licença, versão do modelo, parâmetros suportados e custos estimados.

Modelos candidatos devem passar por revisão de licença dos pesos e do código antes de qualquer uso comercial. O uso de um repositório open-source não garante que todos os pesos/datasets tenham a mesma licença.

## Escala e duração

Duração livre no modelo de domínio: vídeo longo é um conjunto de cenas/segmentos. O sistema deve apresentar estimativa de processamento, armazenamento e custo, em vez de impor um limite arbitrário. Limitações físicas e operacionais devem ser explícitas.
