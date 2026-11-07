import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService, { type UserSession } from '../../services/authService';

const lightPalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  subtle: '#F1F5F9',
  input: '#FFFFFF',
};

const darkPalette = {
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  muted: '#CBD5E1',
  border: '#334155',
  subtle: '#334155',
  input: '#0F172A',
};

export default function SettingsScreen() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const palette = isDarkMode ? darkPalette : lightPalette;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCurrentUser = async () => {
        setIsLoading(true);
        const user = await authService.getCurrentUser();
        if (isActive) {
          setCurrentUser(user);
          setIsLoading(false);
        }
      };

      void loadCurrentUser();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const openEditModal = () => {
    if (!currentUser) return;
    setEditPhone(currentUser.phone);
    setEditLocation(currentUser.location);
    setEditCategory(currentUser.category ?? '');
    setError(null);
    setEditError(null);
    setIsEditModalVisible(true);
  };

  const saveProfileDraft = () => {
    if (!currentUser) return;
    if (!editPhone.trim() || !editLocation.trim()) {
      setEditError('Numărul de telefon și locația sunt obligatorii.');
      return;
    }

    setEditError(null);
    setCurrentUser({
      ...currentUser,
      phone: editPhone.trim(),
      location: editLocation.trim(),
      category: editCategory.trim() || null,
    });
    setIsEditModalVisible(false);
    setFeedback('Datele profilului au fost actualizate în această sesiune.');
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await authService.logout();
      setCurrentUser(null);
      setFeedback('Ai ieșit din cont.');
    } catch {
      setError('Nu s-a putut încheia sesiunea. Încearcă din nou.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color="#C82333" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: palette.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: palette.text }]}>Setări & Cont</Text>
          <Text style={[styles.pageSubtitle, { color: palette.muted }]}>HACK 4 ARAD</Text>
        </View>

        {feedback && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#047857" />
            <Text style={styles.feedbackText}>{feedback}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide notificarea"
              onPress={() => setFeedback(null)}
            >
              <Ionicons name="close" size={17} color="#047857" />
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {currentUser ? (
          <LoggedInView
            user={currentUser}
            palette={palette}
            isDarkMode={isDarkMode}
            onEditPress={openEditModal}
            onLogout={() => void handleLogout()}
            onThemeChange={setIsDarkMode}
          />
        ) : (
          <GuestView
            palette={palette}
            isDarkMode={isDarkMode}
            onEnroll={() => router.push('/modal')}
            onThemeChange={setIsDarkMode}
          />
        )}
      </ScrollView>

      <ProfileEditModal
        visible={isEditModalVisible}
        palette={palette}
        phone={editPhone}
        location={editLocation}
        category={editCategory}
        error={editError}
        onChangePhone={setEditPhone}
        onChangeLocation={setEditLocation}
        onChangeCategory={setEditCategory}
        onClose={() => setIsEditModalVisible(false)}
        onSave={saveProfileDraft}
      />
    </>
  );
}

interface Palette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  subtle: string;
  input: string;
}

function GuestView({
  palette,
  isDarkMode,
  onEnroll,
  onThemeChange,
}: {
  palette: Palette;
  isDarkMode: boolean;
  onEnroll: () => void;
  onThemeChange: (value: boolean) => void;
}) {
  return (
    <>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="leaf-outline" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.welcomeTitle}>Bine ai venit în HACK 4 ARAD!</Text>
        <Text style={styles.welcomeText}>
          Descoperă comunitatea locală sau solicită un cont pentru a-ți prezenta afacerea.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.cardHeadingRow}>
          <View style={[styles.iconTile, { backgroundColor: isDarkMode ? '#3B2530' : '#FEE2E2' }]}>
            <Ionicons name="people-outline" size={20} color="#C82333" />
          </View>
          <View style={styles.cardHeadingText}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Ești producător sau reprezentant oficial?</Text>
            <Text style={[styles.cardDescription, { color: palette.muted }]}>Alătură-te rețelei locale.</Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={onEnroll}
        >
          <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Creează cont / Autentificare</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <PreferencesCard palette={palette} isDarkMode={isDarkMode} onThemeChange={onThemeChange} />

      <View style={styles.appInfo}>
        <Text style={[styles.appInfoTitle, { color: palette.muted }]}>Arad Pulse</Text>
        <Text style={[styles.appInfoVersion, { color: palette.muted }]}>1.0.0 (Hackathon Edition)</Text>
      </View>
    </>
  );
}

function LoggedInView({
  user,
  palette,
  isDarkMode,
  onEditPress,
  onLogout,
  onThemeChange,
}: {
  user: UserSession;
  palette: Palette;
  isDarkMode: boolean;
  onEditPress: () => void;
  onLogout: () => void;
  onThemeChange: (value: boolean) => void;
}) {
  const roleColor = user.role === 'PRODUCER' ? '#059669' : user.role === 'ADMIN' ? '#C82333' : '#D97706';
  const roleLabel = user.role === 'PRODUCER' ? 'Producător' : user.role === 'ADMIN' ? 'Administrator' : user.role;

  return (
    <>
      <View style={[styles.profileCard, { backgroundColor: palette.surface }]}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={25} color="#C82333" />
          </View>
          <View style={styles.profileBadges}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
            {user.category ? (
              <View style={[styles.categoryBadge, { backgroundColor: palette.subtle }]}>
                <Text style={[styles.categoryText, { color: palette.text }]}>{user.category}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={[styles.profileName, { color: palette.text }]}>{user.name}</Text>
        <ProfileInfoRow icon="call-outline" value={user.phone} color={palette.muted} />
        <ProfileInfoRow icon="location-outline" value={user.location} color={palette.muted} />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Cont</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.actionRow, { borderColor: palette.border }]}
          onPress={onEditPress}
        >
          <View style={[styles.actionIcon, { backgroundColor: palette.subtle }]}>
            <Ionicons name="create-outline" size={19} color="#C82333" />
          </View>
          <Text style={[styles.actionLabel, { color: palette.text }]}>Editare cont</Text>
          <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </TouchableOpacity>
      </View>

      <PreferencesCard palette={palette} isDarkMode={isDarkMode} onThemeChange={onThemeChange} />

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={19} color="#C82333" />
        <Text style={styles.logoutText}>Deconectare</Text>
      </TouchableOpacity>
    </>
  );
}

function ProfileInfoRow({
  icon,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.profileInfoRow}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.profileInfoText, { color }]}>{value}</Text>
    </View>
  );
}

function PreferencesCard({
  palette,
  isDarkMode,
  onThemeChange,
}: {
  palette: Palette;
  isDarkMode: boolean;
  onThemeChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Preferințe</Text>
      <View style={styles.preferenceRow}>
        <View style={[styles.actionIcon, { backgroundColor: palette.subtle }]}>
          <Ionicons
            name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
            size={19}
            color={palette.text}
          />
        </View>
        <Text style={[styles.actionLabel, { color: palette.text }]}>Mod Noapte / Zi</Text>
        <Switch
          accessibilityLabel="Mod Noapte / Zi"
          value={isDarkMode}
          onValueChange={onThemeChange}
          trackColor={{ false: '#CBD5E1', true: '#C82333' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

function ProfileEditModal({
  visible,
  palette,
  phone,
  location,
  category,
  error,
  onChangePhone,
  onChangeLocation,
  onChangeCategory,
  onClose,
  onSave,
}: {
  visible: boolean;
  palette: Palette;
  phone: string;
  location: string;
  category: string;
  error: string | null;
  onChangePhone: (value: string) => void;
  onChangeLocation: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.editModal, { backgroundColor: palette.surface }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Editare cont</Text>
              <Text style={[styles.modalSubtitle, { color: palette.muted }]}>Telefon, locație și categorie</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide editarea"
              style={[styles.closeButton, { backgroundColor: palette.subtle }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={palette.muted} />
            </TouchableOpacity>
          </View>

          <EditField
            label="Număr de telefon"
            value={phone}
            onChangeText={onChangePhone}
            palette={palette}
            keyboardType="phone-pad"
          />
          <EditField
            label="Locație"
            value={location}
            onChangeText={onChangeLocation}
            palette={palette}
          />
          <EditField
            label="Categorie"
            value={category}
            onChangeText={onChangeCategory}
            palette={palette}
          />
          {error && (
            <View style={styles.editError}>
              <Ionicons name="alert-circle-outline" size={17} color="#B91C1C" />
              <Text style={styles.editErrorText}>{error}</Text>
            </View>
          )}
          <Text style={[styles.localEditNote, { color: palette.muted }]}>
            Modificările sunt aplicate profilului afișat în această sesiune.
          </Text>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={onSave}>
            <Text style={styles.primaryButtonText}>Salvează modificările</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  palette,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  palette: Palette;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.editField}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={[
          styles.editInput,
          { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 36,
  },
  pageHeader: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: '#C82333',
  },
  welcomeIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  welcomeText: {
    marginTop: 7,
    color: '#FEE2E2',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 17,
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 2,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconTile: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  cardHeadingText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  cardDescription: {
    marginTop: 3,
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: '#C82333',
  },
  primaryButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 11,
    fontSize: 15,
    fontWeight: '800',
  },
  preferenceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  appInfoVersion: {
    marginTop: 4,
    fontSize: 12,
  },
  profileCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
  },
  profileBadges: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 7,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileName: {
    marginTop: 17,
    marginBottom: 11,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 8,
  },
  profileInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
  },
  logoutButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#E8A6AE',
    borderRadius: 12,
    backgroundColor: '#FFF7F7',
  },
  logoutText: {
    color: '#C82333',
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  feedbackText: {
    flex: 1,
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(15,23,42,0.48)',
  },
  editModal: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 20,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  editField: {
    gap: 6,
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  editInput: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
  },
  localEditNote: {
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 17,
  },
  editError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 10,
    padding: 10,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
  },
  editErrorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12,
    lineHeight: 17,
  },
});