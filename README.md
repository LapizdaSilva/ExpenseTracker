# 📱 Credo

[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Sobre o Projeto

Este é o **Credo**, um aplicativo mobile de gestão financeira pessoal desenvolvido em **React Native**, com backend baseado em **Supabase** para autenticação e persistência de dados.

O projeto foi desenvolvido integralmente como parte do curso técnico em Desenvolvimento de Sistemas, com o objetivo de consolidar habilidades em desenvolvimento mobile, integrações full stack e design de interfaces.

## 🚀 Funcionalidades

O Credo oferece um conjunto robusto de funcionalidades para o controle financeiro:

### 📊 Gestão Financeira

- **Registro de Transações:** Adicione entradas e saídas com facilidade.
- **Categorização:** Utilize categorias pré-definidas (ex.: Transporte, Alimentação, etc.).
- **Detalhes da Operação:** Adicione descrição e valor para cada transação.
- **Manutenção:** Edite e remova operações existentes.
- **Visualização:** Listagem clara e organizada de todas as transações.

### 🗓️ Sistema de Lembretes

- **Calendário Interativo:** Visualize dias com transações ou lembretes marcados.
- **Filtro por Dia:** Exibição filtrada de operações e lembretes por dia.
- **Status de Lembretes:** Filtros para lembretes ativos, inativos e todos.
- **Agendamento:** Agendamento com dia e hora específicos.
- **Notificações:** Notificações locais para lembretes.

### ⚙️ Configurações

- **Personalização:** Tema claro/escuro.
- **Notificações:** Ativar/desativar notificações.
- **Informações:** Acesso a informações do aplicativo.

### 👤 Autenticação e Segurança

- **Supabase Auth:** Registro e login de usuários.
- **Persistência de Sessão:** Manutenção da sessão do usuário.
- **Segurança:** Armazenamento seguro de dados.

## 🧰 Tecnologias Utilizadas

| Categoria             | Tecnologia                 | Descrição                                                       |
| :-------------------- | :------------------------- | :-------------------------------------------------------------- |
| **Front-end**         | React Native, Expo         | Desenvolvimento mobile multiplataforma.                         |
|                       | React Navigation           | Navegação entre telas.                                          |
|                       | React Hook Form, Hooks     | Gerenciamento de formulários e estado.                          |
|                       | Async Storage              | Armazenamento local de dados.                                   |
| **Back-end / Infra**  | Supabase (Auth + Postgres) | Backend-as-a-Service, autenticação e banco de dados relacional. |
|                       | Modelagem de Dados         | Estrutura de tabelas otimizada.                                 |
|                       | Políticas de Acesso        | Regras de segurança e políticas de acesso.                      |
| **Ferramentas e Dev** | WSL, Android SDK           | Configuração para builds Android e desenvolvimento local.       |
|                       | Testes Manuais             | Testes manuais estruturados.                                    |
|                       | Eslint/Prettier            | Ferramentas de linting e formatação de código (se aplicável).   |

## 🛠️ Como Rodar o Projeto

Siga os passos abaixo para configurar e executar o projeto em sua máquina:

### 1. Clonar o Repositório

```bash
git clone https://github.com/LapizdaSilva/ExpenseTracker.git
cd ExpenseTracker
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Iniciar o Projeto

```bash
npx expo start
```

## 📦 Build Android (APK / AAB)

Para gerar o build do aplicativo para Android, você pode usar o EAS (Expo Application Services) ou o build local:

### Opção 1: Usando EAS

```bash
eas build -p android --profile preview
```

### Opção 2: Build Local (Requer WSL/Android SDK configurado)

```bash
eas build --platform android --local --profile preview
```

---

Feito com 💙
