import React, { useState, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';
import PropTypes from 'prop-types';
import { useTheme } from '../operacoes/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleSecure = () => {
    Animated.timing(rotation, {
      toValue: secure ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setSecure(!secure);
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      const user = data.user;
      await AsyncStorage.setItem('userEmail', user.email);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login';

      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = 'Usuário não encontrado ou senha incorreta';
          break;
        case 'AuthApiError: Invalid email address':
          errorMessage = 'Email inválido';
          break;
        case 'AuthApiError: Too many login attempts':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'Email not confirmed':
          errorMessage =
            'Email não confirmado. Por favor, verifique sua caixa de entrada.';
          break;
        default:
          errorMessage = 'Erro ao fazer login. Verifique suas credenciais';
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MaterialCommunityIcons name="scale-balance" size={180} color={'#6A0DAD'} />
      <Text style={[styles.title, { color: theme.text }]}>Bem Vindo de Volta!</Text>
      <KeyboardAvoidingView behavior="padding" style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.text },
          ]}
          placeholder="Digite seu email"
          placeholderTextColor={theme.text}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

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
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCapitalize="none"
            textContentType="password"
            importantForAutofill="no"
          />
          <TouchableOpacity onPress={toggleSecure} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons
                name={secure ? 'eye-off' : 'eye'}
                size={22}
                color={theme.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Conectando...' : 'Conecte-se'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
          <Text style={[styles.link, { color: theme.text }]}>
            Ainda não tem uma conta? Registre-se
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

LoginScreen.propTypes = {
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
    justifyContent: 'center',
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
    fontSize: 16,
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
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
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
    alignSelf: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default LoginScreen;
