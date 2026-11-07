import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.brandHeader}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>Arad Pulse</Text>
        <Text style={styles.tagline}>
          Conectăm comunitatea cu producătorii locali
        </Text>
      </View>

      <View style={styles.actionCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F8FAFC",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#E2E8F0",
    backgroundColor: "#0B132B",
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  actionCard: {
    width: "100%",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F172A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#64748B",
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#DC2626",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "500",
  },
});