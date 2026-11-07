import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setări & Cont</Text>
      <Text style={styles.subtitle}>Ești vizitator (fără cont).</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/modal' as any)}
      >
        <Text style={styles.buttonText}>Conectare Producător / Oficialitate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});