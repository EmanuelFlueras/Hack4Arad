import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { apiRequest } from '../../services/api';

interface Producer {
  id: string;
  name: string;
  phone: string;
  location: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const categories = [
  'Toate',
  'Panificație',
  'Vinificație',
  'Legume & Fructe',
  'Tradițional',
  'Apicultură',
];

const triggerImpact = async (style: Haptics.ImpactFeedbackStyle) => {
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    console.warn('Haptic feedback is unavailable:', error);
  }
};

export default function ProducersScreen() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      setProducers(await apiRequest<Producer[]>('/producers'));
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nu s-au putut încărca producătorii.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProducers();
  }, []);

  const normalizedSearch = normalizeText(searchQuery);
  const filteredProducers = producers.filter((producer) => {
    const category = normalizeText(producer.category ?? '');
    const matchesCategory =
      selectedCategory === 'Toate' ||
      (selectedCategory === 'Legume & Fructe'
        ? category.includes('legume') ||
          category.includes('legumicultura') ||
          category.includes('fructe')
        : category.includes(normalizeText(selectedCategory)));
    const matchesSearch =
      !normalizedSearch ||
      [producer.name, producer.location, producer.category ?? ''].some((value) =>
        normalizeText(value).includes(normalizedSearch),
      );

    return matchesCategory && matchesSearch;
  });

  const callProducer = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert('Apel indisponibil', 'Nu s-a putut deschide aplicația de telefon.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.statusText}>Se încarcă producătorii locali...</Text>
      </View>
    );
  }

  if (error && producers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={46} color="#B91C1C" />
        <Text style={styles.errorTitle}>Nu s-au putut încărca producătorii</Text>
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadProducers()}>
          <Text style={styles.retryButtonText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadProducers(true)}
          tintColor="#059669"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HACK 4 ARAD</Text>
        <Text style={styles.title}>Producători locali</Text>
        <Text style={styles.subtitle}>Descoperă afacerile și gusturile județului Arad.</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Actualizarea a eșuat: {error}</Text>
          <TouchableOpacity onPress={() => void loadProducers(true)}>
            <Text style={styles.retryText}>Reîncearcă</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color="#64748B" />
        <TextInput
          accessibilityLabel="Caută producători"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Caută producător sau localitate"
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Șterge căutarea"
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={19} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.filterChip, isActive && styles.activeFilterChip]}
              onPress={() => {
                void triggerImpact(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(category);
              }}
            >
              <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listHeader}>
        <Text style={styles.resultsCount}>
          {filteredProducers.length} {filteredProducers.length === 1 ? 'producător' : 'producători'}
        </Text>
      </View>

      {filteredProducers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="storefront-outline" size={25} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>Niciun producător găsit în această categorie</Text>
          <Text style={styles.emptyText}>Încearcă altă categorie sau modifică termenul căutat.</Text>
        </View>
      ) : (
        filteredProducers.map((producer) => (
          <TouchableOpacity
            key={producer.id}
            style={styles.producerCard}
            activeOpacity={1}
            onPress={() =>
              void triggerImpact(Haptics.ImpactFeedbackStyle.Medium)
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.producerTitleRow}>
                <Text style={styles.producerName}>{producer.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
              </View>
              <View style={styles.traditionalBadge}>
                <Ionicons name="ribbon-outline" size={13} color="#065F46" />
                <Text style={styles.traditionalBadgeText}>
                  Atestat Tradițional Arad
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {producer.category?.trim() || 'Producător Local'}
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={17} color="#64748B" />
              <Text style={styles.locationText}>{producer.location}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Apelează ${producer.name}`}
                style={[styles.actionButton, styles.callButton]}
                onPress={() => void callProducer(producer.phone)}
              >
                <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Apelează</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Vezi ${producer.name} pe hartă`}
                style={[styles.actionButton, styles.mapButton]}
                onPress={() => {
                  void triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: '/map',
                    params: {
                      focusId: producer.id,
                      lat:
                        producer.latitude ||
                        (producer.location?.includes('Miniș') ? 46.1481 : 46.1866),
                      lng:
                        producer.longitude ||
                        (producer.location?.includes('Miniș') ? 21.6142 : 21.3123),
                      title: producer.name,
                    },
                  });
                }}
              >
                <Ionicons name="map-outline" size={17} color="#047857" />
                <Text style={styles.mapButtonText}>Vezi pe Hartă</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const styles = StyleSheet.create({
  screen: {
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
    marginBottom: 18,
  },
  eyebrow: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },
  title: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
  },
  filterScroll: {
    flexGrow: 0,
    marginHorizontal: -16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 3,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  activeFilterChip: {
    backgroundColor: '#059669',
  },
  filterText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listHeader: {
    marginTop: 18,
    marginBottom: 10,
  },
  resultsCount: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  producerCard: {
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  cardHeader: {
    gap: 10,
    alignItems: 'flex-start',
  },
  producerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  producerName: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  traditionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
  },
  traditionalBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#D1FAE5',
  },
  categoryText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 13,
  },
  locationText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  callButton: {
    backgroundColor: '#059669',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mapButton: {
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  mapButtonText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 28,
    marginTop: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#ECFDF5',
  },
  emptyTitle: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  statusText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#059669',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  retryText: {
    marginTop: 7,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
});