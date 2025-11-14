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
  const [monthBalance, setMonthBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar operações:', error);
      Alert.alert('Erro', 'Erro ao buscar operações.');
      setLoading(false);
      return;
    }

    const mapped = data.map(op => {
      const dateUTC = new Date(op.date);
      const dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60000 );

      return {
        ...op,
        type: op.type === 'entradas' ? 'Entradas' : 'Saídas',
        dateObj: dateLocal,
        displayDate: dateLocal.toLocaleDateString('pt-BR'),
      };
    });

    const total = mapped.reduce((sum, op) => {
      return op.type === 'Entradas' ? sum + op.total : sum - op.total;
    }, 0);
    setBalance(total);

    const monthOps = mapped.filter(op => {
      const d = op.dateObj;
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthTotal = monthOps.reduce((sum, op) => {
      return op.type === 'Entradas' ? sum + op.total : sum - op.total;
    }, 0);
    setMonthBalance(monthTotal);

  const grouped = mapped.reduce((acc, item) => {
    const d = item.dateObj;
    const monthName = d.toLocaleString('pt-BR', { month: 'long' });
    const monthYear = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${d.getFullYear()}`;
    (acc[monthYear] = acc[monthYear] || []).push(item);
    return acc;
  }, {});


    setOperations(grouped);
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

  const dates = Object.keys(operations).sort((a, b) => {
    const [monthA, yearA] = a.split(' de ');
    const [monthB, yearB] = b.split(' de ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateB - dateA;
  });

  const monthName = now.toLocaleString('pt-BR', { month: 'long' });

  return (
    <ScrollView style={[styles.homeContainer, { backgroundColor: theme.background }]}>
      {/* 💰 SALDOS */}
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
        <Text style={[styles.monthBalance, { color: theme.text }]}>
          Saldo de {monthName.charAt(0).toUpperCase() + monthName.slice(1)}:{' '}
          <Text style={{ color: monthBalance >= 0 ? theme.green : theme.red }}>
            R$ {monthBalance.toFixed(2).replace('.', ',')}
          </Text>
        </Text>
      </View>

      {dates.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color={theme.text} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>
            Nenhuma operação neste mês
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>
            Adicione sua primeira operação!
          </Text>
        </View>
      ) : (
        dates.map(monthYear => (
          <View key={monthYear}>
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 10 }]}>
              {monthYear}
            </Text>
            {operations[monthYear].map(item => (
              <TouchableOpacity key={item.id} onPress={() => handleOperationPress(item)}>
                <View style={[styles.transactionItem, { backgroundColor: theme.card }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.categorytitle, { color: theme.text }]}>
                      {item.category}
                    </Text>
                    <Text style={[styles.transactionDescription, { color: theme.text }]}>
                      {item.description || 'Sem descrição'}
                    </Text>
                    <Text style={[{ color: theme.text, fontSize: 12, marginTop: 2 }]}>
                      {item.displayDate}
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
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );

  function handleOperationPress(item) {
    if (!item.id) {
      Alert.alert('Erro', 'ID da operação não encontrado.');
      return;
    }

    Alert.alert(
      'Opção',
      'Deseja editar ou excluir esta operação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Editar',
          onPress: () => navigation.navigate('Edit', { operations: item }),
        },
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
      ]
    );
  }
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
  header: { marginBottom: 20, alignItems: 'center', marginTop: 30 },
  balanceTitle: { fontSize: 20, marginBottom: 7 },
  balanceValue: { fontSize: 36, fontWeight: 'bold' },
  monthBalance: { fontSize: 14, marginTop: 5 },
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
