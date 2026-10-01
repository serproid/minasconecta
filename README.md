# Minasconecta

React + Vite. Fluxo de validação de identidade por CPF com criação de senhas de 6 e 8 dígitos.

## Rodar localmente

```
npm install
npm run dev
```

A consulta de CPF é feita pela função Supabase `consultar-cpf`. O fluxo de pagamento via Pix e a geração de QR Code foram removidos: o cadastro é finalizado logo após a criação das senhas, sem etapa de pagamento.

## Estrutura

```
src/
  App.jsx              # orquestra o fluxo de 6 etapas
  App.css / index.css  # estilos (gradiente e componentes)
  utils/cpf.js         # máscara e validação de dígito verificador do CPF
  utils/pin.js         # bloqueio de senhas fracas (repetidas/sequenciais)
```

## Publicar no GitHub

```
git init
git remote add origin https://github.com/minasconecta/newproject.git
git add .
git commit -m "Minasconecta: validação de identidade"
git branch -M main
git push -u origin main
```
