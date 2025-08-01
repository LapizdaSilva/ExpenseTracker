import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';

const TransactionItem = ({ item }) => (
  <View style={styles.transactionItem}>
    <MaterialCommunityIcons
      name={item.type === 'Entradas' ? 'arrow-up' : 'arrow-down'}
      size={26}
      color={item.type === 'Entradas' ? '#4CAF50' : '#F44336'}
    />
    <View style={styles.transactionDetails}>
      <Text style={styles.categorytitle}>{item.category}</Text>
      <Text style={styles.transactionValue}>{item.account}</Text>
      <Text style={styles.transactionDescription}>{item.description || 'Sem descrição'}</Text>
    </View>
    <Text style={[
      styles.transactionAmount,
      { color: item.type === 'Entradas' ? '#4CAF50' : '#F44336' }
    ]}>
      {item.type === 'Entradas' ? '+' : '-'}R$ {item.total.toFixed(2).replace('.', ',')}
    </Text>
  </View>
);

export default function HomeScreen({ navigation }) {
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
              await deleteDoc(doc(db, 'operations', item.opId));
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

    const q = query(
      collection(db, 'operations'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const operationsData = [];
      let totalBalance = 0; // VARIAVEL BALANÇA

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        operationsData.push({ opId: doc.id, ...data });

        if (data.type === 'Entradas') {
          totalBalance += data.total;
        } else {
          totalBalance -= data.total;
        }
      });

      setOperations(operationsData);
      setBalance(totalBalance);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar operações:', error);
      setLoading(false);
    });

    return () => unsubscribe();
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
      <View style={[styles.homeContainer, styles.centered]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.homeContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.balanceTitle}>Saldo</Text>
          <Text style={[
            styles.balanceValue,
            { color: balance >= 0 ? '#4CAF50' : '#F44336' }   // AQUI
          ]}>
            R$ {balance.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </View>

      {operations.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>Nenhuma operação encontrada</Text>
          <Text style={styles.emptyStateSubtext}>Adicione sua primeira operação!</Text>
        </View>
      ) : (
        Object.keys(groupedOperations).map(date => (
          <View key={date}>
            <Text style={styles.sectionTitle}>{date}</Text>
            <FlatList
              data={groupedOperations[date]}
              renderItem={({ item }) =>
                <TouchableOpacity onPress={() => butaoclick(item)}>
                   <TransactionItem item={item} />
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
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    color: 'black',

  },
  balanceTitle: {
    fontSize: 20,
    color: 'black',
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
    color: 'gray',
    marginTop: 20,
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    color: '#333',
  },
  transactionDescription: {
    fontSize: 14,
    color: 'gray',
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
    color: '#CCC',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
  },
});