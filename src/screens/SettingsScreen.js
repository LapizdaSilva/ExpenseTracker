import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import PropTypes from 'prop-types';

const SettingsScreen = ({navigation}) => {
  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.navigate('Login');
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Erro ao sair da conta');
            }
          }
        }
      ]
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <Text>Conteúdo da tela de configurações</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <MaterialCommunityIcons name="logout" size={24} color="#6A0DAD" />
      </TouchableOpacity>
    </View>
  );
};

SettingsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({

  addButton: {
    padding: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  secret: {

  }
});

export default SettingsScreen;
