import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useTheme } from "../operacoes/ThemeContext";
import { supabase } from "../../supabase";

const MonthYearSelector = ({
  months,
  selectedMonth,
  selectedYear,
  setTempMonth,
  setTempYear,
  theme,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 15 + i);

  return (
    <View style={{ flexDirection: "row", height: 200 }}>

      {/* Seletor de Mês */}
      <ScrollView style={{ flex: 1, borderRightWidth: 1, borderRightColor: theme.text }}>
        {months.map((m, index) => {
          const isSelected = selectedMonth === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setTempMonth(index)}
              style={{
                padding: 10,
                backgroundColor: isSelected ? theme.selected : "transparent",
              }}
            >
              <Text
                style={{
                  color: isSelected ? theme.selectedText : theme.text,
                  textAlign: "center",
                  fontWeight: isSelected ? "bold" : "normal",
                }}
              >
                {m}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Seletor de Ano */}
      <ScrollView style={{ flex: 1 }}>
        {years.map((y) => {
          const isSelected = selectedYear === y;

          return (
            <TouchableOpacity
              key={y}
              onPress={() => setTempYear(y)}
              style={{
                padding: 10,
                backgroundColor: isSelected ? theme.selected : "transparent",
              }}
            >
              <Text
                style={{
                  color: isSelected ? theme.selectedText : theme.text,
                  textAlign: "center",
                  fontWeight: isSelected ? "bold" : "normal",
                }}
              >
                {String(y)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default function MovimentacoesScreen({ navigation }) {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  const [totalBalance, setTotalBalance] = useState(0);
  const [monthBalance, setMonthBalance] = useState(0);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const fetchOperations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate("Login");
        return;
      }

      const { data, error } = await supabase
        .from("operations")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const mapped = data.map(op => ({
        ...op,
        type: op.type === "entradas" ? "Entradas" : "Saídas",
        dateObj: new Date(op.date),
        displayDate: new Date(op.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      }));

      const total = mapped.reduce((sum, op) => {
        return op.type === "Entradas" ? sum + op.total : sum - op.total;
      }, 0);

      setTotalBalance(total);
      setTransactions(mapped);
    } catch (error) {
      console.error("Erro ao carregar operações:", error);
      Alert.alert("Erro", "Não foi possível carregar as movimentações.");
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (data) => {
    return data.reduce((acc, item) => {
      const day = item.displayDate;
      (acc[day] = acc[day] || []).push(item);
      return acc;
    }, {});
  };

  useEffect(() => {
    fetchOperations();

    const subscription = supabase
      .channel("public:operations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operations" },
        () => fetchOperations()
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  useEffect(() => {
    const filtered = transactions.filter((t) => {
      const d = t.dateObj;
      return (
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    });

    const monthBal = filtered.reduce((sum, op) => {
      return op.type === "Entradas" ? sum + op.total : sum - op.total;
    }, 0);

    const grouped = groupByDate(filtered);
    setFilteredTransactions(grouped);
    setMonthBalance(monthBal);
  }, [selectedMonth, selectedYear, transactions]);

  const handleDeleteTransaction = async (item) => {
    Alert.alert(
      "Excluir operação",
      "Tem certeza que deseja excluir esta operação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("operations")
                .delete()
                .eq("id", item.id);
              if (error) throw error;
              Alert.alert("Sucesso", "Operação excluída com sucesso!");
              fetchOperations();
            } catch (error) {
              Alert.alert("Erro", "Erro ao excluir operação.");
            }
          },
        },
      ]
    );
  };

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleCalendarConfirm = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setShowCalendar(false);
  };

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.background, flex: 1 }]}
      >
        <Text style={{ color: theme.text }}>Carregando...</Text>
      </View>
    );
  }

  const days = Object.keys(filteredTransactions).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.balanceContainer}>
        <Text style={[styles.totalBalanceText, { color: totalBalance >= 0 ? theme.green : theme.red }]}> Saldo Total </Text>
        <Text style={[styles.totalBalanceText, { color: totalBalance >= 0 ? theme.green : theme.red }]}>
          R$ {totalBalance.toFixed(2).replace(".", ",")}
        </Text>
        <Text style={[styles.monthBalanceText, { color: theme.text }]}>
          Saldo de {months[selectedMonth]}:{" "}
          <Text style={{ color: monthBalance >= 0 ? theme.green : theme.red }}>
            R$ {monthBalance.toFixed(2).replace(".", ",")}
          </Text>
        </Text>
      </View>

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setTempMonth(selectedMonth);
          setTempYear(selectedYear);
          setShowCalendar(true);
        }}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {months[selectedMonth]} {selectedYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <MaterialCommunityIcons name="chevron-right" size={30} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            backgroundColor: theme.card,
            width: "80%",
            padding: 20,
            borderRadius: 10,
          }}>
            
            <Text style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: theme.text
            }}>
              Selecionar mês e ano
            </Text>

            <MonthYearSelector
              months={months}
              selectedMonth={tempMonth}
              selectedYear={tempYear}
              setTempMonth={setTempMonth}
              setTempYear={setTempYear}
              theme={theme}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Text style={{ color: theme.red, fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCalendarConfirm}
              >
                <Text style={{ color: theme.green, fontSize: 16 }}>Confirmar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    
      {days.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={theme.text} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Nenhuma operação neste mês</Text>
        </View>
      ) : (
        days.map((day) => (
          <View key={day} style={styles.daySection}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{day}</Text>
            <FlatList
              data={filteredTransactions[day]}
              renderItem={({ item }) => (
                <View
                  style={[styles.transactionItem, { backgroundColor: theme.card }]}
                >
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionCategory, { color: theme.text }]}>
                      {item.category}
                    </Text>
                    <Text style={[styles.transactionDesc, { color: theme.text }]}>
                      {item.description || "Sem descrição"}
                    </Text>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: item.type === "Entradas" ? theme.green : theme.red },
                      ]}
                    >
                      {item.type === "Entradas" ? "+" : "-"}R$
                      {item.total.toFixed(2).replace(".", ",")}
                    </Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("Edit", { operations: item })
                        }
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={20}
                          color={theme.text}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteTransaction(item)}
                        style={{ marginLeft: 10 }}
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={theme.red}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

MovimentacoesScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  totalBalanceText: {
    fontSize: 34,
    fontWeight: "bold",
  },
  monthBalanceText: {
    fontSize: 14,
    marginTop: 5,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  monthTitle: { fontSize: 20, fontWeight: "bold", marginHorizontal: 2 },
  daySection: { marginBottom: 15 },
  dayTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 16, fontWeight: "600" },
  transactionDesc: { fontSize: 14 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { fontSize: 16, fontWeight: "bold" },
  actions: { flexDirection: "row", marginTop: 5 },
  centered: { justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 16, marginTop: 10 },
});