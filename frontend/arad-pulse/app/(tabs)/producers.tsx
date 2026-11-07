import { View, Text, StyleSheet } from 'react-native';

export default function ProducersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalog Producători</Text>
      <Text style={styles.subtitle}>Producători locali, crame și meșteșugari din județul Arad.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});