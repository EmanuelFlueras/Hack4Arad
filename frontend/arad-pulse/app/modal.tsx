import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

type AuthMode = 'login' | 'register';
type FormIcon = keyof typeof Ionicons.glyphMap;

export default function ModalScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setNotice(null);
    if (!phone.trim() || !password) {
      setError('Introdu numărul de telefon și parola.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(phone.trim(), password);
      setError(null);
      setNotice('Autentificare reușită. Bine ai revenit!');
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Autentificarea a eșuat.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setNotice(null);
    if (!name.trim() || !phone.trim() || !location.trim() || !password) {
      setError('Completează numele, telefonul, localitatea și parola.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        location: location.trim(),
        category: category.trim() || undefined,
      });
      setError(null);
      setPassword('');
      setNotice('Cererea a fost trimisă către administrator! Vei fi contactat după aprobare.');
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Trimiterea cererii a eșuat.');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    if (nextMode === 'register') {
      setNotice(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.brandMark}>
              <Ionicons name="storefront-outline" size={22} color="#C82333" />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={21} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Arad Pulse</Text>
          <Text style={styles.subtitle}>Intră în comunitatea producătorilor locali.</Text>

          <View style={styles.segmentedControl}>
            <ModeButton
              label="Intră în cont"
              selected={mode === 'login'}
              onPress={() => changeMode('login')}
            />
            <ModeButton
              label="Solicită Cont"
              selected={mode === 'register'}
              onPress={() => changeMode('register')}
            />
          </View>

          {notice && (
            <View style={styles.noticeBanner}>
              <Ionicons name="checkmark-circle" size={19} color="#047857" />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={19} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {mode === 'register' && (
              <FormField
                label="Nume / Denumire afacere"
                placeholder="Ex. Brutăria Pecica"
                icon="person-outline"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}

            <FormField
              label="Număr de telefon"
              placeholder="07xx xxx xxx"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType={mode === 'login' ? 'next' : 'next'}
            />

            {mode === 'register' && (
              <>
                <FormField
                  label="Localitate / Adresă în Arad"
                  placeholder="Ex. Pecica, județul Arad"
                  icon="location-outline"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <FormField
                  label="Categorie"
                  placeholder="Panificație, vinificație etc."
                  icon="pricetag-outline"
                  value={category}
                  onChangeText={setCategory}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />
              </>
            )}

            <FormField
              label="Parolă"
              placeholder="Introdu parola"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              returnKeyType="done"
              onSubmitEditing={() => void (mode === 'login' ? handleLogin() : handleRegister())}
            />

            <TouchableOpacity
              accessibilityRole="button"
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={() => void (mode === 'login' ? handleLogin() : handleRegister())}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {mode === 'login' ? 'Autentificare' : 'Trimite cererea către administrator'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#64748B" />
            <Text style={styles.footerText}>Conturile de producător sunt aprobate de administrator.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.modeButton, selected && styles.selectedModeButton]}
      onPress={onPress}
    >
      <Text style={[styles.modeText, selected && styles.selectedModeText]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface FormFieldProps extends Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'keyboardType'
  | 'onSubmitEditing'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'textContentType'
> {
  label: string;
  placeholder: string;
  icon: FormIcon;
  value: string;
  onChangeText: (value: string) => void;
}

function FormField({ label, placeholder, icon, value, onChangeText, ...inputProps }: FormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = inputProps.secureTextEntry === true;

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={19} color="#64748B" />
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !isPasswordVisible}
          style={styles.input}
        />
        {isPassword && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ascunde parola' : 'Arată parola'}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
  },
  title: {
    marginTop: 18,
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 22,
    padding: 4,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
  },
  modeButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  selectedModeButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  modeText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedModeText: {
    color: '#C82333',
    fontWeight: '700',
  },
  form: {
    marginTop: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#C82333',
  },
  disabledButton: {
    opacity: 0.75,
  },
  primaryButtonText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 18,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  noticeText: {
    flex: 1,
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
});
