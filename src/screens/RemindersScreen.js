import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types'

const RemindersScreen = ({ navigation }) => {
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

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', auth.currentUser.uid),
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
    if (!reminderTitle.trim() || !reminderDate.trim() || !reminderTime.trim()) {
      Alert.alert('Erro', 'Por favor, preencha pelo menos o título, data e horário do lembrete');
      return;
    }

    try {
      const reminderData = {
        title: reminderTitle.trim(),
        description: reminderDescription.trim(),
        date: reminderDate.trim(),
        time: reminderTime.trim(),
        userId: auth.currentUser.uid,
      };

      if (editingReminder) {
        await updateDoc(doc(db, 'reminders', editingReminder.id), {
          ...reminderData,
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Sucesso', 'Lembrete atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'reminders'), {
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
              await deleteDoc(doc(db, 'reminders', reminder.id));
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
      <View style={[styles.container, styles.centered]}>
        <Text>Carregando lembretes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lembretes</Text>
        <TouchableOpacity onPress={handleAddReminder} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#6A0DAD" />
        </TouchableOpacity>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>Nenhum lembrete cadastrado</Text>
          <Text style={styles.emptyStateSubtext}>Adicione seu primeiro lembrete!</Text>
        </View>
      ) : (
        reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderItem}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#6A0DAD" />
            <View style={styles.reminderDetails}>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              {reminder.description && (
                <Text style={styles.reminderDescription}>{reminder.description}</Text>
              )}
              <Text style={styles.reminderDate}>{reminder.date}</Text>
            </View>
            <View style={styles.reminderActions}>
              <Text style={styles.reminderTime}>{reminder.time}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleEditReminder(reminder)} style={styles.editButton}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#6A0DAD" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteReminder(reminder)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="delete" size={16} color="#F44336" />
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Título do lembrete *"
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Descrição (opcional)"
              value={reminderDescription}
              onChangeText={setReminderDescription}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Data (DD/MM/AAAA) *"
              value={reminderDate}
              onChangeText={setReminderDate}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Horário (HH:MM) *"
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
    backgroundColor: '#F5F5F5',
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
    color: '#333',
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
    color: '#CCC',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    color: '#333',
    marginBottom: 3,
  },
  reminderDescription: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 3,
  },
  reminderDate: {
    fontSize: 12,
    color: '#6A0DAD',
  },
  reminderActions: {
    alignItems: 'flex-end',
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#FFF',
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
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'Black',
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


