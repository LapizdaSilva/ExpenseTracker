import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';


const TransactionItem = ({ item, theme }) => (
  <View style={[styles.transactionItem, { backgroundColor: theme.card }]}>
    <MaterialCommunityIcons
      name={item.type === 'Entradas' ? 'arrow-up' : 'arrow-down'}
      size={26}
      color={item.type === 'Entradas' ? theme.green : theme.red}
    />
    <View style={styles.transactionDetails}>
      <Text style={[styles.categorytitle, { color: theme.text }]}>{item.category}</Text>
      <Text style={[styles.transactionValue, { color: theme.text }]}>{item.account}</Text>
      <Text style={[styles.transactionDescription, { color: theme.text }]}>{item.description || 'Sem descrição'}</Text>
    </View>
    <Text style={[
      styles.transactionAmount,
      { color: item.type === 'Entradas' ? theme.green : theme.red }
    ]}>
      {item.type === 'Entradas' ? '+' : '-'}R$ {item.total.toFixed(2).replace('.', ',')}
    </Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [operations, setOperations] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const butaoclick = (item) => {
    if (!item.opId) {
      Alert.alert('Erro', 'ID da operação não encontrado.');
      return;
    } 

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
              Alert.alert('Sucesso', 'Operação excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir operação:', error);
              Alert.alert('Erro', 'Erro ao excluir operação. Tente novamente.');
            }
          }
        },
        { text: 'Editar', style: 'default', onPress: async () => {
          navigation.navigate('Edit', {operations : item});
        }},
      ]
    );
  };

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
        ...doc.data(),
        collectionPath: `entradas`,
      }));
      updateOperations(entradas, null);
    });

    const unsubSaidas = onSnapshot(qSaidas, (snapshot) => {
      const saidas = snapshot.docs.map(doc => ({
        opId: doc.id,
        type: 'Saídas',
        ...doc.data(),
        collectionPath: `saidas`,
      }));
      updateOperations(null, saidas);
    });

    let entradasState = [];
    let saidasState = [];

    const updateOperations = (newEntradas, newSaidas) => {
      if (newEntradas !== null) entradasState = newEntradas;
      if (newSaidas !== null) saidasState = newSaidas;

      const combined = [...entradasState, ...saidasState];
      combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      let total = 0;
      combined.forEach(op => {
        total += op.type === 'Entradas' ? op.total : -op.total;
      });

      setOperations(combined);
      setBalance(total);
      setLoading(false);
    };

    return () => {
      unsubEntradas();
      unsubSaidas();
    };
  }, [navigation]);


  const groupOperationsByDate = (operations) => {
    return operations.reduce((acc, item) => {
      const date = item.date || 'Sem data';
      (acc[date] = acc[date] || []).push(item);
      return acc;
    }, {});
  };

  const groupedOperations = groupOperationsByDate(operations);

  if (loading) {
    return (
      <View style={[styles.homeContainer, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.homeContainer, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.balanceTitle, { color: theme.text }]}>Saldo</Text>
          <Text style={[
            styles.balanceValue,
            { color: balance >= 0 ? theme.green : theme.red }   // AQUI
          ]}>
            R$ {balance.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>

      {operations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color={theme.text} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>Nenhuma operação encontrada</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>Adicione sua primeira operação!</Text>
        </View>
      ) : (
        Object.keys(groupedOperations).map(date => (
          <View key={date}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{date}</Text>
            <FlatList
              data={groupedOperations[date]}
              renderItem={({ item }) =>
                <TouchableOpacity onPress={() => butaoclick(item)}>
                   <TransactionItem item={item} theme={theme} />
                </TouchableOpacity>
              }
              keyExtractor={item => item.opId}
              scrollEnabled={false}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

TransactionItem.propTypes = {
    item: PropTypes.shape({
      type: PropTypes.string.isRequired,
      category: PropTypes.string,
      account: PropTypes.string,
      description: PropTypes.string,
      total: PropTypes.number.isRequired,
    }).isRequired,
    theme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  categorytitle: {
    fontSize: 20,

  },
  balanceTitle: {
    fontSize: 20,
    marginBottom: 7,
    marginTop: 30,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
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
    marginLeft: 10,
  },
  transactionValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
});