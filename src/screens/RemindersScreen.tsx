import { Calendar } from 'react-native-calendars';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Animated,
  FlatList,
  Platform,
} from 'react-native';
import { useTheme } from '../operacoes/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Easing } from 'react-native-reanimated';

type NotificationBehavior = {
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  shouldShowAlert: boolean;
  shouldShowBanner: boolean; 
  shouldShowList: boolean; 
};

const handleNotification = async (): Promise<NotificationBehavior> => {
  return {
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  };
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,   
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permissão negada', 'Você precisa permitir notificações para usar este recurso.');
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      Alert.alert('Erro', 'Project ID do Expo não encontrado');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);
    return token;
  } else {
    Alert.alert('Erro', 'Use um dispositivo físico para notificações push.');
  }
}

async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { type: 'reminder' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

const RemindersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(true);
  const calendarHeight = useState(new Animated.Value(1))[0];
  const [expoPushToken, setExpoPushToken] = useState('');

  const filters = ['Todos', 'Ativos', 'Vencidos'];

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
      }
    })();

    fetchReminders();

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificação recebida:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Interação com notificação:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (err) {
      console.error('Erro ao buscar lembretes:', err);
      Alert.alert('Erro', 'Não foi possível carregar os lembretes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDescription('');
    setReminderTime('');
    setReminderDate('');
    setModalVisible(true);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderDescription(reminder.description);
    setReminderDate(reminder.date);
    setReminderTime(reminder.time);
    setModalVisible(true);
  };

  const handleSaveReminder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!reminderTitle.trim() || !reminderDate.trim() || !reminderTime.trim()) {
      Alert.alert('Erro', 'Preencha título, data e horário.');
      return;
    }

    const reminderData = {
      title: reminderTitle.trim(),
      description: reminderDescription.trim(),
      date: reminderDate.trim(),
      time: reminderTime.trim(),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingReminder) {
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

      // Agendar notificação local
      try {
        const [day, month, year] = reminderDate.split('/').map(Number);
        const [hour, minute] = reminderTime.split(':').map(Number);
        const triggerDate = new Date(year, month - 1, day, hour, minute);

        if (triggerDate <= new Date()) {
          Alert.alert('Erro', 'Escolha uma data e hora no futuro.');
          return;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminderTitle,
            body: reminderDescription || 'Você tem um lembrete!',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        },
        });

        // Envia notificação push (remota)
        if (expoPushToken) {
          await sendPushNotification(expoPushToken, reminderTitle, reminderDescription || 'Você tem um lembrete!');
        }
      } catch (e) {
        console.error('Erro ao agendar notificação:', e);
      }

      setModalVisible(false);
      fetchReminders();
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      Alert.alert('Erro', 'Não foi possível salvar o lembrete.');
    }
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert('Confirmar exclusão', `Excluir o lembrete "${reminder.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('reminders')
              .delete()
              .eq('id', reminder.id);
            if (error) throw error;
            fetchReminders();
          } catch (error) {
            console.error('Erro ao excluir lembrete:', error);
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

  const filteredReminders = reminders.filter((reminder) => {
    const [day, month, year] = reminder.date.split('/').map(Number);
    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const [hour, minute] = reminder.time.split(':').map(Number);
    const reminderDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const isActive = reminderDate > now;

    if (selectedFilter === 'Ativos' && !isActive) return false;
    if (selectedFilter === 'Vencidos' && isActive) return false;
    if (selectedDate && formatted !== selectedDate) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando lembretes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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

      {/* Calendário animado */}
      <Animated.View
        style={{
          overflow: 'hidden',
          opacity: calendarHeight,
          height: calendarHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 370],
          }),
        }}>
        <Calendar
          key={theme.background}
          style={styles.calendar}
          theme={{
            backgroundColor: theme.background,
            calendarBackground: theme.background,
            monthTextColor: theme.text,
            dayTextColor: theme.text,
            todayTextColor: theme.green,
            selectedDayBackgroundColor: theme.selected,
            selectedDayTextColor: '#FFF',
            textDisabledColor: theme.gray || '#888',
            arrowColor: theme.text,
            dotColor: theme.green,
            selectedDotColor: '#FFF',
          }}
          enableSwipeMonths
          markedDates={(() => {
            const marked = reminders.reduce((acc, reminder) => {
              const [day, month, year] = reminder.date.split('/').map(Number);
              const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              acc[key] = { marked: true, dotColor: theme.green };
              return acc;
            }, {});
            if (selectedDate) {
              marked[selectedDate] = {
                ...(marked[selectedDate] || {}),
                selected: true,
                selectedColor: theme.selected,
              };
            }
            return marked;
          })()}
          onDayPress={(day) => setSelectedDate(day.dateString)}
        />
      </Animated.View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedFilter(item)} style={{ marginRight: 8 }}>
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
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        {filteredReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-outline" size={64} color={theme.text} />
            <Text style={[styles.emptyStateText, { color: theme.text }]}>
              Nenhum lembrete para este dia
            </Text>
          </View>
        ) : (
          filteredReminders.map((reminder) => (
            <View key={reminder.id} style={[styles.reminderItem, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.text} />
              <View style={styles.reminderDetails}>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>
                  {reminder.title}
                </Text>
                {reminder.description ? (
                  <Text style={[styles.reminderDescription, { color: theme.text }]}>
                    {reminder.description}
                  </Text>
                ) : null}
                <Text style={[styles.reminderDate, { color: theme.text }]}>
                  {reminder.date} às {reminder.time}
                </Text>
              </View>
              <View style={styles.reminderActions}>
                <TouchableOpacity
                  onPress={() => handleEditReminder(reminder)}
                  style={styles.editButton}>
                  <MaterialCommunityIcons name="pencil" size={18} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteReminder(reminder)}
                  style={styles.deleteButton}>
                  <MaterialCommunityIcons name="delete" size={18} color={theme.red} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botão flutuante */}
      <TouchableOpacity
        onPress={handleAddReminder}
        style={[styles.floatingButton, { backgroundColor: theme.selected }]}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>

            <TextInput
              placeholder="Título"
              placeholderTextColor={theme.gray}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />
            <TextInput
              placeholder="Descrição (opcional)"
              placeholderTextColor={theme.gray}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={reminderDescription}
              onChangeText={setReminderDescription}
            />
            <TextInput
              placeholder="Data (DD/MM/AAAA)"
              placeholderTextColor={theme.gray}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={reminderDate}
              onChangeText={setReminderDate}
            />
            <TextInput
              placeholder="Hora (HH:MM)"
              placeholderTextColor={theme.gray}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={reminderTime}
              onChangeText={setReminderTime}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalButton, { color: theme.red }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveReminder}>
                <Text style={[styles.modalButton, { color: theme.green }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RemindersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  calendar: { backgroundColor: 'transparent', marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  reminderDetails: { flex: 1, marginLeft: 15 },
  reminderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  reminderDescription: { fontSize: 14, marginBottom: 3 },
  reminderDate: { fontSize: 12 },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
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
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContainer: { width: '100%', borderRadius: 15, padding: 20, elevation: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { fontSize: 16, fontWeight: 'bold' },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
});
