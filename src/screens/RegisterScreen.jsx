import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from 'react-native';
import { supabase } from '../../supabase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const rotation1 = useRef(new Animated.Value(0)).current;
  const rotation2 = useRef(new Animated.Value(0)).current;

  const toggleSecurePassword = () => {
    Animated.timing(rotation1, {
      toValue: securePassword ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setSecurePassword(!securePassword);
  };

  const toggleSecureConfirm = () => {
    Animated.timing(rotation2, {
      toValue: secureConfirm ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setSecureConfirm(!secureConfirm);
  };

  const spin1 = rotation1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const spin2 = rotation2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });


  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) throw error;
      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      console.error('Erro no registro:', error);
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.message) {
        case 'User already registered':
          errorMessage = 'Este email já está em uso';
          break;
        case 'AuthApiError: Invalid email address': 
          errorMessage = 'Email inválido';
          break;
        case 'Password should be at least 6 characters': 
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
          break;
        default:
          errorMessage = 'Erro ao criar conta. Tente novamente';
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Crie sua Conta</Text>
      <KeyboardAvoidingView behavior="padding" style={styles.inputContainer}>
        {/* Email */}
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.text }]}
          placeholder="Digite seu email"
          placeholderTextColor={theme.text}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {/* Senha */}
        <View
          style={[
            styles.passwordContainer,
            { backgroundColor: theme.card, borderColor: theme.text },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: theme.text }]}
            placeholder="Digite sua senha"
            placeholderTextColor={theme.text}
            secureTextEntry={securePassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={toggleSecurePassword} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ rotate: spin1 }] }}>
              <MaterialCommunityIcons
                name={securePassword ? 'eye-off' : 'eye'}
                size={22}
                color={theme.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Confirmar Senha */}
        <View
          style={[
            styles.passwordContainer,
            { backgroundColor: theme.card, borderColor: theme.text },
          ]}
        >
          <TextInput
            style={[styles.passwordInput, { color: theme.text }]}
            placeholder="Confirme sua senha"
            placeholderTextColor={theme.text}
            secureTextEntry={secureConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={toggleSecureConfirm} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ rotate: spin2 }] }}>
              <MaterialCommunityIcons
                name={secureConfirm ? 'eye-off' : 'eye'}
                size={22}
                color={theme.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        {/* Botão de registro */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando conta...' : 'Registrar-se'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
          <Text style={[styles.link, { color: theme.text }]}>Já tem uma conta? Entre</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

RegisterScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6A0DAD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9A9A9A',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    fontSize: 16,
    alignSelf: 'center',
  },
  passwordContainer: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
});

export default RegisterScreen;