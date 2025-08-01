import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import PropTypes from 'prop-types';
import DropdownComponent from '../operacoes/dropdown';  

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
  const [operationType, setOperationType] = useState('Saídas');
  const [date, setDate] = useState(new Date());
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

      await addDoc(collection(db, 'operations'), operationData);

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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{'Adicionar Nova Operação'}</Text>

      <View style={styles.toggleContainer}>

        <TouchableOpacity
          style={[styles.toggleButton, operationType === 'Saídas' && styles.toggleButtonActive]}
          onPress={() => setOperationType('Saídas')}
          disabled={loading}
        >
          <Text style={[styles.toggleButtonText, operationType === 'Saídas' && styles.toggleButtonTextActive]}>Saídas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, operationType === 'Entradas' && styles.toggleButtonActive]}
          onPress={() => setOperationType('Entradas')}
          disabled={loading}
        >
          <Text style={[styles.toggleButtonText, operationType === 'Entradas' && styles.toggleButtonTextActive]}>Entradas</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="data (DD/MM/YYYY)"
        value={date}                             // AQUI DATA
        onChangeText={setDate}
        editable={!loading}
      />
      <DropdownComponent
        placeholder="Categoria"
        data={operationType === 'Saídas' ? categoriaDesp : categoriaRec}   // AQUI CATEGORIA
        value={category}
        onChange={setCategory}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Descrição (Opcional)" 
        value={description} 
        onChangeText={setDescription}
        editable={!loading}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Total *" 
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
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#DDD',
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#6A0DAD',
  },
  toggleButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: '#FFF',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'grey',
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