# Grao & Byte - Frontend

Interface web do sistema de gestao de estoque e vendas **Grao & Byte**, desenvolvido para o Hackathon Insper Jr 2026.

## Tecnologias

- **React 18** - Biblioteca de UI
- **React Router v6** - Navegacao SPA
- **Vite** - Build tool e dev server
- **CSS puro** - Estilizacao sem frameworks

## Funcionalidades

- **Dashboard** - Resumo financeiro, metas, estoque critico, top vendidos, grafico por hora
- **Produtos** - CRUD com filtros (categoria, tags, ativo/inativo), ordenacao (estoque, preco, nome), estoque critico/alerta, drag-and-drop para reordenar, exportacao CSV/PDF
- **Vendas (PDV)** - Carrinho de compras, busca e filtros, fluxo de pedidos (em_andamento > pronto > finalizado), historico de vendas
- **Painel do Gerente** - Movimentacoes de estoque com filtros avancados, historico de auditoria completo
- **Alertas de Estoque** - Produtos com estoque critico e em alerta
- **Gestao de Equipe** - Cadastro e remocao de funcionarios
- **Cardapio Publico** - Visualizacao publica dos produtos disponiveis (sem login)

## Estrutura

```
frontend/
  src/
    App.jsx              # Rotas da aplicacao
    main.jsx             # Ponto de entrada
    pages/               # Paginas (Dashboard, Products, Vendas, Movimentacoes, etc.)
    components/          # Componentes reutilizaveis (Layout, ProductCard, Toast, etc.)
      dashboard/         # Sub-componentes do dashboard
    helpers/             # Utilitarios (exportUtils.js)
    App.css              # Estilos globais
```

## Como rodar

1. Clone o repositorio
2. Instale as dependencias:
   ```bash
   npm install
   ```
3. Configure o proxy para o backend em `vite.config.js` (padrao: `http://localhost:3001`)
4. Inicie o dev server:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:5173`

> **Nota:** O backend deve estar rodando na porta 3001 para a API funcionar.

## Roles de usuario

- **Gerente** - Acesso completo: CRUD de produtos, painel de movimentacoes, gestao de equipe, metas, historico
- **Funcionario** - Acesso a vendas, dashboard e visualizacao de produtos

## Equipe

Desenvolvido por **Mateus Loureiro** - Insper, 1o semestre de Engenharia de Producao.
