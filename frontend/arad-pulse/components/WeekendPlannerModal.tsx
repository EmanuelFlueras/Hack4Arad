import { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

type PlannerStep = 1 | 2 | 3 | 4;
type Atmosphere = 'history' | 'tasting' | 'food' | 'adventure';

type ItineraryStop = {
  id: string;
  time: string;
  title: string;
  description: string;
  address: string;
  scores: Record<Atmosphere, number>;
};

const companyOptions = [
  'În familie 👨‍👩‍👧‍👦',
  'În cuplu 💑',
  'Cu prietenii 🎒',
  'Solo Explorer 🚶‍♂️',
];

const atmosphereOptions: { label: string; value: Atmosphere }[] = [
  { label: 'Natură & Istorie 🏰', value: 'history' },
  { label: 'Degustare & Relaxare 🍇', value: 'tasting' },
  { label: 'Târguri & Gastronomie 🥖', value: 'food' },
  { label: 'Aventură & Mișcare 🚴‍♂️', value: 'adventure' },
];

const timeOptions = ['2-3 ore ⏱️', 'Jumătate de zi ☀️', 'Toată ziua 🌅'];

const itineraryStops: ItineraryStop[] = [
  {
    id: 'bakery',
    time: '10:00',
    title: 'Tradiție și mic-dejun cald la Brutăria Tradițională din Pecica',
    description: 'Începe ziua cu Pită de Pecica proaspătă și gusturi locale.',
    address: 'Pecica, Arad',
    scores: { history: 1, tasting: 3, food: 4, adventure: 1 },
  },
  {
    id: 'fortress',
    time: '13:00',
    title: 'Cetatea Șoimoș și panorama Lipovei',
    description: 'O oprire cu istorie, priveliști și timp pentru explorare.',
    address: 'Cetatea Șoimoș, Lipova',
    scores: { history: 4, tasting: 1, food: 1, adventure: 3 },
  },
  {
    id: 'wine',
    time: '16:00',
    title: 'Degustare de vinuri la Cramele Miniș-Măderat',
    description: 'Descoperă vinuri locale și peisajul podgoriei Miniș-Măderat.',
    address: 'Miniș, Arad',
    scores: { history: 2, tasting: 4, food: 3, adventure: 1 },
  },
  {
    id: 'river',
    time: '19:00',
    title: 'Plimbare pe faleza Mureșului și relaxare lângă Palatul Cultural',
    description: 'Încheie traseul cu o plimbare relaxantă în centrul Aradului.',
    address: 'Palatul Cultural, Arad',
    scores: { history: 3, tasting: 2, food: 2, adventure: 3 },
  },
];

const stepPrompts: Record<1 | 2 | 3, string> = {
  1: 'Cu cine ești?',
  2: 'Ce atmosferă cauți?',
  3: 'Cât timp ai la dispoziție?',
};

export function WeekendPlannerModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState<PlannerStep>(1);
  const [company, setCompany] = useState<string | null>(null);
  const [atmosphere, setAtmosphere] = useState<Atmosphere | null>(null);
  const [availableTime, setAvailableTime] = useState<string | null>(null);

  const selectedStops = useMemo(() => {
    if (!atmosphere || !availableTime || availableTime === timeOptions[2]) {
      return itineraryStops;
    }

    const stopCount = availableTime === timeOptions[0] ? 2 : 3;
    return [...itineraryStops]
      .sort((first, second) => second.scores[atmosphere] - first.scores[atmosphere])
      .slice(0, stopCount)
      .sort((first, second) => first.time.localeCompare(second.time));
  }, [atmosphere, availableTime]);

  const selectOption = (onSelect: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error: unknown) => {
      console.warn('Could not trigger selection haptic:', error);
    });
    onSelect();
  };

  const generateItinerary = () => {
    if (!company || !atmosphere || !availableTime) return;
    setStep(4);
  };

  const resetPlanner = () => {
    setCompany(null);
    setAtmosphere(null);
    setAvailableTime(null);
    setStep(1);
  };

  const shareItinerary = async () => {
    const stops = selectedStops
      .map((stop) => `${stop.time} — ${stop.title}\n${stop.description}`)
      .join('\n\n');

    try {
      await Share.share({
        title: 'Traseul meu de weekend în Arad',
        message: `Planul meu de weekend în Arad (${company}, ${availableTime}):\n\n${stops}\n\nDescoperă evenimentele și producătorii locali pe Arad Pulse.`,
      });
    } catch (error) {
      console.error('Could not share weekend itinerary:', error);
    }
  };

  const openStopInMaps = async (stop: ItineraryStop) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open itinerary stop in maps:', error);
    }
  };

  const selectedAtmosphereLabel =
    atmosphereOptions.find((option) => option.value === atmosphere)?.label ?? '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: isDark ? '#00000099' : '#0F172A66' }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>ARAD PULSE</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Planificator de weekend</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide planificatorul"
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
              ]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step < 4 ? (
            <View style={styles.progressRow}>
              {[1, 2, 3].map((item) => (
                <View
                  key={item}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: item <= step ? colors.primary : colors.border },
                  ]}
                />
              ))}
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {step < 4 ? (
              <>
                <Text style={[styles.question, { color: colors.text }]}>
                  {stepPrompts[step as 1 | 2 | 3]}
                </Text>
                <Text style={[styles.helperText, { color: colors.subtext }]}>
                  Alege o opțiune pentru a-ți personaliza traseul.
                </Text>

                <View style={styles.options}>
                  {(step === 1 ? companyOptions : step === 2 ? atmosphereOptions : timeOptions).map(
                    (option) => {
                      const label = typeof option === 'string' ? option : option.label;
                      const selectedAtmosphere =
                        typeof option === 'string'
                          ? null
                          : (option as (typeof atmosphereOptions)[number]).value;
                      const isSelected =
                        step === 1
                          ? company === label
                          : step === 2
                            ? atmosphere === selectedAtmosphere
                            : availableTime === label;

                      return (
                        <TouchableOpacity
                          key={label}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          onPress={() =>
                            selectOption(() => {
                              if (step === 1) setCompany(label);
                              if (step === 2 && selectedAtmosphere) setAtmosphere(selectedAtmosphere);
                              if (step === 3) setAvailableTime(label);
                            })
                          }
                          style={[
                            styles.option,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.inputBg,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {label}
                          </Text>
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={21} color="#FFFFFF" />
                          ) : (
                            <Ionicons name="ellipse-outline" size={21} color={colors.subtext} />
                          )}
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={
                    (step === 1 && !company) ||
                    (step === 2 && !atmosphere) ||
                    (step === 3 && !availableTime)
                  }
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    ((step === 1 && !company) ||
                      (step === 2 && !atmosphere) ||
                      (step === 3 && !availableTime)) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => {
                    if (step === 3) generateItinerary();
                    else setStep((step + 1) as PlannerStep);
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    {step === 3 ? 'Generează Traseul Meu în Arad' : 'Continuă'}
                  </Text>
                  <Ionicons
                    name={step === 3 ? 'sparkles-outline' : 'arrow-forward'}
                    size={19}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
                {step > 1 ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.backButton}
                    onPress={() => setStep((step - 1) as PlannerStep)}
                  >
                    <Ionicons name="arrow-back" size={17} color={colors.subtext} />
                    <Text style={[styles.backButtonText, { color: colors.subtext }]}>Înapoi</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <>
                <View style={[styles.resultBanner, { backgroundColor: colors.inputBg }]}>
                  <View style={[styles.resultIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="map" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.resultBannerText}>
                    <Text style={[styles.resultTitle, { color: colors.text }]}>Traseul tău în Arad</Text>
                    <Text style={[styles.resultSubtitle, { color: colors.subtext }]}>
                      {company} · {availableTime}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: colors.subtext }]}>
                      Inspirat de: {selectedAtmosphereLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeline}>
                  {selectedStops.map((stop, index) => (
                    <View key={stop.id} style={styles.stopRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineDot,
                            { backgroundColor: colors.primary, borderColor: colors.card },
                          ]}
                        />
                        {index < selectedStops.length - 1 ? (
                          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.stopCard,
                          { backgroundColor: colors.inputBg, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.stopTime, { color: colors.primary }]}>{stop.time}</Text>
                        <Text style={[styles.stopTitle, { color: colors.text }]}>{stop.title}</Text>
                        <Text style={[styles.stopDescription, { color: colors.subtext }]}>
                          {stop.description}
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => void openStopInMaps(stop)}
                          style={styles.mapLink}
                        >
                          <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                          <Text style={[styles.mapLinkText, { color: colors.primary }]}>
                            Deschide în hartă
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => void shareItinerary()}
                >
                  <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Distribuie Traseul (Share)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: colors.inputBg, borderColor: colors.border },
                  ]}
                  onPress={resetPlanner}
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.text} />
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Refă planul</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default WeekendPlannerModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 32,
  },
  sheet: {
    maxHeight: '94%',
    minHeight: '72%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitleWrap: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 22,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  question: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  helperText: {
    marginTop: 7,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  options: {
    gap: 10,
  },
  option: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 22,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
  },
  resultIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  resultBannerText: {
    flex: 1,
    gap: 3,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  timeline: {
    marginBottom: 4,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 122,
  },
  timelineRail: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 3,
    marginBottom: -3,
  },
  stopCard: {
    flex: 1,
    marginBottom: 12,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  stopTime: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  stopTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  stopDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 9,
    paddingVertical: 2,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});