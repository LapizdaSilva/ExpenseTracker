import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { PropTypes} from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';


const SettingsScreen = ({navigation}) => {
  const { theme, toggleTheme, darkMode } = useTheme();

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Configurações</Text>
        
        <View style={styles.themeOptionContainer}>
          <TouchableOpacity
            style={[styles.themeOptionButton, { backgroundColor: theme.card }]}
            onPress={() => {
              if (darkMode) toggleTheme();
            }}
          >
            <View style={styles.wrap}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={20}
                color={!darkMode ? "#facc15" : theme.text} 
              />
              <Text style={[styles.themeOptionButtonText, { color: theme.text }]}>
                Tema Claro
              </Text>
            </View>
            <MaterialCommunityIcons
              name={!darkMode ? "check-circle" : "checkbox-blank-circle-outline"}
              size={20}
              color={!darkMode ? "#22c55e" : theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOptionButton, { backgroundColor: theme.card }]}
            onPress={() => {
              if (!darkMode) toggleTheme(); 
            }}
          >
            <View style={styles.wrap}>
              <MaterialCommunityIcons
                name="star-crescent"
                size={20}
                color={darkMode ? "#8b5cf6" : theme.text}
              />
              <Text style={[styles.themeOptionButtonText, { color: theme.text }]}>
                Tema Escuro
              </Text>
            </View>
            <MaterialCommunityIcons
              name={darkMode ? "check-circle" : "checkbox-blank-circle-outline"}
              size={20}
              color={darkMode ? "#22c55e" : theme.text} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={24} color={theme.text} />
          <Text style={[styles.logoutButtonText, { color: theme.text }]}>Sair</Text>
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
    alignItems: 'center',
  },
  themeOptionContainer: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  themeOptionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  themeOptionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    marginLeft: 5,
    fontSize: 18,
    alignItems: 'center',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});

export default SettingsScreen;