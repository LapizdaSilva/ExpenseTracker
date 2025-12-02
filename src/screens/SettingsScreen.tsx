import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { Appbar, List, Switch, Divider, ActivityIndicator, Button } from "react-native-paper";
import { useTheme } from "../operacoes/ThemeContext";
import { supabase } from "../../supabase";

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme, darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              Alert.alert("Sucesso", "Você foi desconectado com sucesso!");
            } catch (error) {
              console.error("Erro ao fazer logout:", error);
              Alert.alert("Erro", "Não foi possível sair da conta.");
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Sobre o Credo",
      "Credo v3.0.0\n\nUm aplicativo para controle financeiro pessoal.\n\n© 2025 Lumina Team",
      [{ text: "OK" }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      "Suporte",
      "Para suporte técnico, entre em contato:\n\nEmail: suporte@credo.com\nTelefone: (11) 9999-9999",
      [{ text: "OK" }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Política de Privacidade",
      "Sua privacidade é importante para nós. Todos os dados são criptografados e protegidos conforme a LGPD.",
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.card }}>
        <Appbar.BackAction color={theme.text} onPress={() => navigation.goBack()} />
        <Appbar.Content title="Configurações" titleStyle={[styles.headerTitle, { color: theme.text }]} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Notificações */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notificações</Text>
          <List.Item
            title="Notificações Push"
            description="Receber notificações importantes"
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.text }}
            left={(props) => <List.Icon {...props} color={theme.text} icon="bell-outline" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={theme.text}
              />
            )}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.text }]} />

        {/* Aparência */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Aparência</Text>
          <List.Item
            title="Modo Escuro"
            description="Ativar tema escuro"
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.text }}
            left={(props) => <List.Icon {...props} color={theme.text} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                color={theme.text}
              />
            )}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.text }]} />

        {/* Conta */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
            {/*
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Conta</Text>
                <List.Item
                    title="Meu Perfil"
                    description="Editar informações pessoais"
                    titleStyle={{ color: theme.text }}
                    descriptionStyle={{ color: theme.text }}
                    left={(props) => <List.Icon {...props} color={theme.text} icon="account-outline" />}
                    right={(props) => <List.Icon {...props} color={theme.text} icon="chevron-right" />}
                    onPress={() => navigation.navigate("Profile")}
                />
            */}
          <List.Item
            title="Privacidade"
            description="Política de privacidade e dados"
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.text }}
            left={(props) => <List.Icon {...props} color={theme.text} icon="shield-outline" />}
            right={(props) => <List.Icon {...props} color={theme.text} icon="chevron-right" />}
            onPress={handlePrivacy}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.text }]} />

        {/* Suporte */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Suporte</Text>
          <List.Item
            title="Central de Ajuda"
            description="Obter suporte técnico"
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.text }}
            left={(props) => <List.Icon {...props} color={theme.text} icon="help-circle-outline" />}
            right={(props) => <List.Icon {...props} color={theme.text} icon="chevron-right" />}
            onPress={handleSupport}
          />
          <List.Item
            title="Sobre o Credo"
            description="Informações sobre o aplicativo"
            titleStyle={{ color: theme.text }}
            descriptionStyle={{ color: theme.text }}
            left={(props) => <List.Icon {...props} color={theme.text} icon="information-outline" />}
            right={(props) => <List.Icon {...props} color={theme.text} icon="chevron-right" />}
            onPress={handleAbout}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.text }]} />

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: theme.text }]}
            labelStyle={[styles.logoutButtonText, { color: theme.text }]}
            icon="logout"
          >
            Sair da Conta
          </Button>
        </View>

        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: theme.text }]}>Versão 3.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 0.5,
    opacity: 0.4,
  },
  logoutSection: {
    padding: 20,
    alignItems: "center",
  },
  logoutButton: {
    width: "100%",
  },
  logoutButtonText: {
    fontSize: 16,
  },
  versionSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
});
