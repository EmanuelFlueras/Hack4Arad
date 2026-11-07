import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { eventService, BackendEvent } from '../../services/eventService';

// Configurare limbă română pentru calendar
LocaleConfig.locales['ro'] = {
  monthNames: [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ],
  monthNamesShort: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
  dayNamesShort: ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
  today: 'Astăzi'
};
LocaleConfig.defaultLocale = 'ro';

type FilterType = 'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'TBA';

export default function EventsScreen() {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  const loadEvents = async () => {
    try {
      setError(null);
      const data = await eventService.getAll();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Nu s-au putut încărca evenimentele din baza de date.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  // Marcarea zilelor cu evenimente pe calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((evt) => {
      if (evt.startDate && !evt.isTba) {
        const dateKey = evt.startDate.split('T')[0];
        marks[dateKey] = {
          marked: true,
          dotColor: '#C82333',
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: '#C82333',
              borderRadius: 16,
            },
            text: {
              color: '#C82333',
              fontWeight: '700',
            },
          },
        };
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: '#C82333',
        selectedTextColor: '#FFFFFF',
      };
    }

    return marks;
  }, [events, selectedDate]);

  // Filtrare pe perioade
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events.filter((evt) => {
      const isEventTba = evt.isTba || !evt.startDate;
      const dateKey = evt.startDate ? evt.startDate.split('T')[0] : '';

      if (selectedDate && !isEventTba) {
        return dateKey === selectedDate;
      }

      if (filter === 'TBA') {
        return isEventTba;
      }

      if (isEventTba) {
        return filter === 'ALL';
      }

      const eventDate = new Date(evt.startDate!);

      if (filter === 'THIS_WEEK') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      }

      if (filter === 'THIS_MONTH') {
        return (
          eventDate.getMonth() === now.getMonth() &&
          eventDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });
  }, [events, filter, selectedDate]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C82333" />
        <Text style={styles.loadingText}>Se încarcă evenimentele din Arad...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Conexiune eșuată la server</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
          <Text style={styles.retryButtonText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.calendarHeader}>
        <View>
          <Text style={styles.sectionTitle}>Calendarul Evenimentelor</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedDate
              ? `Selectat: ${selectedDate}`
              : 'Zilele încercuite conțin evenimente locale'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowCalendar((prev) => !prev)}
        >
          <Ionicons
            name={showCalendar ? 'chevron-up-circle-outline' : 'calendar-outline'}
            size={24}
            color="#C82333"
          />
        </TouchableOpacity>
      </View>

      {showCalendar && (
        <View style={styles.calendarCard}>
          <Calendar
            markingType={'custom'}
            markedDates={markedDates}
            onDayPress={(day: { dateString: string }) => {
              if (selectedDate === day.dateString) {
                setSelectedDate('');
              } else {
                setSelectedDate(day.dateString);
                setFilter('ALL');
              }
            }}
            theme={{
              todayTextColor: '#C82333',
              arrowColor: '#C82333',
              indicatorColor: '#C82333',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />
          {selectedDate !== '' && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setSelectedDate('')}
            >
              <Text style={styles.clearDateText}>Resetează selecția zilei</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.filterSection}>
        <Text style={styles.filterHeaderTitle}>Filtrează perioada</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['ALL', 'THIS_WEEK', 'THIS_MONTH', 'TBA'] as const).map((filterKey) => {
            const labels = {
              ALL: 'Toate',
              THIS_WEEK: 'Săptămâna aceasta',
              THIS_MONTH: 'Luna aceasta',
              TBA: 'To Be Announced',
            };
            const isActive = filter === filterKey && selectedDate === '';
            return (
              <TouchableOpacity
                key={filterKey}
                style={[styles.filterChip, isActive && styles.activeChip]}
                onPress={() => {
                  setSelectedDate('');
                  setFilter(filterKey);
                }}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {labels[filterKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.eventsList}>
        <Text style={styles.eventsCountText}>
          {filteredEvents.length}{' '}
          {filteredEvents.length === 1 ? 'eveniment găsit' : 'evenimente găsite'}
        </Text>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nu există evenimente</Text>
            <Text style={styles.emptySubtitle}>
              Nu am găsit niciun eveniment programat pentru selecția curentă.
            </Text>
          </View>
        ) : (
          filteredEvents.map((item) => {
            const avgRating =
              item.reviews && item.reviews.length > 0
                ? (
                    item.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                    item.reviews.length
                  ).toFixed(1)
                : null;

            return (
              <View key={item.id} style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <View style={styles.dateBadge}>
                      <Ionicons name="time-outline" size={14} color="#C82333" />
                      <Text style={styles.dateText}>
                        {item.isTba || !item.startDate
                          ? 'Dată în curs de stabilire (TBA)'
                          : new Date(item.startDate).toLocaleDateString('ro-RO', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                      </Text>
                    </View>
                  </View>

                  {avgRating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{avgRating}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.eventDescription}>{item.description}</Text>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="#64748B" />
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>

                {item.partners && item.partners.length > 0 && (
                  <View style={styles.partnersSection}>
                    <Text style={styles.partnersTitle}>Producători locali parteneri:</Text>
                    <View style={styles.partnersRow}>
                      {item.partners.map((partner) => (
                        <View key={partner.id} style={styles.partnerTag}>
                          <Ionicons name="ribbon-outline" size={12} color="#1E293B" />
                          <Text style={styles.partnerTagText}>{partner.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })
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
  loadingText: {
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
  errorSubtitle: {
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  toggleButton: {
    padding: 6,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearDateText: {
    color: '#C82333',
    fontSize: 13,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
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
  eventsList: {
    marginTop: 8,
  },
  eventsCountText: {
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
    marginTop: 12,
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
  eventCard: {
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
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateText: {
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
  eventDescription: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  partnersSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  partnersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  partnersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  partnerTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
});