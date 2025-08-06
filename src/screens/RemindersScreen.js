import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, setDoc} from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';

const RemindersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.navigate('Login');
      return;
    }

    const userId = auth.currentUser.uid;

    const q = query(
      collection(db, 'reminders', userId, 'lembretes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const remindersData = [];
      querySnapshot.forEach((doc) => {
        remindersData.push({ id: doc.id, ...doc.data() });
      });
      setReminders(remindersData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar lembretes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigation]);

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
    const user = auth.currentUser;
    if (!user) return;

    if (!reminderTitle.trim() || !reminderDate.trim() || !reminderTime.trim()) {
      Alert.alert('Erro', 'Por favor, preencha pelo menos o título, data e horário do lembrete');
      return;
    }

    const reminderData = {
      title: reminderTitle.trim(),
      description: reminderDescription.trim(),
      date: reminderDate.trim(),
      time: reminderTime.trim(),
    };

    try {
      await setDoc(doc(db, 'reminders', user.uid), {
        email: user.email
      }, { merge: true });

      const reminderRef = collection(db, 'reminders', user.uid, 'lembretes');

      if (editingReminder) {
        const docRef = doc(db, 'reminders', user.uid, 'lembretes', editingReminder.id);
        await updateDoc(docRef, {
          ...reminderData,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Sucesso', 'Lembrete atualizado com sucesso!');
      } else {
        await addDoc(reminderRef, {
          ...reminderData,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Sucesso', 'Lembrete adicionado com sucesso!');
      }

      setModalVisible(false);
      setReminderTitle('');
      setReminderDescription('');
      setReminderDate('');
      setReminderTime('');
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      Alert.alert('Erro', 'Erro ao salvar lembrete. Tente novamente.');
    }
  };


  const handleDeleteReminder = (reminder) => {
    const userId = auth.currentUser.uid;

    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o lembrete "${reminder.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'reminders', userId, 'lembretes', reminder.id);
              await deleteDoc(docRef);
              Alert.alert('Sucesso', 'Lembrete excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir lembrete:', error);
              Alert.alert('Erro', 'Erro ao excluir lembrete. Tente novamente.');
            }
          }
        }
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
          <Text style={[styles.emptyStateText, { color: theme.text }]}>Nenhum lembrete cadastrado</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.text }]}>Adicione seu primeiro lembrete!</Text>
        </View>
      ) : (
        reminders.map((reminder) => (
          <View key={reminder.id} style={[styles.reminderItem, { backgroundColor: theme.card }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={theme.text} />
            <View style={styles.reminderDetails}>
              <Text style={[styles.reminderTitle, { color: theme.text }]}>{reminder.title}</Text>
              {reminder.description && (
                <Text style={[styles.reminderDescription, { color: theme.text }]}>{reminder.description}</Text>
              )}
              <Text style={[styles.reminderDate, { color: theme.text }]}>{reminder.date}</Text>
            </View>
            <View style={styles.reminderActions}>
              <Text style={[styles.reminderTime, { color: theme.text }]}>{reminder.time}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEditReminder(reminder)} style={styles.editButton}>
                  <MaterialCommunityIcons name="pencil" size={16} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteReminder(reminder)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="delete" size={16} color={theme.red} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.text }]}
              placeholder="Título do lembrete *"
              placeholderTextColor={theme.text}
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.text }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={theme.text}
              value={reminderDescription}
              onChangeText={setReminderDescription}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.text }]}
              placeholder="Data (DD/MM/AAAA) *"
              placeholderTextColor={theme.text}
              value={reminderDate}
              onChangeText={setReminderDate}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.text }]}
              placeholder="Horário (HH:MM) *"
              placeholderTextColor={theme.text}
              value={reminderTime}
              onChangeText={setReminderTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReminder}
              >
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
  container: {
    flex: 1,
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
  },
  addButton: {
    padding: 10,
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
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderDetails: {
    flex: 1,
    marginLeft: 15,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  reminderDescription: {
    fontSize: 14,
    marginBottom: 3,
  },
  reminderDate: {
    fontSize: 12,
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  deleteButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#CCC',
  },
  saveButton: {
    backgroundColor: '#6A0DAD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RemindersScreen;