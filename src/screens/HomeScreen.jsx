import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
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
      <Text style={[styles.transactionDescription, { color: theme.text }]}>
        {item.description || 'Sem descrição'}
      </Text>
    </View>
    <Text
      style={[
        styles.transactionAmount,
        { color: item.type === 'Entradas' ? theme.green : theme.red },
      ]}
    >
      {item.type === 'Entradas' ? '+' : '-'}R$ {item.total.toFixed(2).replace('.', ',')}
    </Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const [operations, setOperations] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleOperationPress = (item) => {
    if (!item.id) {
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
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const { error } = await supabase
                .from('operations')
                .delete()
                .eq('id', item.id)
                .eq('user_id', user.id);

              if (error) throw error;
              Alert.alert('Sucesso', 'Operação excluída com sucesso!');
              fetchOperations();
            } catch (error) {
              console.error('Erro ao excluir operação:', error);
              Alert.alert('Erro', 'Erro ao excluir operação. Tente novamente.');
            }
          },
        },
        {
          text: 'Editar',
          style: 'default',
          onPress: () => navigation.navigate('Edit', { operations: item }),
        },
      ]
    );
  };

  const fetchOperations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar operações:', error);
      Alert.alert('Erro', 'Erro ao buscar operações.');
      setLoading(false);
      return;
    }

    const mapped = data.map(op => ({
      ...op,
      type: op.type === 'entradas' ? 'Entradas' : 'Saídas',
      displayDate: new Date(op.date).toLocaleDateString('pt-BR'),
    }));

    // Agrupar por data (string formatada)
    const grouped = mapped.reduce((acc, item) => {
      const date = item.displayDate || 'Sem data';
      (acc[date] = acc[date] || []).push(item);
      return acc;
    }, {});

    // Calcula saldo
    const total = mapped.reduce((sum, op) => {
      return op.type === 'Entradas' ? sum + op.total : sum - op.total;
    }, 0);

    setOperations(grouped);
    setBalance(total);
    setLoading(false);
  };

  useEffect(() => {
    fetchOperations();

    const subscription = supabase
      .channel('public:operations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operations' }, () => {
        fetchOperations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.homeContainer, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando...</Text>
      </View>
    );
  }

  const dates = Object.keys(operations);

  return (
    <ScrollView style={[styles.homeContainer, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.balanceTitle, { color: theme.text }]}>Saldo</Text>
        <Text
          style={[
            styles.balanceValue,
            { color: balance >= 0 ? theme.green : theme.red },
          ]}
        >
          R$ {balance.toFixed(2).replace('.', ',')}
        </Text>
      </View>

      {dates.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color={theme.text} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            Nenhuma operação encontrada
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>
            Adicione sua primeira operação!
          </Text>
        </View>
      ) : (
        dates.map(date => (
          <View key={date}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{date}</Text>
            <FlatList
              data={operations[date]}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleOperationPress(item)}>
                  <TransactionItem item={item} theme={theme} />
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
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
    description: PropTypes.string,
    total: PropTypes.number.isRequired,
  }).isRequired,
  theme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  homeContainer: { flex: 1, padding: 20 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  balanceTitle: { fontSize: 20, marginBottom: 7, marginTop: 30 },
  balanceValue: { fontSize: 36, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
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
  transactionDetails: { flex: 1, marginLeft: 10 },
  categorytitle: { fontSize: 18, fontWeight: '600' },
  transactionDescription: { fontSize: 14 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyStateSubtext: { fontSize: 14, marginTop: 5 },
});
