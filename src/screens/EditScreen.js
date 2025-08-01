import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
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

export default function EditScreen({ route, navigation }) {
  const { operations } = route.params;

  const [category, setCategory] = useState(operations.category || '');
  const [description, setDescription] = useState(operations.description || '');
  const [total, setTotal] = useState(operations?.total?.toString?.() || '');
  const [loading, setLoading] = useState(false);
  const [operationType, ] = useState(operations.type || 'Saídas');

  const formatCurrency = (value) => value.replace(/[^0-9.,]/g, '');

  const handleSave = async () => {
    if (!category || !total || isNaN(parseFloat(total.replace(',', '.')))) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      setLoading(true);
      const ref = doc(db, 'operations', operations.opId);
      await updateDoc(ref, {
        category,
        description,
        total: parseFloat(total.replace(',', '.')),
      });

      Alert.alert('Sucesso', 'Operação atualizada com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Erro ao atualizar operação:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a operação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{'Editar Operação'}</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, operationType === 'Saídas' && styles.toggleButtonActive]}
          disabled
        >
          <Text style={[styles.toggleButtonText, operationType === 'Saídas' && styles.toggleButtonTextActive]}>
            Saídas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, operationType === 'Entradas' && styles.toggleButtonActive]}
          disabled
        >
          <Text style={[styles.toggleButtonText, operationType === 'Entradas' && styles.toggleButtonTextActive]}>
            Entradas
          </Text>
        </TouchableOpacity>
      </View>

      <DropdownComponent
        placeholder="Categoria"
        data={operationType === 'Saídas' ? categoriaDesp : categoriaRec}
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
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

EditScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      operations: PropTypes.shape({
        opId: PropTypes.string.isRequired,
        category: PropTypes.string,
        description: PropTypes.string,
        total: PropTypes.number.isRequired,
        type: PropTypes.string,
      }).isRequired,
    }).isRequired,
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
  scrollContent: {
  paddingBottom: 50,
  },
});
