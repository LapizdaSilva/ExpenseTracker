import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { collection, setDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';
import DropdownComponent from '../operacoes/dropdown';  
import { useTheme } from '../operacoes/ThemeContext';

const categoriaDesp = [
  { label: 'Alimentação', value: 'Alimentação' },
  { label: 'Transporte', value: 'Transporte' },
  { label: 'Saúde', value: 'Saúde' },
  { label: 'Lazer', value: 'Lazer' },
  { label: 'Entretenimento', value: 'Entretenimento' },
  { label: 'Supermercado', value: 'Supermercado' },
  { label: 'Assinaturas', value: 'Assinaturas' }, 
  { label: 'Outros', value: 'Outros' },
];

const categoriaRec = [
  { label: 'Salário', value: 'Salário' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Investimentos', value: 'Investimentos' },
  { label: 'Venda de Produtos', value: 'Venda de Produtos' },
  { label: 'Outros', value: 'Outros' },
];

const AddOperationScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [operationType, setOperationType] = useState('saidas');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [opId, setOpId] = useState('');

  React.useEffect(() => {
    const generateId = () => {
      return Math.random().toString(12).substr(2, 9)
    };
    setOpId(generateId());
  }, []);

  const handleSaveOperation = async () => {
    if (!date || !total || !category) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios: Data, Categoria e Total');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    const totalValue = parseFloat(total.replace(',', '.'));
    if (isNaN(totalValue)) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para o total');
      return;
    }

    setLoading(true);
    try {
      const operationData = {
        type: operationType,
        date: date,
        category: category,
        description: description || '',
        total: totalValue,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        opid: opId,
      };

      const userId = auth.currentUser.uid;
      const tipo = operationType.toLowerCase();

      await setDoc(doc(db, 'operations', userId), {
        email: auth.currentUser.email
      }, { merge: true });

      await addDoc(collection(db, 'operations', userId, tipo), {
        ...operationData
      });

      Alert.alert('Sucesso', 'Operação salva com sucesso!', [
        { text: 'OK', onPress: () => {
          setDate('');
          setCategory('');
          setDescription('');
          setTotal('');
          navigation.navigate('Home');
        }}
      ]);
    } catch (error) {
      console.error('Erro ao salvar operação:', error);
      Alert.alert('Erro', 'Erro ao salvar operação. Tente novamente.');
    } finally { 
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.navigate('Home');
  };

  const formatCurrency = (value) => {
    const numericValue = value.replace(/[^0-9.,]/g, '');
    return numericValue;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{'Adicionar Nova Operação'}</Text>

      <View style={[styles.toggleContainer, { backgroundColor: theme.card }]}>

        <TouchableOpacity
          style={[
            styles.toggleButton, 
            operationType === 'saidas' && { backgroundColor: theme.red },
            operationType !== 'saidas' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.text }
          ]}
          onPress={() => setOperationType('saidas')}
          disabled={loading}
        >
          <Text style={[
            styles.toggleButtonText, 
            { color: theme.text },
            operationType === 'saidas' && { color: '#FFF' }
          ]}>Saídas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton, 
            operationType === 'Entradas' && { backgroundColor: theme.green },
            operationType !== 'Entradas' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.text }
          ]}
          onPress={() => setOperationType('Entradas')}
          disabled={loading}
        >
          <Text style={[
            styles.toggleButtonText, 
            { color: theme.text },
            operationType === 'Entradas' && { color: '#FFF' }
          ]}>Entradas</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text }]}
        placeholder="data (DD/MM/YYYY)"
        placeholderTextColor={theme.text}
        value={date}
        onChangeText={setDate}
        editable={!loading}
      />
      <DropdownComponent
        placeholder="Categoria"
        placeholderTextColor={theme.text}
        data={operationType === 'saidas' ? categoriaDesp : categoriaRec}
        value={category}
        onChange={setCategory}
        editable={!loading}
        theme={theme}
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text }]}
        placeholder="Descrição (Opcional)"
        placeholderTextColor={theme.text}
        value={description} 
        onChangeText={setDescription}
        editable={!loading}
      />
      <TextInput 
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text }]} 
        placeholder="Total *" 
        placeholderTextColor={theme.text}
        keyboardType="numeric"
        value={total}
        onChangeText={(value) => setTotal(formatCurrency(value))}
        editable={!loading}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]} 
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{'Cancelar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton, loading && styles.buttonDisabled]} 
          onPress={handleSaveOperation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

AddOperationScreen.propTypes = {
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonText: {
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  actionButton: {
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
  buttonDisabled: {
    backgroundColor: '#9A9A9A',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrow:{
    position: 'absolute',
    right: 15,
    top: 15,
    color: '#333',
  },
  category: {
    width: '100%',
    marginBottom: 15,
    marginTop: 15,
    opacity: 0.5,
    bordercolor: 'grey',
  }
});

export default AddOperationScreen;