import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { Region } from 'react-native-maps';
import { MapPoint, mapService } from '../../services/mapService';

type PointFilter = 'ALL' | 'EVENT' | 'PRODUCER';
type UserLocation = { latitude: number; longitude: number };

const ARAD_CENTER: UserLocation = { latitude: 46.1866, longitude: 21.3123 };

const INITIAL_REGION: Region = {
  latitude: 46.1866,
  longitude: 21.3123,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const filters: { key: PointFilter; label: string }[] = [
  { key: 'ALL', label: 'Toate' },
  { key: 'EVENT', label: 'Evenimente' },
  { key: 'PRODUCER', label: 'Producători' },
];

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filter, setFilter] = useState<PointFilter>('ALL');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      setPoints(await mapService.getPoints());
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nu s-au putut încărca punctele de pe hartă.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPoints();
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadUserLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;

        const location = await Location.getCurrentPositionAsync({});
        if (isActive) {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch {
        if (isActive) setUserLocation(null);
      }
    };

    void loadUserLocation();
    return () => {
      isActive = false;
    };
  }, []);

  const filteredPoints = points.filter((point) => filter === 'ALL' || point.type === filter);

  const selectFilter = (nextFilter: PointFilter) => {
    setFilter(nextFilter);
    setSelectedPoint(null);
  };

  const openNavigation = (point: MapPoint) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`;
    void Linking.openURL(url).catch((navigationError: unknown) => {
      console.error('Could not open directions:', navigationError);
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C82333" />
        <Text style={styles.statusText}>Se încarcă punctele de pe hartă...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Conexiune eșuată la server</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadPoints()}>
          <Text style={styles.retryButtonText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return Platform.OS === 'web' ? (
    <WebPointsList
      points={filteredPoints}
      allPoints={points}
      filter={filter}
      userLocation={userLocation}
      selectedPoint={selectedPoint}
      onFilterChange={selectFilter}
      onPointSelect={setSelectedPoint}
      onNavigate={openNavigation}
      onClosePreview={() => setSelectedPoint(null)}
    />
  ) : (
    <NativePointsMap
      points={filteredPoints}
      filter={filter}
      userLocation={userLocation}
      selectedPoint={selectedPoint}
      onFilterChange={selectFilter}
      onPointSelect={setSelectedPoint}
      onNavigate={openNavigation}
      onClosePreview={() => setSelectedPoint(null)}
    />
  );
}

interface MapViewProps {
  points: MapPoint[];
  filter: PointFilter;
  userLocation: UserLocation | null;
  selectedPoint: MapPoint | null;
  onFilterChange: (filter: PointFilter) => void;
  onPointSelect: (point: MapPoint) => void;
  onNavigate: (point: MapPoint) => void;
  onClosePreview: () => void;
}

function WebPointsList({
  points,
  allPoints,
  filter,
  userLocation,
  selectedPoint,
  onFilterChange,
  onPointSelect,
  onNavigate,
  onClosePreview,
}: MapViewProps & { allPoints: MapPoint[] }) {
  return (
    <View style={styles.webScreen}>
      <ScrollView
        style={styles.webScroll}
        contentContainerStyle={[styles.webContent, selectedPoint && styles.webContentWithPreview]}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Harta Producătorilor</Text>
          <Text style={styles.subtitle}>Evenimente și producători locali din județul Arad.</Text>
        </View>

        <FilterBar filter={filter} onFilterChange={onFilterChange} />

        <Text style={styles.pointsCount}>
          {points.length} {points.length === 1 ? 'punct afișat' : 'puncte afișate'}
        </Text>

        {points.length === 0 ? (
          <EmptyPoints isEmpty={allPoints.length === 0} />
        ) : (
          points.map((point) => (
            <PointCard
              key={point.id}
              point={point}
              selected={selectedPoint?.id === point.id}
              onPress={() => onPointSelect(point)}
            />
          ))
        )}
      </ScrollView>

      {selectedPoint && (
        <PointPreview
          point={selectedPoint}
          userLocation={userLocation}
          onClose={onClosePreview}
          onNavigate={() => onNavigate(selectedPoint)}
          style={styles.webPreview}
        />
      )}
    </View>
  );
}

function NativePointsMap({
  points,
  filter,
  userLocation,
  selectedPoint,
  onFilterChange,
  onPointSelect,
  onNavigate,
  onClosePreview,
}: MapViewProps) {
  const { default: MapView, Marker } = require('react-native-maps') as typeof import('react-native-maps');

  return (
    <View style={styles.nativeScreen}>
      <MapView style={styles.map} initialRegion={INITIAL_REGION}>
        {points.map((point) => {
          const isProducer = point.type === 'PRODUCER';
          const isSelected = selectedPoint?.id === point.id;

          return (
            <Marker
              key={point.id}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.title}
              description={point.address}
              onPress={() => onPointSelect(point)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.marker,
                  isProducer ? styles.producerMarker : styles.eventMarker,
                  isSelected && styles.selectedMarker,
                ]}
              >
                <Ionicons
                  name={isProducer ? 'storefront' : 'calendar'}
                  size={17}
                  color="#FFFFFF"
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.nativeTopOverlay} pointerEvents="box-none">
        <Text style={styles.nativeTitle}>Harta Producătorilor</Text>
        <FilterBar filter={filter} onFilterChange={onFilterChange} />
      </View>

      {points.length === 0 && (
        <View style={styles.emptyMapWrap} pointerEvents="none">
          <EmptyPoints isEmpty />
        </View>
      )}

      {selectedPoint && (
        <PointPreview
          point={selectedPoint}
          userLocation={userLocation}
          onClose={onClosePreview}
          onNavigate={() => onNavigate(selectedPoint)}
          style={styles.nativePreview}
        />
      )}
    </View>
  );
}

function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: PointFilter;
  onFilterChange: (filter: PointFilter) => void;
}) {
  return (
    <View style={styles.filterBar}>
      {filters.map((item) => {
        const isActive = filter === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.filterChip, isActive && styles.activeChip]}
            onPress={() => onFilterChange(item.key)}
          >
            <Text style={[styles.chipText, isActive && styles.activeChipText]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PointCard({
  point,
  selected,
  onPress,
}: {
  point: MapPoint;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ver ${point.title} pe hartă`}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.pointCard, selected && styles.selectedPointCard]}
    >
      <View style={styles.pointCardHeader}>
        <Text style={styles.pointTitle}>{point.title}</Text>
        <PointTypeBadge type={point.type} />
      </View>
      <View style={styles.pointTags}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{getCategoryLabel(point)}</Text>
        </View>
        <View style={styles.locationTag}>
          <Ionicons name="location-outline" size={13} color="#64748B" />
          <Text style={styles.locationTagText}>{point.address || 'Locație nespecificată'}</Text>
        </View>
      </View>
      {point.description ? (
        <Text numberOfLines={2} style={styles.pointDescription}>
          {point.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function PointPreview({
  point,
  userLocation,
  onClose,
  onNavigate,
  style,
}: {
  point: MapPoint;
  userLocation: UserLocation | null;
  onClose: () => void;
  onNavigate: () => void;
  style: object;
}) {
  const distance = calculateDistance(
    userLocation?.latitude ?? ARAD_CENTER.latitude,
    userLocation?.longitude ?? ARAD_CENTER.longitude,
    point.latitude,
    point.longitude,
  );

  return (
    <View style={[styles.previewCard, style]}>
      <View style={styles.previewHeader}>
        <View style={styles.previewTitleWrap}>
          <PointTypeBadge type={point.type} />
          <Text numberOfLines={2} style={styles.previewTitle}>
            {point.title}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Închide detaliile punctului"
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={styles.distancePill}>
        <Ionicons name="navigate-circle-outline" size={17} color="#0284C7" />
        <Text style={styles.distanceText}>
          {distance} {userLocation ? 'de tine' : 'de centrul Aradului'}
        </Text>
      </View>
      {!userLocation && (
        <Text style={styles.distanceNote}>Distanță estimată față de centrul Aradului.</Text>
      )}

      <View style={styles.previewCategory}>
        <Text style={styles.categoryTagText}>{getCategoryLabel(point)}</Text>
      </View>
      <View style={styles.previewLocation}>
        <Ionicons name="location-outline" size={15} color="#64748B" />
        <Text style={styles.previewLocationText}>
          {point.address || 'Locație nespecificată'}
        </Text>
      </View>
      <Text style={styles.previewDescription}>
        {point.description || 'Nu există o descriere disponibilă.'}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.navigateButton,
          point.type === 'PRODUCER' ? styles.navigateProducerButton : styles.navigateEventButton,
        ]}
        onPress={onNavigate}
      >
        <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
        <Text style={styles.navigateButtonText}>Navighează</Text>
      </TouchableOpacity>
    </View>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lon2 - lon1);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function PointTypeBadge({ type }: { type: MapPoint['type'] }) {
  const isProducer = type === 'PRODUCER';
  return (
    <View style={[styles.typeBadge, isProducer ? styles.producerBadge : styles.eventBadge]}>
      <Text
        style={[styles.typeBadgeText, isProducer ? styles.producerBadgeText : styles.eventBadgeText]}
      >
        {isProducer ? 'Producător Local' : 'Eveniment Local'}
      </Text>
    </View>
  );
}

function EmptyPoints({ isEmpty }: { isEmpty: boolean }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="map-outline" size={38} color="#94A3B8" />
      <Text style={styles.emptyTitle}>{isEmpty ? 'Harta este goală' : 'Niciun rezultat'}</Text>
      <Text style={styles.emptyText}>
        {isEmpty
          ? 'Nu sunt puncte disponibile momentan.'
          : 'Nu există puncte pentru filtrul selectat.'}
      </Text>
    </View>
  );
}

function getCategoryLabel(point: MapPoint): string {
  return point.category?.trim() || (point.type === 'PRODUCER' ? 'Producător Local' : 'Eveniment local');
}

const styles = StyleSheet.create({
  webScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  nativeScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webScroll: {
    flex: 1,
  },
  webContent: {
    padding: 16,
    paddingBottom: 32,
  },
  webContentWithPreview: {
    paddingBottom: 250,
  },
  pageHeader: {
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#C82333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 6,
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  activeChip: {
    backgroundColor: '#C82333',
  },
  chipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  pointsCount: {
    marginTop: 18,
    marginBottom: 10,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  pointCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedPointCard: {
    borderColor: '#C82333',
  },
  pointCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  pointTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  producerBadge: {
    backgroundColor: '#059669',
  },
  eventBadge: {
    backgroundColor: '#C82333',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  producerBadgeText: {
    color: '#FFFFFF',
  },
  eventBadgeText: {
    color: '#FFFFFF',
  },
  pointTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 11,
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryTagText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  locationTagText: {
    flexShrink: 1,
    color: '#64748B',
    fontSize: 12,
  },
  pointDescription: {
    marginTop: 10,
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  nativeTopOverlay: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  nativeTitle: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  producerMarker: {
    backgroundColor: '#059669',
  },
  eventMarker: {
    backgroundColor: '#C82333',
  },
  selectedMarker: {
    transform: [{ scale: 1.15 }],
  },
  emptyMapWrap: {
    position: 'absolute',
    top: '42%',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    marginTop: 10,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  nativePreview: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  webPreview: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewTitleWrap: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 7,
  },
  previewTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  previewCategory: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  previewLocationText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
  },
  previewDescription: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  distancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
  },
  distanceText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  distanceNote: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 11,
  },
  navigateButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 13,
    borderRadius: 11,
  },
  navigateProducerButton: {
    backgroundColor: '#059669',
  },
  navigateEventButton: {
    backgroundColor: '#C82333',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});