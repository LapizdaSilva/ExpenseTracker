import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';

const RecipesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.navigate('Login');
      return;
    }

    const uid = auth.currentUser.uid;

    const entradasRef = collection(db, 'operations', uid, 'entradas');
    const saidasRef = collection(db, 'operations', uid, 'saidas');

    const qEntradas = query(entradasRef, orderBy('createdAt', 'desc'));
    const qSaidas = query(saidasRef, orderBy('createdAt', 'desc'));

    const unsubEntradas = onSnapshot(qEntradas, (snapshot) => {
      const entradas = snapshot.docs.map(doc => ({
        opId: doc.id,
        type: 'Entradas',
        collectionPath: 'entradas',
        ...doc.data(),
      }));
      updateTransactions(entradas, null);
    });

    const unsubSaidas = onSnapshot(qSaidas, (snapshot) => {
      const saidas = snapshot.docs.map(doc => ({
        opId: doc.id,
        type: 'Saídas',
        collectionPath: 'saidas',
        ...doc.data(),
      }));
      updateTransactions(null, saidas);
    });

    let entradasState = [];
    let saidasState = [];

    const updateTransactions = (newEntradas, newSaidas) => {
      if (newEntradas !== null) entradasState = newEntradas;
      if (newSaidas !== null) saidasState = newSaidas;

      const combined = [...entradasState, ...saidasState];
      combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setTransactions(combined);
      setLoading(false);
    };

    return () => {
      unsubEntradas();
      unsubSaidas();
    };
  }, [navigation]);

  const filteredTransactions = transactions.filter(transaction =>
    (transaction.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (transaction.category || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddTransaction = () => {
    navigation.navigate('Operações', { type: 'Receita' });
  };

  const handleDeleteTransaction = (item) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir esta operação?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'operations', auth.currentUser.uid, item.collectionPath, item.opId));
              Alert.alert('Sucesso', 'Movimentação excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir movimentação:', error);
              Alert.alert('Erro', 'Erro ao excluir movimentação. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value) => {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Histórico de Movimentações</Text>
          <TouchableOpacity onPress={handleAddTransaction} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.text }]}>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar por descrição ou categoria..."
            placeholderTextColor={theme.text}
            value={searchText}
            onChangeText={setSearchText}
          />
          <MaterialCommunityIcons name="magnify" size={24} color={theme.text} style={styles.searchIcon} />
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.text }]}>
              {searchText ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação cadastrada'}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>
              {searchText ? 'Tente buscar por outro termo' : 'Adicione sua primeira movimentação!'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((operations) => (
            <View key={operations.opId} style={[styles.transactionItem, { backgroundColor: theme.card }]}>
              <View style={styles.transactionDetails}>
                <Text style={[styles.transactionCategory, { color: theme.text }]}>{operations.category}</Text>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: operations.type === 'Entradas' ? theme.green : theme.red },
                  ]}
                >
                  {operations.type === 'Entradas' ? '+' : ''}
                  {formatCurrency((operations?.total?.toString?.() || ''))}
                </Text>
                <Text style={[styles.transactionDescription, { color: theme.text }]}>{operations.description}</Text>
              </View>

              <View style={styles.transactionActions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Edit', {
                      operations: operations, 
                    })
                  }
                  style={{ padding: 10 }}
                  accessibilityLabel="Editar movimentação"
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteTransaction(operations)}
                  style={styles.deleteButton}
                  accessibilityLabel="Excluir movimentação"
                >
                  <MaterialCommunityIcons name="delete" size={20} color={theme.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

RecipesScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 50,
  },
  searchIcon: {
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 10,
  },
});

export default RecipesScreen;
