import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Clipboard,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthenticatorBridge from 'authenticator-bridge';

const { width } = Dimensions.get('window');

interface Token {
  id: string;
  label: string;
  secret: string;
}

const STORAGE_KEY = '@authenticator_tokens';

export default function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newSecret, setNewSecret] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(1)).current;

  // Load tokens on mount
  useEffect(() => {
    loadTokens();
  }, []);

  // Update codes and timer
  useEffect(() => {
    const update = async () => {
      const sec = Math.floor(Date.now() / 1000);
      const remaining = 30 - (sec % 30);
      setTimeLeft(remaining);

      // If at boundary or codes are empty, refresh them
      if (remaining === 30 || Object.keys(codes).length !== tokens.length) {
        await refreshAllCodes(tokens);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tokens, codes]);

  // Smooth progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: timeLeft / 30,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const loadTokens = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const loaded: Token[] = JSON.parse(data);
        setTokens(loaded);
        await refreshAllCodes(loaded);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load accounts.');
    }
  };

  const saveTokens = async (updated: Token[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setTokens(updated);
      await refreshAllCodes(updated);
    } catch (e) {
      Alert.alert('Error', 'Failed to save accounts.');
    }
  };

  const refreshAllCodes = async (tokenList: Token[]) => {
    const nextCodes: Record<string, string> = {};
    for (const token of tokenList) {
      try {
        const rawCode = await AuthenticatorBridge.getTOTP(token.secret);
        nextCodes[token.id] = rawCode;
      } catch (err) {
        nextCodes[token.id] = '000000';
      }
    }
    setCodes(nextCodes);
  };

  const handleAddToken = async () => {
    if (!newLabel.trim() || !newSecret.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Clean secret: remove spaces and hyphens, uppercase
    const cleanedSecret = newSecret.replace(/[\s-]/g, '').toUpperCase();

    if (cleanedSecret.length === 0) {
      Alert.alert('Error', 'Invalid secret key.');
      return;
    }

    // Quick verification check
    try {
      await AuthenticatorBridge.getTOTP(cleanedSecret);
    } catch (e) {
      Alert.alert('Error', 'Invalid Base32 secret key format.');
      return;
    }

    const newToken: Token = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      secret: cleanedSecret,
    };

    const updated = [...tokens, newToken];
    await saveTokens(updated);

    // Reset form
    setNewLabel('');
    setNewSecret('');
    setIsModalVisible(false);
  };

  const handleDeleteToken = (id: string, label: string) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = tokens.filter((t) => t.id !== id);
            await saveTokens(updated);
            const nextCodes = { ...codes };
            delete nextCodes[id];
            setCodes(nextCodes);
          },
        },
      ]
    );
  };

  const handleCopyCode = (id: string, code: string) => {
    Clipboard.setString(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDisplayCode = (code: string) => {
    if (!code || code.length !== 6) return '000 000';
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return '#EF4444'; // Red
    if (timeLeft <= 10) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>🔐 KRYPTOS</Text>
          <Text style={styles.subtitle}>C++ TOTP Engine App</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <View style={styles.timerLabelRow}>
          <Text style={styles.timerText}>Codes update in</Text>
          <Text style={[styles.timerSec, { color: getTimerColor() }]}>
            {timeLeft}s
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getTimerColor(),
              },
            ]}
          />
        </View>
      </View>

      {/* Account List */}
      {tokens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No accounts added yet.</Text>
          <Text style={styles.emptySubtext}>
            Tap the "+" icon at the top right to secure your first account.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tokens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const rawCode = codes[item.id] || '000000';
            const displayCode = formatDisplayCode(rawCode);
            const isCopied = copiedId === item.id;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleCopyCode(item.id, rawCode)}
                activeOpacity={0.8}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardCode}>{displayCode}</Text>
                </View>

                <View style={styles.cardActionRow}>
                  {isCopied ? (
                    <Text style={styles.copiedText}>Copied!</Text>
                  ) : (
                    <Text style={styles.tapToCopyText}>Tap to copy</Text>
                  )}

                  <TouchableOpacity
                    onPress={() => handleDeleteToken(item.id, item.label)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Add Token Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Account</Text>

            <Text style={styles.inputLabel}>Account Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GitHub: username"
              placeholderTextColor="#4B5563"
              value={newLabel}
              onChangeText={setNewLabel}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Secret Key (Base32)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. JBSWY3DPEHPK3PXP"
              placeholderTextColor="#4B5563"
              value={newSecret}
              onChangeText={setNewSecret}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddToken}
              >
                <Text style={styles.saveButtonText}>Save Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F3F4F6',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -2,
  },
  timerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  timerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timerSec: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2937',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  cardCode: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
    color: '#F9FAFB',
    letterSpacing: 2,
  },
  cardActionRow: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  tapToCopyText: {
    fontSize: 11,
    color: '#6B7280',
  },
  copiedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#E5E7EB',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F8FAFC',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1E293B',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
