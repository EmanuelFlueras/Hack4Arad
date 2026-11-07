import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TextInput,
  Linking,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { eventService, BackendEvent } from '../../services/eventService';
import { useTheme } from '../../context/ThemeContext';
import WeekendPlannerModal from '../../components/WeekendPlannerModal';

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

function formatEventDate(dateValue: string | Date | undefined): string {
  if (!dateValue) return 'Dată nespecificată';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'TBA';

  return date.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const getLocalDateKey = (dateValue: string | Date | null | undefined) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const triggerHaptic = async (feedback: Promise<void>) => {
  try {
    await feedback;
  } catch (error) {
    console.warn('Haptic feedback is unavailable:', error);
  }
};

const handleShare = async (event: any) => {
  try {
    await triggerHaptic(
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    );
    await Share.share({
      title: event.title,
      message: `Hai la ${event.title} (${event.location})! Descoperă evenimentele și producătorii locali pe Arad Pulse.`,
    });
  } catch (error) {
    console.log('Error sharing:', error);
  }
};

export default function EventsScreen() {
  const { colors, isDark } = useTheme();
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BackendEvent | null>(null);
  const [impressionDraft, setImpressionDraft] = useState('');
  const [localImpressions, setLocalImpressions] = useState<Record<string, string[]>>({});
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  const loadEvents = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const addImpression = () => {
    const impression = impressionDraft.trim();
    if (!selectedEvent || !impression) return;

    setLocalImpressions((current) => ({
      ...current,
      [selectedEvent.id]: [...(current[selectedEvent.id] ?? []), impression],
    }));
    setImpressionDraft('');
  };

  const navigateToEvent = async (event: BackendEvent) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    try {
      await Linking.openURL(url);
    } catch (navigationError) {
      console.error('Failed to open event directions:', navigationError);
      Alert.alert('Navigare indisponibilă', 'Nu s-a putut deschide locația evenimentului.');
    }
  };

  const addToGoogleCalendar = async (event: BackendEvent) => {
    const startDate = new Date(event.date || Date.now());
    if (Number.isNaN(startDate.getTime())) {
      Alert.alert('Dată invalidă', 'Nu s-a putut adăuga evenimentul în calendar.');
      return;
    }
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const formatGCalDate = (date: Date) =>
      `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || 'Arad')}`;

    try {
      await Linking.openURL(gcalUrl);
    } catch (calendarError) {
      console.error('Failed to open Google Calendar:', calendarError);
      Alert.alert('Calendar indisponibil', 'Nu s-a putut deschide Google Calendar.');
    }
  };

  // Marcarea zilelor cu evenimente pe calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((evt) => {
      const dateKey = getLocalDateKey(evt.date ?? evt.startDate);
      if (!dateKey) return;
      marks[dateKey] = {
        marked: true,
        dotColor: colors.primary,
        selected: selectedDay === dateKey,
        selectedColor: colors.primary,
      };
    });

    if (selectedDay) {
      marks[selectedDay] = {
        ...(marks[selectedDay] || {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [events, selectedDay, colors.primary]);

  // Filtrare pe perioade
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events.filter((evt) => {
      const eventDateValue = evt.date ?? evt.startDate;
      const isEventTba = evt.isTba || !eventDateValue;
      const dateKey = getLocalDateKey(eventDateValue);

      if (selectedDay) {
        return dateKey === selectedDay;
      }

      if (filter === 'TBA') {
        return isEventTba;
      }

      if (isEventTba) {
        return filter === 'ALL';
      }

      const eventDate = new Date(eventDateValue!);

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
  }, [events, filter, selectedDay]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>Se încarcă evenimentele din Arad...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Conexiune eșuată la server</Text>
        <Text style={[styles.errorSubtitle, { color: colors.subtext }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadEvents}>
          <Text style={styles.retryButtonText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Deschide planificatorul de weekend"
        activeOpacity={0.9}
        style={[styles.plannerBanner, { backgroundColor: colors.primary }]}
        onPress={() => setPlannerOpen(true)}
      >
        <View style={styles.plannerBannerHeading}>
          <Ionicons name="compass-outline" size={26} color="#FFFFFF" />
          <Text style={styles.plannerBannerTitle}>Planificator de Weekend în Județ</Text>
        </View>
        <Text style={styles.plannerBannerSubtitle}>
          Generează-ți traseul perfect între obiective și producători în 10 secunde.
        </Text>
        <View style={styles.plannerBannerButton}>
          <Text style={[styles.plannerBannerButtonText, { color: colors.primary }]}>
            Creează Traseu ✨
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.calendarHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendarul Evenimentelor</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>
            {selectedDay
              ? `Selectat: ${selectedDay}`
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
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {showCalendar && (
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day: { dateString: string }) => {
              void triggerHaptic(
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
              );
              setSelectedDay(day.dateString);
              setFilter('ALL');
            }}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.subtext,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: isDark ? '#475569' : '#CBD5E1',
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              indicatorColor: colors.primary,
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />
          {selectedDay !== '' && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => {
                void triggerHaptic(
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
                );
                setSelectedDay('');
              }}
            >
              <Text style={[styles.clearDateText, { color: colors.primary }]}>Vezi toate evenimentele</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.filterSection}>
        <Text style={[styles.filterHeaderTitle, { color: colors.text }]}>Filtrează perioada</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['ALL', 'THIS_WEEK', 'THIS_MONTH', 'TBA'] as const).map((filterKey) => {
            const labels = {
              ALL: 'Toate',
              THIS_WEEK: 'Săptămâna aceasta',
              THIS_MONTH: 'Luna aceasta',
              TBA: 'To Be Announced',
            };
            const isActive = filter === filterKey && selectedDay === '';
            return (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  void triggerHaptic(
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
                  );
                  setSelectedDay('');
                  setFilter(filterKey);
                }}
              >
                <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.subtext }]}>
                  {labels[filterKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.eventsList}>
        <Text style={[styles.eventsCountText, { color: colors.subtext }]}>
          {filteredEvents.length}{' '}
          {filteredEvents.length === 1 ? 'eveniment găsit' : 'evenimente găsite'}
        </Text>

        {filteredEvents.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-clear-outline" size={48} color="#94A3B8" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nu există evenimente</Text>
            <Text style={[styles.emptySubtitle, { color: colors.subtext }]}>
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
              <TouchableOpacity
                key={item.id}
                style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.96}
                accessibilityRole="button"
                accessibilityLabel={`Detalii eveniment: ${item.title}`}
                onPress={() => {
                  setImpressionDraft('');
                  setSelectedEvent(item);
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                    <View style={styles.dateBadge}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.dateText, { color: colors.subtext }]}>
                        {formatEventDate(item.date ?? undefined)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleShare(item);
                      }}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Distribuie evenimentul ${item.title}`}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={20}
                        color={colors.subtext}
                      />
                    </TouchableOpacity>
                    {avgRating && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>{avgRating}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.eventDescription, { color: colors.subtext }]}>{item.description}</Text>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.subtext} />
                  <Text style={[styles.locationText, { color: colors.subtext }]}>{item.location}</Text>
                </View>

                {item.partners && item.partners.length > 0 && (
                  <View style={styles.partnersSection}>
                    <View style={styles.partnersHeading}>
                      <Ionicons name="storefront-outline" size={15} color={colors.primary} />
                      <Text style={[styles.partnersTitle, { color: colors.text }]}>Producători locali prezenți:</Text>
                    </View>
                    <View style={styles.partnersRow}>
                      {item.partners.map((partner) => (
                        <TouchableOpacity
                          key={partner.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Vezi ${partner.name} pe hartă`}
                          style={[styles.partnerTag, { backgroundColor: colors.card, borderColor: colors.border }]}
                          onPress={(pressEvent) => {
                            pressEvent.stopPropagation();
                            void triggerHaptic(Haptics.selectionAsync());
                            const isMinis = partner.location?.includes('Miniș') ?? false;
                            router.push({
                              pathname: '/map',
                              params: {
                                focusId: partner.id,
                                title: partner.name,
                                lat: isMinis ? 46.1481 : 46.1866,
                                lng: isMinis ? 21.6142 : 21.3123,
                              },
                            });
                          }}
                        >
                          <Text style={[styles.partnerTagText, { color: colors.subtext }]}>
                            {partner.category
                              ? `${partner.name} (${partner.category})`
                              : partner.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
    <Modal
      visible={selectedEvent !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setSelectedEvent(null)}
    >
      {selectedEvent && (
        <View style={[styles.detailsScreen, { backgroundColor: colors.card }]}>
          <View style={styles.heroContainer}>
            <Image
              source={
                selectedEvent.image
                  ? { uri: selectedEvent.image }
                  : require('../../assets/images/icon.png')
              }
              resizeMode="cover"
              style={styles.heroImage}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide detaliile evenimentului"
              style={[
                styles.heroButton,
                styles.heroCloseButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedEvent(null)}
            >
              <Ionicons name="close" size={23} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Distribuie evenimentul"
              style={[
                styles.heroButton,
                styles.heroShareButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => void handleShare(selectedEvent)}
            >
              <Ionicons name="share-social-outline" size={21} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={[
              styles.detailsContent,
              { backgroundColor: colors.card },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.detailsTitle, { color: colors.text }]}>{selectedEvent.title}</Text>

            <View style={styles.detailsMetaRow}>
              <Ionicons name="calendar-outline" size={17} color={colors.primary} />
              <Text style={[styles.detailsMetaText, { color: colors.subtext }]}>
                {formatEventDate(selectedEvent.date ?? selectedEvent.startDate ?? undefined)}
              </Text>
            </View>
            <View style={styles.detailsMetaRow}>
              <Ionicons name="location-outline" size={17} color={colors.subtext} />
              <Text style={[styles.detailsMetaText, { color: colors.subtext }]}>{selectedEvent.location}</Text>
            </View>

            <View style={[styles.organizerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.organizerIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="business-outline" size={21} color={colors.primary} />
              </View>
              <View style={styles.organizerCopy}>
                <Text style={[styles.organizerName, { color: colors.text }]}>
                  {selectedEvent.creator?.name || 'Producător local Arad'}
                </Text>
                <Text style={[styles.organizerLabel, { color: colors.subtext }]}>Organizator Oficial</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Descriere</Text>
              <Text style={[styles.detailsDescription, { color: colors.subtext }]}>
                {selectedEvent.description || 'Detalii despre acest eveniment vor fi disponibile în curând.'}
              </Text>
            </View>

            {selectedEvent.partners && selectedEvent.partners.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Parteneri Locali</Text>
                <View style={styles.detailsPartners}>
                  {selectedEvent.partners.map((partner) => {
                    const isMinis = partner.location?.includes('Miniș') ?? false;
                    return (
                      <TouchableOpacity
                        key={partner.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Vezi producătorul ${partner.name} pe hartă`}
                        style={[
                          styles.detailsPartnerChip,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                        onPress={() => {
                          void triggerHaptic(Haptics.selectionAsync());
                          router.push({
                            pathname: '/map',
                            params: {
                              focusId: partner.id,
                              title: partner.name,
                              lat: isMinis ? 46.1481 : 46.1866,
                              lng: isMinis ? 21.6142 : 21.3123,
                            },
                          });
                        }}
                      >
                        <Text style={[styles.detailsPartnerName, { color: colors.text }]}>{partner.name}</Text>
                        <Text style={[styles.detailsPartnerAction, { color: colors.subtext }]}>Vezi producător</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.detailsSection}>
              <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                Recenzii Comunitate (4.8 ★)
              </Text>
              {[
                'Super atmosferă anul trecut!',
                'Pâinea caldă a fost genială!',
                'Produse locale excelente și oameni minunați.',
                ...(localImpressions[selectedEvent.id] ?? []),
              ].map((impression, index) => (
                <View key={`${index}-${impression}`} style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.primary} />
                  <Text style={[styles.reviewText, { color: colors.text }]}>{impression}</Text>
                </View>
              ))}
              <View style={styles.impressionForm}>
                <TextInput
                  accessibilityLabel="Adaugă o impresie"
                  value={impressionDraft}
                  onChangeText={setImpressionDraft}
                  placeholder="Adaugă o impresie..."
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.impressionInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  returnKeyType="send"
                  onSubmitEditing={addImpression}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Publică impresia"
                  style={[styles.impressionButton, { backgroundColor: colors.primary }]}
                  onPress={addImpression}
                  disabled={!impressionDraft.trim()}
                >
                  <Ionicons name="send" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.detailsFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[
                styles.googleCalendarButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => void addToGoogleCalendar(selectedEvent)}
            >
              <Ionicons name="calendar-outline" size={19} color={colors.primary} />
              <Text style={[styles.googleCalendarButtonText, { color: colors.primary }]}>
                Adaugă în Google Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.directionsButton, { backgroundColor: colors.primary }]}
              onPress={() => void navigateToEvent(selectedEvent)}
            >
              <Ionicons name="navigate-outline" size={19} color="#FFFFFF" />
              <Text style={styles.directionsButtonText}>Navighează către eveniment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
    <WeekendPlannerModal
      visible={plannerOpen}
      onClose={() => setPlannerOpen(false)}
    />
    </>
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
  plannerBanner: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  plannerBannerHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plannerBannerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  plannerBannerSubtitle: {
    color: '#FEE2E2',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  plannerBannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  plannerBannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  partnersHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
  },
  partnersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  partnersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partnerTag: {
    maxWidth: '100%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  partnerTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  detailsScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroContainer: {
    height: 220,
    position: 'relative',
    backgroundColor: '#CBD5E1',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroButton: {
    position: 'absolute',
    top: 48,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderWidth: 1,
  },
  heroCloseButton: {
    left: 16,
  },
  heroShareButton: {
    right: 16,
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 20,
    paddingBottom: 28,
  },
  detailsTitle: {
    marginBottom: 12,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  detailsMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  detailsMetaText: {
    flex: 1,
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF5',
  },
  organizerIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  organizerCopy: {
    flex: 1,
  },
  organizerName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  organizerLabel: {
    marginTop: 3,
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    marginTop: 22,
  },
  detailsSectionTitle: {
    marginBottom: 10,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  detailsDescription: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  detailsPartners: {
    gap: 9,
  },
  detailsPartnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
  },
  detailsPartnerName: {
    flex: 1,
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsPartnerAction: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  reviewText: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  impressionForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  impressionInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 14,
  },
  impressionButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#059669',
  },
  detailsFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 9,
  },
  googleCalendarButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  googleCalendarButtonText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '700',
  },
  directionsButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});