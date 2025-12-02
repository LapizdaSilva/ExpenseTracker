import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
      const dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60000);

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
      <View style={[styles.homeContainer, styles.centered]}>
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

  return (
    <ScrollView style={styles.homeContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.balanceTitle}>Saldo</Text>

        <Text
          style={[
            styles.balanceValue,
            { color: balance >= 0 ? theme.green : theme.red },
          ]}
        >
          R$ {balance.toFixed(2).replace('.', ',')}
        </Text>

        <Text style={styles.monthBalance}>
          Saldo de {monthName.charAt(0).toUpperCase() + monthName.slice(1)}:{' '}
          <Text style={{ color: monthBalance >= 0 ? theme.green : theme.red }}>
            R$ {monthBalance.toFixed(2).replace('.', ',')}
          </Text>
        </Text>
      </View>

      {/* LIST */}
      {dates.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="wallet-outline" size={64} color={theme.text} />
          <Text style={styles.emptyStateText}>Nenhuma operação neste mês</Text>
          <Text style={styles.emptyStateSubtext}>Adicione sua primeira operação!</Text>
        </View>
      ) : (
        dates.map(monthYear => (
          <View key={monthYear} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>{monthYear}</Text>

            {operations[monthYear].map(item => (
              <TouchableOpacity key={item.id} onPress={() => handleOperationPress(item)}>
                <View style={styles.transactionItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryTitle}>{item.category}</Text>
                    <Text style={styles.transactionDescription}>
                      {item.description || 'Sem descrição'}
                    </Text>
                    <Text style={styles.transactionDate}>
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
}

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    homeContainer: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.background,
    },

    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    header: {
      marginTop: 30,
      marginBottom: 30,
      alignItems: 'center',
    },

    balanceTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },

    balanceValue: {
      fontSize: 40,
      fontWeight: 'bold',
    },

    monthBalance: {
      marginTop: 6,
      fontSize: 14,
      color: theme.text,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },

    transactionItem: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 2,
    },

    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },

    transactionDescription: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.8,
    },

    transactionDate: {
      marginTop: 3,
      fontSize: 11,
      color: theme.text,
      opacity: 0.7,
    },

    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 12,
      textAlign: 'right',
      alignSelf: 'flex-start',
    },

    emptyState: {
      marginTop: 100,
      alignItems: 'center',
    },

    emptyStateText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },

    emptyStateSubtext: {
      marginTop: 4,
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
    },
  });
