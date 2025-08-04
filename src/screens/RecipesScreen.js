import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';

const RecipesScreen = ({ navigation }) => {
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
      <View style={[styles.container, styles.centered]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Histórico de Movimentações</Text>
          <TouchableOpacity onPress={handleAddTransaction} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color="#6A0DAD" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por descrição ou categoria..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <MaterialCommunityIcons name="magnify" size={24} color="#888" style={styles.searchIcon} />
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação cadastrada'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Tente buscar por outro termo' : 'Adicione sua primeira movimentação!'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((operations) => (
            <View key={operations.opId} style={styles.transactionItem}>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>{operations.category}</Text>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: operations.type === 'Entradas' ? '#2ECC71' : '#E74C3C' },
                  ]}
                >
                  {operations.type === 'Entradas' ? '+' : '-'}{' '}
                  {formatCurrency((operations?.total?.toString?.() || ''))}
                </Text>
                <Text style={styles.transactionDescription}>{operations.description}</Text>
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
                  <MaterialCommunityIcons name="pencil" size={20} color="#6A0DAD" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteTransaction(operations)}
                  style={styles.deleteButton}
                  accessibilityLabel="Excluir movimentação"
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
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
    backgroundColor: '#F5F5F5',
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
    color: '#333',
  },
  addButton: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#DDD',
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
    color: '#CCC',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
    color: 'gray',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
