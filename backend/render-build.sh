#!/bin/bash
set -e

echo "==> Instalando dependencias do backend..."
npm install

echo "==> Clonando repositorio do frontend..."
git clone https://github.com/MateusLou/grao-e-byte-frontend.git _frontend

echo "==> Instalando dependencias do frontend..."
cd _frontend
npm install

echo "==> Buildando frontend..."
npm run build
cd ..

echo "==> Copiando build para public/..."
rm -rf public
cp -r _frontend/dist public
rm -rf _frontend

echo "==> Build concluido com sucesso!"
