# Grao & Byte - Frontend

Interface web do sistema de gestao de estoque e vendas **Grao & Byte**, desenvolvido para o Hackathon Insper Jr 2026.

## Sobre o Projeto

O frontend do Grao & Byte e uma Single Page Application (SPA) construida com React 18, oferecendo uma interface completa para gestao de estoque, vendas no estilo PDV, dashboard com KPIs em tempo real, e painel administrativo. O design e responsivo e funciona em desktop, tablet e mobile.

## Tecnologias

| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| **React** | 18.3 | Biblioteca de UI com hooks |
| **React Router** | 6.27 | Navegacao SPA e rotas protegidas |
| **Vite** | 5.4 | Build tool, dev server com HMR e proxy |
| **CSS puro** | - | Estilizacao responsiva sem frameworks |

## Arquitetura

```
frontend/
  index.html                    # Ponto de entrada HTML
  vite.config.js                # Configuracao do Vite (proxy /api -> backend)
  src/
    main.jsx                    # Entrada React (Router + ToastProvider)
    App.jsx                     # Definicao de rotas
    App.css                     # Estilos globais (3000+ linhas)
    pages/
      Login.jsx                 # Tela de login com validacao
      Dashboard.jsx             # Pagina principal com KPIs
      Products.jsx              # Gestao de produtos e estoque
      ProductForm.jsx           # Formulario de criar/editar produto
      Vendas.jsx                # PDV com carrinho, pedidos e historico
      Movimentacoes.jsx         # Historico de movimentacoes (gerente)
      AlertasEstoque.jsx        # Produtos com estoque critico
      Funcionarios.jsx          # Gestao de equipe (gerente)
      Cardapio.jsx              # Cardapio publico (sem login)
    components/
      Layout.jsx                # Sidebar + main content + hamburger mobile
      Header.jsx                # Cabecalho de paginas
      ProductCard.jsx           # Card de produto reutilizavel
      LoadingSpinner.jsx        # Indicador de carregamento
      Toast.jsx                 # Sistema de notificacoes (Context API)
      ConfirmModal.jsx          # Modal de confirmacao para acoes destrutivas
      QRCodeCardapio.jsx        # Gerador de QR Code para cardapio
      dashboard/
        ResumoFinanceiro.jsx    # Cards de faturamento, ticket medio, pedidos
        EstoqueCritico.jsx      # Lista de produtos em nivel critico
        MetasDoDia.jsx          # Metas com barras de progresso + CRUD inline
        TopVendidos.jsx         # Ranking dos 5 mais vendidos do dia
        GraficoPorHora.jsx      # Grafico de barras de movimento por hora
        UltimasVendas.jsx       # Feed das 15 ultimas vendas
        StatusPedidos.jsx       # Semaforo de pedidos ativos (em andamento/prontos)
    helpers/
      validacao.js              # Validacao de email e formularios
      exportUtils.js            # Exportacao para CSV e PDF
```

## Paginas e Funcionalidades

### Login (`/login`)
- Formulario de email/senha com validacao
- Armazenamento de JWT no localStorage
- Redirect automatico apos login (gerente → dashboard, funcionario → produtos)
- Tratamento de erro para credenciais invalidas

### Dashboard (`/dashboard`)
- **Resumo Financeiro** - 4 cards: Faturamento Hoje (vs ontem), Ticket Medio, Pedidos Hoje (vs ontem), Mesmo dia semana passada (com delta %)
- **Status de Pedidos** - Semaforo visual mostrando pedidos em andamento, prontos e total abertos
- **Estoque Critico** - Top 5 produtos em nivel critico com link para ver todos
- **Metas** - Barras de progresso para metas diarias/semanais com CRUD inline (criar, editar, deletar com confirmacao)
- **Top Vendidos** - Ranking dos 5 produtos mais vendidos hoje com quantidade e faturamento
- **Grafico por Hora** - Barras verticais mostrando distribuicao de vendas ao longo do dia (6h-22h)
- **Ultimas Vendas** - Feed com as 15 vendas mais recentes (data, itens, operador, valor)
- **Auto-refresh** a cada 60 segundos com indicador de ultima atualizacao
- **Botao de refresh manual** para atualizacao imediata
- **QR Code** do cardapio publico (apenas gerentes)

### Produtos (`/products`)
- Grid de cards com foto, nome, preco, categoria, tags, estoque
- **Filtros encadeados**: categoria, busca por texto, tags
- **Ordenacao**: estoque, preco, nome, data
- **Acoes do gerente**: editar, ativar/desativar, movimentar estoque (entrada/saida)
- **Drag-and-drop** para reordenar produtos manualmente
- **Exportacao**: CSV e PDF com dados filtrados
- **Indicadores visuais**: badge de estoque critico, alerta, inativo

### Vendas - PDV (`/vendas`)
Tres abas de navegacao:

**Nova Venda**
- Grid de produtos disponiveis (com estoque > 0)
- Busca, filtro por categoria e tags
- Carrinho lateral com controle de quantidade (+/-)
- Validacao de estoque maximo no carrinho
- Botao de registrar venda (desabilita durante envio)
- Refresh automatico de estoque antes de finalizar
- Carrinho trava durante processamento (previne estado inconsistente)

**Pedidos Ativos**
- Cards coloridos por status (amarelo = em andamento, verde = pronto)
- Botoes de acao: "Marcar Pronto", "Finalizar", "Cancelar"
- Cancelamento com modal de confirmacao e restauracao automatica de estoque

**Historico**
- Tabela com todas as vendas finalizadas e canceladas
- Colunas: pedido, itens, total, status, operador, data

### Movimentacoes (`/movimentacoes`) - Gerente
- Tabela completa com todas as movimentacoes de estoque
- Filtros por tipo (entrada/saida) e periodo
- Mostra origem (manual, venda, cancelamento)

### Alertas de Estoque (`/alertas`) - Gerente
- Lista de produtos com estoque critico (estoque <= media diaria de vendas)
- Badge de contagem na sidebar

### Funcionarios (`/funcionarios`) - Gerente
- Formulario de cadastro de novo funcionario (nome, email, senha)
- Lista de funcionarios com botao de remocao
- Protecao contra auto-remocao

### Cardapio Publico (`/cardapio`)
- Acessivel sem login
- Lista produtos ativos com estoque disponivel
- Agrupados por categoria
- QR Code geravel para imprimir e colocar nas mesas

## Controle de Acesso

| Recurso | Gerente | Funcionario |
|---------|---------|-------------|
| Dashboard | Completo + QR Code | Sem acesso |
| Produtos | CRUD completo + exportacao | Somente visualizacao |
| Vendas | Todas as acoes | Todas as acoes |
| Novo Produto | Acesso total | Sem acesso |
| Movimentacoes | Acesso total | Sem acesso |
| Alertas | Acesso total | Sem acesso |
| Funcionarios | CRUD | Sem acesso |
| Metas | CRUD no dashboard | Sem acesso |
| Cardapio | Acesso publico | Acesso publico |

## Componentes Compartilhados

### Layout
- Sidebar fixa com navegacao, logo, avatar do usuario, botao de logout
- Secao "Menu" (todos): Produtos, Vendas
- Secao "Gerencia" (apenas gerente): Dashboard, Novo Produto, Movimentacoes, Alertas, Equipe
- Hamburger menu em mobile com overlay
- Badge de alerta na sidebar (contagem de estoque critico)
- Highlight da pagina ativa

### Toast
- Sistema de notificacoes via Context API
- Tipos: success (verde), error (vermelho), warning (amarelo)
- Auto-dismiss apos 4 segundos
- Acessivel com `role="alert"` e `aria-live="polite"`

### ConfirmModal
- Modal generico de confirmacao para acoes destrutivas
- Customizavel: titulo, mensagem, label do botao, estilo danger

## Design e UX

### Paleta de Cores
- **Primaria**: Amarelo/Laranja `#F59E0B` / `#D97706` (identidade Grao & Byte)
- **Sucesso**: Verde `#059669`
- **Erro**: Vermelho `#EF4444`
- **Info**: Azul `#2563EB`
- **Neutro**: Cinzas `#111827` a `#F9FAFB`

### Responsividade
- **Desktop** (1024px+): Sidebar fixa + conteudo com grid de 2 colunas
- **Tablet** (768px-1023px): Sidebar colapsavel + grid de 1 coluna
- **Mobile** (< 768px): Hamburger menu, cards em 2 colunas, resumo em 2x2

### Tipografia
- Font family: Inter, system fonts fallback
- Peso: 500 (body), 700 (titulos), 800 (numeros destaque)

## Como Rodar

### Pre-requisitos
- Node.js 18+
- Backend rodando na porta 3001

### Instalacao

```bash
# Instalar dependencias
npm install

# Desenvolvimento (com HMR)
npm run dev

# Build para producao
npm run build

# Preview da build
npm run preview
```

O frontend inicia em `http://localhost:5173`.

### Configuracao do Proxy

O Vite esta configurado para redirecionar chamadas `/api` para o backend:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

## Autenticacao

O frontend armazena 3 itens no localStorage apos o login:
- `token` - JWT para autenticacao nas requisicoes
- `nomeUsuario` - Nome do usuario para exibicao
- `userRole` - Role do usuario (`gerente` ou `funcionario`) para controle de acesso visual

Todas as requisicoes autenticadas incluem o header:
```
Authorization: Bearer <token>
```

Se uma requisicao retorna `401`, o token e removido e o usuario e redirecionado para `/login`.

## Deploy em Producao

O frontend e buildado e servido pelo backend em producao (deploy unificado no Render). Isso significa que:

- Nao e necessario hospedar o frontend separadamente
- Todas as chamadas `/api/*` funcionam na mesma origem (sem CORS)
- O QR Code do cardapio gera automaticamente a URL publica correta

### Como funciona

1. O script `render-build.sh` no repositorio do backend clona este repositorio, executa `npm run build`, e copia a pasta `dist/` para o backend.
2. O Express serve os arquivos estaticos e redireciona rotas de pagina para `index.html` (SPA).
3. Para desenvolvimento local, o Vite proxy redireciona `/api/*` para `localhost:3001`.

### Build para producao

```bash
npm run build
```

Gera a pasta `dist/` com os arquivos otimizados para producao.

### QR Code e Cardapio Publico

O cardapio (`/cardapio`) e a unica rota publica da aplicacao. O QR Code e gerado dinamicamente usando `window.location.origin`, garantindo que:

- Em **desenvolvimento**: aponta para `localhost:5173/cardapio`
- Em **producao**: aponta para `https://seu-app.onrender.com/cardapio`

O cardapio exibe apenas produtos **ativos** com **estoque disponivel** (calculado dinamicamente a partir das movimentacoes).

## Equipe

Desenvolvido por **Mateus Loureiro** - Insper, 1o semestre de Engenharia de Producao.
Hackathon Insper Jr 2026.
