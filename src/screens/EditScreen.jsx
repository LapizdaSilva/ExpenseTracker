import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../../supabase';
import PropTypes from 'prop-types';
import DropdownComponent from '../operacoes/dropdown';
import { useTheme } from '../operacoes/ThemeContext';

const localISOTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();

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
  const { theme } = useTheme();
  const { operations } = route.params;

  const initialType =
    operations.type?.toLowerCase?.() === 'entradas' ? 'entradas' : 'saidas';

  const [operationType, setOperationType] = useState(initialType);
  const [category, setCategory] = useState(operations.category || '');
  const [description, setDescription] = useState(operations.description || '');
  const [total, setTotal] = useState(operations?.total?.toString?.() || '');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value) => value.replace(/[^0-9.,]/g, '');

  const handleSave = async () => {
    if (!category || !total || isNaN(parseFloat(total.replace(',', '.')))) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios corretamente.');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        setLoading(false);
        return;
      }

      const uid = user.id;
      const localISOTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();

      const { error } = await supabase
        .from('operations')
        .update({
          type: operationType,
          category,
          description,
          total: parseFloat(total.replace(',', '.')),
          updated_at: localISOTime,
        })
        .eq('id', operations.id) 
        .eq('user_id', uid);

      if (error) throw error;

      Alert.alert('Sucesso', 'Operação atualizada com sucesso!');
      navigation.goBack(); 
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
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>Editar Operação</Text>

      {/* Botões para alternar o tipo */}
      <View style={[styles.toggleContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            operationType === 'saidas' && { backgroundColor: theme.red },
            operationType !== 'saidas' && {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.text,
            },
          ]}
          onPress={() => setOperationType('saidas')}
          disabled={loading}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: theme.text },
              operationType === 'saidas' && { color: '#FFF' },
            ]}
          >
            Saídas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            operationType === 'entradas' && { backgroundColor: theme.green },
            operationType !== 'entradas' && {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.text,
            },
          ]}
          onPress={() => setOperationType('entradas')}
          disabled={loading}
        >
          <Text
            style={[
              styles.toggleButtonText,
              { color: theme.text },
              operationType === 'entradas' && { color: '#FFF' },
            ]}
          >
            Entradas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown de categoria dinâmico */}
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
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: theme.text,
          },
        ]}
        placeholder="Descrição (Opcional)"
        placeholderTextColor={theme.text}
        value={description}
        onChangeText={setDescription}
        editable={!loading}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: theme.text,
          },
        ]}
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
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.saveButton,
            loading && styles.buttonDisabled,
          ]}
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
        opid: PropTypes.string.isRequired,
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
  scrollContent: {
    paddingBottom: 50,
  },
});