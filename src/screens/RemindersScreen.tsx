import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Animated,
  SectionList,
  Platform,
  TextInput,
} from 'react-native';

import { Calendar } from 'react-native-calendars';
import { useTheme } from '../operacoes/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Easing } from 'react-native-reanimated';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1
  ).padStart(2, '0')}/${date.getFullYear()}`;
}

// Formata hora HH:MM
function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    Alert.alert('Erro', 'Notificações funcionam apenas em dispositivos físicos.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permissão negada', 'Você precisa permitir notificações para usar este recurso.');
  }
}

async function scheduleLocalNotification(
  reminderDate: string,
  reminderTime: string,
  title: string,
  body: string
) {
  try {
    const [day, month, year] = reminderDate.split('/').map(Number);
    const [hour, minute] = reminderTime.split(':').map(Number);
    const triggerDate = new Date(year, month - 1, day, hour, minute);

    if (isNaN(triggerDate.getTime())) {
      throw new Error('Data ou hora inválidas.');
    }

    const now = new Date();
    const diff = triggerDate.getTime() - now.getTime();

    if (diff <= 0) throw new Error('Escolha uma data e hora no futuro.');

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: triggerDate as any,
    });

    return notificationId;
  } catch (err) {
    Alert.alert('Erro', (err as Error).message);
    return null;
  }
}

// 🆕 Componente de Seleção de Data/Hora Customizado (Substituindo DateTimePicker)
const CustomDateTimePicker = ({
  visible,
  onClose,
  mode,
  date,
  onDateChange,
  theme,
}) => {
  const [tempDate, setTempDate] = useState(date);

  const handleConfirm = () => {
    onDateChange(tempDate);
    onClose();
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  // Se for data, usa o Calendar. Se for hora, usa um picker simples (ou mantém o DateTimePicker para hora se for o caso)
  // Como o objetivo é remover a dependência nativa, vamos usar um modal simples para hora.
  // No entanto, para manter a funcionalidade, vamos focar em remover a dependência nativa do @react-native-community/datetimepicker
  // e usar um componente que não a exija. Como não temos um componente de hora sem dependência nativa,
  // vamos usar o Calendar para data e um input simples para hora, ou manter o DateTimePicker
  // se o usuário for usar o Expo Go (o que não é o caso, já que ele está fazendo build nativa).
  // A melhor abordagem é usar um componente que não seja nativo.

  if (mode === 'date') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, width: '95%' }]}>
            <Calendar
              key={theme.background}
              style={styles.calendar}
              theme={{
                backgroundColor: theme.background,
                calendarBackground: theme.background,
                monthTextColor: theme.text,
                dayTextColor: theme.text,
                selectedDayBackgroundColor: theme.selected,
                selectedDayTextColor: '#FFF',
                textDisabledColor: theme.gray || '#888',
                arrowColor: theme.text,
                dotColor: theme.green,
                selectedDotColor: '#FFF',
              }}
              current={tempDate.toISOString().split('T')[0]}
              onDayPress={(day) => {
                const newDate = new Date(day.timestamp);
                newDate.setHours(date.getHours(), date.getMinutes());
                setTempDate(newDate);
              }}
              markedDates={{
                [tempDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: theme.selected,
                },
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.modalButton, { color: theme.red }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={[styles.modalButton, { color: theme.green }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Para hora, usaremos um modal simples com inputs de texto para evitar dependências nativas
  if (mode === 'time') {
    const [hour, setHour] = useState(date.getHours().toString().padStart(2, '0'));
    const [minute, setMinute] = useState(date.getMinutes().toString().padStart(2, '0'));

    const handleTimeConfirm = () => {
      const h = parseInt(hour);
      const m = parseInt(minute);

      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        Alert.alert('Erro', 'Hora inválida.');
        return;
      }

      const newDate = new Date(date);
      newDate.setHours(h, m);
      onDateChange(newDate);
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, width: '80%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Selecionar Hora</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <TextInput
                style={[styles.timeInput, { borderColor: theme.border, color: theme.text }]}
                value={hour}
                onChangeText={(text) => setHour(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>
              <TextInput
                style={[styles.timeInput, { borderColor: theme.border, color: theme.text }]}
                value={minute}
                onChangeText={(text) => setMinute(text.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.modalButton, { color: theme.red }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTimeConfirm}>
                <Text style={[styles.modalButton, { color: theme.green }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const RemindersScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');

  // Data e hora agora são Date()
  const [reminderDate, setReminderDate] = useState(new Date());
  const [reminderTime, setReminderTime] = useState(new Date());

  // Controles dos pickers (agora para o modal customizado)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [calendarVisible, setCalendarVisible] = useState(true);
  const calendarHeight = useState(new Animated.Value(1))[0];

  const [isSaving, setIsSaving] = useState(false);

  const filters = ['Todos', 'Ativos', 'Vencidos'];

  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchReminders();

    const sub1 = Notifications.addNotificationReceivedListener(() => {});
    const sub2 = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigation.navigate('Login');

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReminders(data || []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os lembretes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDescription('');
    setReminderDate(new Date());
    setReminderTime(new Date());
    setModalVisible(true);
  };

  const handleEditReminder = (r: any) => {
    setEditingReminder(r);
    setReminderTitle(r.title);
    setReminderDescription(r.description);

    const [d, m, y] = r.date.split('/').map(Number);
    const [hh, mm] = r.time.split(':').map(Number);

    setReminderDate(new Date(y, m - 1, d));
    setReminderTime(new Date(y, m - 1, d, hh, mm));

    setModalVisible(true);
  };

  const handleSaveReminder = async () => {
    if (isSaving) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!reminderTitle.trim()) {
      Alert.alert('Erro', 'Preencha o título do lembrete.');
      return;
    }

    setIsSaving(true);

    try {
      const formattedDate = formatDate(reminderDate);
      const formattedTime = formatTime(reminderTime);

      const notificationId = await scheduleLocalNotification(
        formattedDate,
        formattedTime,
        reminderTitle,
        reminderDescription || 'Você tem um lembrete!'
      );

      if (!notificationId) {
        setIsSaving(false);
        return;
      }

      const reminderData = {
        title: reminderTitle.trim(),
        description: reminderDescription.trim(),
        date: formattedDate,
        time: formattedTime,
        user_id: user.id,
        notification_id: notificationId,
        updated_at: new Date().toISOString(),
      };

      if (editingReminder) {
        if (editingReminder.notification_id) {
          try {
            await Notifications.cancelScheduledNotificationAsync(
              editingReminder.notification_id
            );
          } catch {}
        }

        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;

        Alert.alert('Sucesso', 'Lembrete atualizado!');
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([{ ...reminderData, created_at: new Date().toISOString() }]);

        if (error) throw error;

        Alert.alert('Sucesso', 'Lembrete adicionado!');
      }

      setModalVisible(false);
      fetchReminders();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o lembrete.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReminder = (reminder: any) => {
    Alert.alert('Confirmar exclusão', `Excluir o lembrete "${reminder.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            if (reminder.notification_id) {
              try {
                await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
              } catch {}
            }

            if (reminder.id) {
              const { error } = await supabase
                .from('reminders')
                .delete()
                .eq('id', reminder.id);

              if (error) throw error;
            }

            fetchReminders();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível excluir o lembrete.');
          }
        },
      },
    ]);
  };

  const toggleCalendar = () => {
    const newValue = calendarVisible ? 0 : 1;
    setCalendarVisible(!calendarVisible);

    Animated.timing(calendarHeight, {
      toValue: newValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  // FILTRAGEM
  const filteredReminders = reminders.filter((reminder) => {
    if (!reminder.date || !reminder.time) return false;

    const [day, month, year] = reminder.date.split('/').map(Number);
    const [hour, minute] = reminder.time.split(':').map(Number);
    const rDate = new Date(year, month - 1, day, hour, minute);

    const now = new Date();
    const isActive = rDate > now;

    if (selectedFilter === 'Ativos' && !isActive) return false;
    if (selectedFilter === 'Vencidos' && isActive) return false;

    if (selectedDate) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (selectedDate !== key) return false;
    }

    return true;
  });

  // Ordenar pelo mais próximo
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    const [dA, mA, yA] = a.date.split('/').map(Number);
    const [hA, minA] = a.time.split(':').map(Number);

    const [dB, mB, yB] = b.date.split('/').map(Number);
    const [hB, minB] = b.time.split(':').map(Number);

    const dateA = new Date(yA, mA - 1, dA, hA, minA).getTime();
    const dateB = new Date(yB, mB - 1, dB, hB, minB).getTime();

    return dateA - dateB;
  });

  // Agrupar por mês
  const sections = (() => {
    const acc: { [key: string]: { title: string; data: any[] } } = {};
    const order: string[] = [];

    sortedReminders.forEach((r) => {
      const [day, month, year] = r.date.split('/').map(Number);
      const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });

      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;

      if (!acc[label]) {
        acc[label] = { title: label, data: [] };
        order.push(label);
      }

      acc[label].data.push(r);
    });

    return order.map((k) => acc[k]);
  })();

  const markedDates = (() => {
    const marked: { [key: string]: any } = {};

    reminders.forEach((r) => {
      if (!r.date) return;
      const [d, m, y] = r.date.split('/').map(Number);

      const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      marked[key] = {
        ...(marked[key] || {}),
        marked: true,
        dotColor: theme.green,
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...(marked[selectedDate] || {}),
        customStyles: {
          container: { backgroundColor: theme.selected, borderRadius: 16 },
          text: { color: '#FFF' },
        },
      };
    }

    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];

    if (!selectedDate) {
      marked[todayKey] = {
        customStyles: {
          container: { backgroundColor: '#2dac3187', borderRadius: 16 },
          text: { color: '#FFF', fontWeight: 'bold' },
        },
      };
    }

    return marked;
  })();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando lembretes...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header (substitui o toggle simples) */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Lembretes</Text>
        <TouchableOpacity onPress={toggleCalendar}>
          <MaterialCommunityIcons
            name={calendarVisible ? 'chevron-up' : 'chevron-down'}
            size={28}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Animated.View
        style={{
          overflow: 'hidden',
          opacity: calendarHeight,
          height: calendarHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 370],
          }),
        }}
      >
        <Calendar
          key={theme.background}
          style={styles.calendar}
          markingType={'custom'}
          theme={{
            backgroundColor: theme.background,
            calendarBackground: theme.background,
            monthTextColor: theme.text,
            dayTextColor: theme.text,
            selectedDayBackgroundColor: theme.selected,
            selectedDayTextColor: '#FFF',
            textDisabledColor: theme.gray || '#888',
            arrowColor: theme.text,
            dotColor: theme.green,
            selectedDotColor: '#FFF',
          }}
          enableSwipeMonths
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(prev => (prev === day.dateString ? null : day.dateString));
          }}
        />
      </Animated.View>

      {/* Filters */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
          {filters.map((item) => (
            <TouchableOpacity key={item} onPress={() => setSelectedFilter(item)} style={{ marginRight: 8 }}>
              <View
                style={[
                  styles.filterItem,
                  { backgroundColor: selectedFilter === item ? theme.selected : theme.card },
                ]}>
                <Text
                  style={{
                    color: selectedFilter === item ? '#FFF' : theme.text,
                    fontWeight: 'bold',
                  }}>
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reminder List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isExpired = (() => {
            const [d, m, y] = item.date.split('/').map(Number);
            const [h, min] = item.time.split(':').map(Number);
            return new Date(y, m - 1, d, h, min) < new Date();
          })();

          return (
            <TouchableOpacity
              style={[
                styles.reminderItem,
                { backgroundColor: theme.card },
                isExpired && { opacity: 0.5 },
              ]}
              onPress={() => handleEditReminder(item)}
              onLongPress={() => handleDeleteReminder(item)}
            >
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.text} />
              <View style={styles.reminderDetails}>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.reminderDescription, { color: theme.text }]}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={[styles.reminderDate, { color: theme.text }]}>
                  {item.date} às {item.time}
                </Text>
              </View>
              <View style={styles.reminderActions}>
                <TouchableOpacity
                  onPress={() => handleEditReminder(item)}
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteReminder(item)}
                  style={styles.deleteButton}
                >
                  <MaterialCommunityIcons name="delete" size={18} color={theme.red} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={handleAddReminder}
        style={[
          styles.floatingButton,
          { backgroundColor: theme.selected, zIndex: 999, elevation: 6 },
        ]}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Modal de Edição/Criação */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>

            <TextInput
              style={[
                styles.inputField,
                { borderColor: theme.border, color: theme.text }
              ]}
              placeholder="Título"
              placeholderTextColor={theme.gray}
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />

            <TextInput
              style={[
                styles.inputField,
                { borderColor: theme.border, color: theme.text }
              ]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={theme.gray}
              value={reminderDescription}
              onChangeText={setReminderDescription}
              multiline
            />

            {/* 🆕 Botão de Data (Abre Modal Customizado) */}
            <TouchableOpacity
              style={[styles.inputTouchable, { borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.text }}>
                {formatDate(reminderDate)}
              </Text>
            </TouchableOpacity>

            {/* 🆕 Botão de Hora (Abre Modal Customizado) */}
            <TouchableOpacity
              style={[styles.inputTouchable, { borderColor: theme.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: theme.text }}>
                {formatTime(reminderTime)}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalButton, { color: theme.red }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveReminder}
                disabled={isSaving}
              >
                <Text
                  style={[
                    styles.modalButton,
                    { color: isSaving ? theme.gray : theme.green },
                  ]}
                >
                  {isSaving ? 'Salvando...' : (editingReminder ? 'Salvar' : 'Salvar')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🆕 Modais Customizados de Data e Hora */}
      <CustomDateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        mode="date"
        date={reminderDate}
        onDateChange={setReminderDate}
        theme={theme}
      />

      <CustomDateTimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        mode="time"
        date={reminderTime}
        onDateChange={setReminderTime}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  calendar: { backgroundColor: 'transparent', marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 0, textAlign: 'center' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  filterItem: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  listContent: {
    paddingBottom: 120,
    paddingTop: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  inputField: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      fontSize: 16,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    width: 60,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 10,
  },
  reminderDetails: { flex: 1, marginLeft: 15 },
  reminderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  reminderDescription: { fontSize: 14, marginBottom: 3 },
  reminderDate: { fontSize: 12 },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
  editButton: { padding: 5, marginRight: 5 },
  deleteButton: { padding: 5 },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: '90%', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  inputTouchable: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { fontSize: 16, fontWeight: 'bold' },
  centeredText: { textAlign: 'center' },
});

export default RemindersScreen;