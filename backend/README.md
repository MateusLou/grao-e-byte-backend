# Grao & Byte - Backend

API REST do sistema de gestao de estoque e vendas **Grao & Byte**, desenvolvido para o Hackathon Insper Jr 2026.

## Sobre o Projeto

O Grao & Byte e um sistema completo de gestao para negocios do ramo alimenticio (cafeterias, graos, etc.), cobrindo desde o controle de estoque ate vendas, metas e auditoria. O backend fornece uma API RESTful segura com autenticacao JWT, controle de acesso por roles e transacoes MongoDB para garantir consistencia de dados.

## Tecnologias

| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 4.21 | Framework HTTP e rotas REST |
| **MongoDB Atlas** | 7.0 | Banco de dados NoSQL na nuvem |
| **Mongoose** | 8.8 | ODM para modelagem de dados |
| **JWT** | 9.0 | Autenticacao stateless via tokens |
| **bcryptjs** | 2.4 | Hash seguro de senhas |
| **dotenv** | 16.4 | Gerenciamento de variaveis de ambiente |
| **cors** | 2.8 | Controle de origens cross-origin |
| **nodemon** | 3.1 | Hot-reload em desenvolvimento |

## Arquitetura

```
backend/
  server.js              # Ponto de entrada, conexao MongoDB, middlewares globais
  models/
    User.js              # Schema de usuarios (nome, email, senha, role)
    Product.js           # Schema de produtos (nome, descricao, preco, categoria, tags)
    Venda.js             # Schema de vendas (itens, total, status, timestamps)
    Movimentacao.js      # Schema de movimentacoes de estoque (entrada/saida)
    Meta.js              # Schema de metas (diaria/semanal, faturamento/pedidos)
    Log.js               # Schema de auditoria (acao, entidade, usuario, data)
  routes/
    auth.js              # Registro, login, gestao de funcionarios
    products.js          # CRUD de produtos, stats, tags, reordenacao
    vendas.js            # Criar vendas, listar, atualizar status, cancelar
    movimentacoes.js     # Registrar e consultar movimentacoes de estoque
    dashboard.js         # Agregacoes para KPIs, graficos e metricas
    metas.js             # CRUD de metas de vendas
    logs.js              # Consulta de historico de auditoria
    cardapio.js          # Endpoint publico do cardapio (sem autenticacao)
  middleware/
    auth.js              # Verificacao de JWT e extracao de userId/role
    requireGerente.js    # Bloqueio de acesso para funcionarios
  helpers/
    logHelper.js         # Funcao centralizada de registro de auditoria
```

## Modelos de Dados

### User
| Campo | Tipo | Descricao |
|-------|------|-----------|
| nome | String | Nome completo (obrigatorio) |
| email | String | Email unico (obrigatorio, validado) |
| senha | String | Hash bcrypt (min 6 caracteres) |
| role | Enum | `gerente` ou `funcionario` (default: funcionario) |

### Product
| Campo | Tipo | Descricao |
|-------|------|-----------|
| nome | String | Nome do produto (obrigatorio) |
| descricao | String | Descricao do produto (obrigatorio) |
| preco | Number | Preco unitario em R$ (obrigatorio) |
| categoria | String | Categoria (Graos, Insumos, Alimentos, Descartaveis, Outros) |
| ativo | Boolean | Se o produto esta ativo para venda (default: true) |
| tags | [String] | Tags para filtragem rapida |
| posicao | Number | Posicao para ordenacao manual via drag-and-drop |

> **Nota:** O estoque nao e armazenado no produto. E calculado dinamicamente como `SUM(entradas) - SUM(saidas)` a partir das movimentacoes.

### Venda
| Campo | Tipo | Descricao |
|-------|------|-----------|
| itens | [Object] | Array com `produtoId`, `nome`, `quantidade`, `precoUnit` |
| total | Number | Valor total da venda |
| status | Enum | `em_andamento` > `pronto` > `finalizado` / `cancelado` |
| userId | ObjectId | Referencia ao usuario que registrou a venda |
| criadoEm | Date | Data de criacao (default: agora) |
| finalizadoEm | Date | Data de finalizacao (preenchido automaticamente) |

### Movimentacao
| Campo | Tipo | Descricao |
|-------|------|-----------|
| produtoId | ObjectId | Referencia ao produto |
| userId | ObjectId | Referencia ao usuario |
| tipo | Enum | `entrada` ou `saida` |
| origem | Enum | `manual`, `venda` ou `cancelamento` |
| quantidade | Number | Quantidade movimentada (min: 1) |
| data | Date | Data da movimentacao |

### Meta
| Campo | Tipo | Descricao |
|-------|------|-----------|
| tipo | Enum | `diaria` ou `semanal` |
| metrica | Enum | `faturamento` ou `pedidos` |
| valor | Number | Valor alvo da meta |
| inicioVigencia | Date | Inicio do periodo |
| fimVigencia | Date | Fim do periodo |
| criadoPor | ObjectId | Gerente que criou a meta |

### Log (Auditoria)
| Campo | Tipo | Descricao |
|-------|------|-----------|
| acao | Enum | `criar`, `editar`, `excluir`, `toggle_ativo`, `entrada`, `saida`, `registro`, `remover_funcionario`, `venda`, `cancelar_venda`, `meta` |
| entidade | Enum | `produto`, `funcionario`, `movimentacao`, `venda`, `meta` |
| entidadeId | ObjectId | ID da entidade afetada |
| entidadeNome | String | Nome descritivo da entidade |
| userId | ObjectId | Usuario que realizou a acao |
| detalhes | String | Descricao adicional |
| data | Date | Timestamp da acao |

## Rotas da API

### Autenticacao (`/api/auth`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| POST | `/registro` | JWT | Gerente | Registrar novo funcionario |
| POST | `/login` | - | - | Login (retorna JWT + dados do usuario) |
| GET | `/funcionarios` | JWT | Gerente | Listar todos os funcionarios |
| DELETE | `/funcionarios/:id` | JWT | Gerente | Remover funcionario |

### Produtos (`/api/products`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| GET | `/` | JWT | Todos | Listar produtos com estoque calculado |
| GET | `/stats` | JWT | Todos | Estatisticas (total, por categoria, inativos) |
| GET | `/tags` | JWT | Todos | Listar todas as tags unicas |
| GET | `/:id` | JWT | Todos | Detalhes de um produto |
| POST | `/` | JWT | Gerente | Criar novo produto |
| PUT | `/:id` | JWT | Gerente | Atualizar produto |
| PATCH | `/:id/toggle` | JWT | Gerente | Ativar/desativar produto |
| DELETE | `/:id` | JWT | Gerente | Excluir produto |
| PUT | `/reorder` | JWT | Gerente | Reordenar produtos (drag-and-drop) |

### Vendas (`/api/vendas`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| POST | `/` | JWT | Todos | Criar nova venda (com transacao MongoDB) |
| GET | `/` | JWT | Todos | Listar ultimas 50 vendas |
| GET | `/:id` | JWT | Todos | Detalhes de uma venda |
| PATCH | `/:id/status` | JWT | Todos | Atualizar status da venda |

### Movimentacoes (`/api/movimentacoes`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| POST | `/` | JWT | Todos | Registrar entrada ou saida de estoque |
| GET | `/` | JWT | Gerente | Listar todas as movimentacoes |
| GET | `/:produtoId` | JWT | Todos | Historico de movimentacoes de um produto |

### Dashboard (`/api/dashboard`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| GET | `/` | JWT | Gerente | Dados agregados: faturamento, pedidos, estoque critico, metas, top vendidos, grafico por hora, ultimas vendas |

### Metas (`/api/metas`)

| Metodo | Rota | Auth | Role | Descricao |
|--------|------|------|------|-----------|
| GET | `/` | JWT | Todos | Listar metas ativas |
| POST | `/` | JWT | Gerente | Criar nova meta |
| PUT | `/:id` | JWT | Gerente | Editar meta |
| DELETE | `/:id` | JWT | Gerente | Remover meta |

### Outros

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/api/cardapio` | - | Cardapio publico (produtos ativos com estoque > 0) |
| GET | `/api/logs` | JWT (Gerente) | Historico de auditoria com filtros |

## Logica de Negocio

### Calculo de Estoque
O estoque de cada produto e calculado dinamicamente:
```
estoque = SUM(movimentacoes tipo='entrada') - SUM(movimentacoes tipo='saida')
```

### Estoque Critico
Um produto e considerado critico quando:
```
estoque <= media_diaria_de_saidas AND media_diaria > 0
```

### Fluxo de Vendas
1. Usuario adiciona itens ao carrinho
2. Backend valida estoque de cada item (dentro de transacao MongoDB)
3. Venda criada com status `em_andamento`
4. Movimentacoes de saida criadas automaticamente para cada item
5. Status pode ser atualizado: `pronto` > `finalizado`
6. Se cancelada: movimentacoes de entrada compensatorias sao criadas

### Protecao contra Oversell
Vendas usam **transacoes MongoDB** para garantir que:
- A checagem de estoque e a criacao de movimentacoes sao atomicas
- Duas vendas simultaneas nao podem vender mais do que existe

### Timezone
Todas as agregacoes de data usam o timezone `America/Sao_Paulo` para garantir que os filtros de "hoje", "ontem" e "semana passada" funcionem corretamente.

## Seguranca

- Senhas hasheadas com bcrypt (salt rounds: 10)
- Autenticacao via JWT com expiracao de 24h
- Controle de acesso por roles (gerente/funcionario)
- Validacao de inputs no registro (nome min 2 chars, email valido, senha min 6 chars)
- Endpoints protegidos por middleware de autenticacao
- Migracao de admin e one-time (so executa se nenhum gerente existir)
- CORS configurado para origens especificas

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/grao-e-byte
JWT_SECRET=sua_chave_secreta_segura
PORT=3001
```

> **Importante:** Nunca commite o arquivo `.env`. Ele ja esta no `.gitignore`.

## Como Rodar

### Pre-requisitos
- Node.js 18+
- Conta no MongoDB Atlas (ou MongoDB local)

### Instalacao

```bash
# Instalar dependencias
npm install

# Desenvolvimento (com hot-reload)
npm run dev

# Producao
npm start

# Seed do banco de dados (dados iniciais)
npm run seed

# Limpar seed
npm run seed:clear
```

O servidor inicia na porta configurada (default: `3001`).

## Deploy em Producao (Render)

O backend serve tanto a API quanto o frontend em producao, formando um deploy unificado. Isso garante que o QR Code do cardapio funcione corretamente em dispositivos moveis, pois a URL gerada aponta para o dominio publico do Render.

### Como funciona

1. O script `render-build.sh` instala as dependencias do backend, clona e builda o frontend, e copia os arquivos estaticos para a pasta `public/`.
2. Em producao (`NODE_ENV=production`), o Express serve os arquivos estaticos do frontend e redireciona rotas nao-API para `index.html` (SPA catch-all).
3. Todas as chamadas `/api/*` continuam funcionando normalmente pois estao na mesma origem.

### Configuracao no Render

1. Crie um **Web Service** no [Render](https://render.com)
2. Conecte o repositorio `grao-e-byte-backend`
3. Configure:

| Campo | Valor |
|-------|-------|
| **Build Command** | `chmod +x render-build.sh && bash render-build.sh` |
| **Start Command** | `node server.js` |
| **Environment** | Node |

4. Adicione as variaveis de ambiente:

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `MONGO_URI` | `mongodb+srv://...` | String de conexao do MongoDB Atlas |
| `JWT_SECRET` | (chave secreta) | Chave para assinar tokens JWT |
| `NODE_ENV` | `production` | Ativa serving de arquivos estaticos |

5. Clique em **Create Web Service** e aguarde o deploy.

### QR Code do Cardapio

Apos o deploy, o QR Code gerado no Dashboard aponta automaticamente para `https://seu-app.onrender.com/cardapio`. Clientes podem escanear com o celular para acessar o cardapio publico — sem necessidade de login.

O cardapio exibe apenas produtos que estao **ativos** (`ativo: true`) e possuem **estoque disponivel** (`estoque > 0`).

### Arquitetura de Deploy

```
Render Web Service
  render-build.sh          # Clona frontend, builda, copia para public/
  server.js                # Express: API + arquivos estaticos + SPA catch-all
  public/                  # Build do frontend (gerado no deploy, nao commitado)
    index.html
    assets/
```

## Equipe

Desenvolvido por **Mateus Loureiro** - Insper, 1o semestre de Engenharia de Producao.
Hackathon Insper Jr 2026.
