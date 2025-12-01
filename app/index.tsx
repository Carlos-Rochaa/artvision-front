import { View, Text, StyleSheet, Button } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎨 ArtVision</Text>
      <Text style={styles.subtitle}>
        Bem-vindo! Aqui você pode analisar obras de arte usando IA.
      </Text>

      <Link href="/recognize" asChild>
        <Button title="Ir para análise de imagem" onPress={() => {}} />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
});
