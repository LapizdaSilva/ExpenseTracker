import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

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

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDescription('');
    setReminderDate('');
    setReminderTime('');
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

      setModalVisible(false);
      fetchReminders();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderTitle,
          body: reminderDescription || 'Você tem um lembrete!',
        },
        trigger: { seconds: 3 },
      });

    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      Alert.alert('Erro', 'Não foi possível salvar o lembrete.');
    }
  };

  const handleDeleteReminder = (reminder) => {
    Alert.alert(
      'Confirmar exclusão',
      `Excluir o lembrete "${reminder.title}"?`,
      [
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

              Alert.alert('Sucesso', 'Lembrete excluído!');
              fetchReminders();
            } catch (error) {
              console.error('Erro ao excluir lembrete:', error);
              Alert.alert('Erro', 'Não foi possível excluir o lembrete.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Carregando lembretes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Lembretes</Text>
        <TouchableOpacity onPress={handleAddReminder} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-outline" size={64} color={theme.text} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>Nenhum lembrete</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>Adicione seu primeiro!</Text>
        </View>
      ) : (
        reminders.map((reminder) => (
          <View key={reminder.id} style={[styles.reminderItem, { backgroundColor: theme.card }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={theme.text} />
            <View style={styles.reminderDetails}>
              <Text style={[styles.reminderTitle, { color: theme.text }]}>{reminder.title}</Text>
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
              <TouchableOpacity onPress={() => handleEditReminder(reminder)} style={styles.editButton}>
                <MaterialCommunityIcons name="pencil" size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReminder(reminder)} style={styles.deleteButton}>
                <MaterialCommunityIcons name="delete" size={18} color={theme.red} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Modal de criação/edição */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholder="Título *"
              placeholderTextColor={theme.text}
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={theme.text}
              value={reminderDescription}
              onChangeText={setReminderDescription}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholder="Data (DD/MM/AAAA) *"
              placeholderTextColor={theme.text}
              value={reminderDate}
              onChangeText={setReminderDate}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholder="Horário (HH:MM) *"
              placeholderTextColor={theme.text}
              value={reminderTime}
              onChangeText={setReminderTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveReminder} style={[styles.modalButton, styles.saveButton]}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

RemindersScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { padding: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptyStateSubtext: { fontSize: 14, marginTop: 5 },
  reminderItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  reminderDetails: { flex: 1, marginLeft: 15 },
  reminderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  reminderDescription: { fontSize: 14, marginBottom: 3 },
  reminderDate: { fontSize: 12 },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
  editButton: { padding: 5, marginRight: 5 },
  deleteButton: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 10, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  modalButton: { flex: 1, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#CCC' },
  saveButton: { backgroundColor: '#6A0DAD' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default RemindersScreen;
