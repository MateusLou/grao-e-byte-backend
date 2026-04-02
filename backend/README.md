# Grao & Byte - Backend

API REST do sistema de gestao de estoque e vendas **Grao & Byte**, desenvolvido para o Hackathon Insper Jr 2026.

## Tecnologias

- **Node.js** + **Express** - Servidor HTTP e rotas REST
- **MongoDB** + **Mongoose** - Banco de dados NoSQL e ODM
- **JWT** - Autenticacao e controle de acesso
- **bcryptjs** - Hash de senhas

## Funcionalidades

- CRUD completo de produtos com categorias e tags
- Sistema de movimentacoes de estoque (entradas e saidas)
- Controle de vendas com fluxo de status (em_andamento > pronto > finalizado/cancelado)
- Dashboard com metricas financeiras e KPIs
- Sistema de metas (diarias e semanais)
- Historico de auditoria (logs de todas as acoes)
- Cardapio publico com filtragem por estoque
- Controle de acesso por roles (gerente / funcionario)
- Gestao de equipe (funcionarios)

## Estrutura

```
backend/
  server.js          # Ponto de entrada, conexao MongoDB
  models/            # Schemas Mongoose (Product, User, Venda, Movimentacao, Log, Meta)
  routes/            # Rotas da API (products, vendas, movimentacoes, auth, logs, metas, dashboard, cardapio)
  middleware/        # auth.js (JWT), requireGerente.js (controle de role)
  helpers/           # logHelper.js (registro de auditoria)
```

## Rotas da API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/auth/registro` | Registro de usuario |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/products` | Listar produtos com estoque calculado |
| POST | `/api/products` | Criar produto (gerente) |
| PUT | `/api/products/:id` | Editar produto (gerente) |
| DELETE | `/api/products/:id` | Excluir produto (gerente) |
| POST | `/api/movimentacoes` | Registrar entrada/saida |
| GET | `/api/movimentacoes` | Listar movimentacoes (gerente) |
| POST | `/api/vendas` | Criar nova venda |
| PATCH | `/api/vendas/:id/status` | Atualizar status da venda |
| GET | `/api/dashboard` | Dados do dashboard |
| GET | `/api/metas` | Listar metas |
| GET | `/api/logs` | Historico de auditoria (gerente) |
| GET | `/api/cardapio` | Cardapio publico |

## Como rodar

1. Clone o repositorio
2. Instale as dependencias:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` com as variaveis:
   ```
   MONGO_URI=sua_uri_do_mongodb
   JWT_SECRET=seu_segredo_jwt
   PORT=3001
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```

## Equipe

Desenvolvido por **Mateus Loureiro** - Insper, 1o semestre de Engenharia de Producao.
