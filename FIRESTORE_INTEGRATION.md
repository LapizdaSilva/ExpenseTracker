# Tutorial: Integração com Firebase Firestore

## Estrutura do Banco de Dados

O aplicativo Gestor utiliza o Firebase Firestore com as seguintes coleções:

### 1. Coleção `operations` (Operações Financeiras)

```javascript
{
  id: "documento_id_automatico",
  type: "Entradas" | "Saídas",
  date: "DD/MM/AAAA",
  account: "Nome da conta",
  description: "Descrição opcional",
  total: 100.50, // Valor numérico
  userId: "uid_do_usuario",
  createdAt: timestamp_do_firestore
}
```

### 2. Coleção `recipes` (Receitas Culinárias)

```javascript
{
  id: "documento_id_automatico",
  name: "Nome da receita",
  ingredients: "Lista de ingredientes",
  instructions: "Instruções de preparo",
  userId: "uid_do_usuario",
  createdAt: timestamp_do_firestore,
  updatedAt: timestamp_do_firestore // Apenas em atualizações
}
```

### 3. Coleção `reminders` (Lembretes)

```javascript
{
  id: "documento_id_automatico",
  title: "Título do lembrete",
  description: "Descrição opcional",
  date: "DD/MM/AAAA",
  time: "HH:MM",
  userId: "uid_do_usuario",
  createdAt: timestamp_do_firestore,
  updatedAt: timestamp_do_firestore // Apenas em atualizações
}
```

## Como Funciona a Integração

### 1. Configuração do Firebase (`src/firebase.js`)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2. Operações CRUD (Create, Read, Update, Delete)

#### Criar Documento

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const data = {
  campo1: 'valor1',
  campo2: 'valor2',
  userId: auth.currentUser.uid,
  createdAt: serverTimestamp(),
};

await addDoc(collection(db, 'nome_da_colecao'), data);
```

#### Ler Documentos em Tempo Real

```javascript
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

const q = query(
  collection(db, 'nome_da_colecao'),
  where('userId', '==', auth.currentUser.uid),
  orderBy('createdAt', 'desc')
);

const unsubscribe = onSnapshot(q, (querySnapshot) => {
  const dados = [];
  querySnapshot.forEach((doc) => {
    dados.push({ id: doc.id, ...doc.data() });
  });
  setDados(dados);
});

// Limpar listener quando componente for desmontado
return () => unsubscribe();
```

#### Atualizar Documento

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

await updateDoc(doc(db, 'nome_da_colecao', 'id_do_documento'), {
  campo1: 'novo_valor',
  updatedAt: serverTimestamp(),
});
```

#### Deletar Documento

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

await deleteDoc(doc(db, 'nome_da_colecao', 'id_do_documento'));
```

### 3. Autenticação de Usuários

#### Registro

```javascript
import { createUserWithEmailAndPassword } from 'firebase/auth';

await createUserWithEmailAndPassword(auth, email, password);
```

#### Login

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

await signInWithEmailAndPassword(auth, email, password);
```

#### Logout

```javascript
import { signOut } from 'firebase/auth';

await signOut(auth);
```

### 4. Segurança dos Dados

Cada documento possui um campo `userId` que garante que:

- Usuários só vejam seus próprios dados
- Operações só sejam realizadas em dados do usuário logado

## Regras de Segurança do Firestore

Configure as seguintes regras no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Operações financeiras
    match /operations/{document} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Lembretes
    match /reminders/{document} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Funcionalidades Implementadas

### Tela de Operações (`AddOperationScreen.js`)

- ✅ Adicionar operações (entradas/saídas)
- ✅ Validação de campos obrigatórios
- ✅ Formatação de valores monetários
- ✅ Salvamento no Firestore

### Tela Principal (`HomeScreen.js`)

- ✅ Exibição de operações em tempo real
- ✅ Cálculo automático do saldo
- ✅ Agrupamento por data
- ✅ Logout com confirmação

### Tela de Receitas (`RecipesScreen.js`)

- ✅ Adicionar/editar/excluir receitas
- ✅ Busca por nome ou ingredientes
- ✅ Modal para criação/edição
- ✅ Confirmação de exclusão

### Tela de Lembretes (`RemindersScreen.js`)

- ✅ Adicionar/editar/excluir lembretes
- ✅ Campos de data e horário
- ✅ Modal para criação/edição
- ✅ Confirmação de exclusão

## Próximos Passos

1. **Configure seu Firebase**: Use o tutorial detalhado fornecido anteriormente
2. **Substitua as credenciais**: Atualize `src/firebase.js` com suas credenciais
3. **Configure as regras de segurança**: Copie as regras acima no Firebase Console
4. **Teste o aplicativo**: Use o Expo Go no seu dispositivo móvel

## Dicas Importantes

- Sempre verifique se o usuário está autenticado antes de fazer operações
- Use `serverTimestamp()` para timestamps consistentes
- Implemente tratamento de erros adequado
- Teste as regras de segurança antes de ir para produção
- Monitore o uso do Firestore para evitar custos excessivos
