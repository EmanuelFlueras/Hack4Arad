import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>HACK 4 ARAD</Text>
      <Text style={styles.title}>Descoperă Aradul și Producătorii Locali</Text>
      <Text style={styles.subtitle}>
        Află ce evenimente au loc în weekend și unde găsești standurile producătorilor arădeni.
      </Text>

      {/* Butonul care duce la MainTabs fără cont */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace("/eventsscreen")}
      >
        <Text style={styles.primaryButtonText}>Intră ca Vizitator</Text>
      </TouchableOpacity>

      {/* Buton opțional pentru autentificare */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push("/modal")}
      >
        <Text style={styles.secondaryButtonText}>Sunt Producător / Organizator</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  badge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 36,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "500",
  },
});