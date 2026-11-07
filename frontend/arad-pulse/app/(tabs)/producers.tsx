import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Producer, producerService } from '../../services/producerService';

export default function ProducersScreen() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const data = await producerService.getAll();
      setProducers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nu s-au putut încărca producătorii.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProducers();
  }, []);

  const categories = [
    'Toate',
    ...Array.from(
      new Set(
        producers
          .map((producer) => producer.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ).filter((category) => category.toLowerCase() !== 'toate'),
  ];

  const filteredProducers =
    selectedCategory === 'Toate' || selectedCategory === 'ALL'
      ? producers
      : producers.filter(
          (producer) =>
            producer.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase(),
        );

  const contactProducer = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert('Apel indisponibil', 'Nu s-a putut deschide aplicația de telefon.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C82333" />
        <Text style={styles.statusText}>Se încarcă producătorii locali...</Text>
      </View>
    );
  }

  if (error && producers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Conexiune eșuată la server</Text>
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadProducers()}>
          <Text style={styles.retryButtonText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadProducers(true)}
          tintColor="#C82333"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Catalog Producători</Text>
        <Text style={styles.subtitle}>Descoperă producători locali din județul Arad.</Text>
      </View>

      {error && (
        <View style={styles.refreshError}>
          <Text style={styles.refreshErrorText}>Actualizarea a eșuat: {error}</Text>
          <TouchableOpacity onPress={() => void loadProducers(true)}>
            <Text style={styles.refreshRetryText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.filterChip, isActive && styles.activeChip]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.producersList}>
        <Text style={styles.countText}>
          {filteredProducers.length}{' '}
          {filteredProducers.length === 1 ? 'producător găsit' : 'producători găsiți'}
        </Text>

        {filteredProducers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nu există producători</Text>
            <Text style={styles.emptySubtitle}>
              {producers.length === 0
                ? 'Nu sunt producători disponibili momentan.'
                : 'Nu am găsit producători în categoria selectată.'}
            </Text>
          </View>
        ) : (
          filteredProducers.map((producer) => (
            <View key={producer.id} style={styles.producerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrap}>
                  <Text style={styles.producerName}>{producer.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {producer.category?.trim() || 'Producător Local'}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{producer.averageRating.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.locationText}>{producer.location}</Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Sună ${producer.name}`}
                style={styles.contactButton}
                onPress={() => void contactProducer(producer.phone)}
              >
                <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Contactează</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
  refreshError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  refreshErrorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  refreshRetryText: {
    color: '#C82333',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#C82333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterRow: {
    flexGrow: 0,
    marginHorizontal: -16,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#C82333',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  producersList: {
    marginTop: 20,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  producerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  producerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 7,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C82333',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C82333',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 14,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});