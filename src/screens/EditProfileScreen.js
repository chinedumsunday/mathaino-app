import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Input, Button, Toast, useToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function EditProfileScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    dept: user?.dept || '',
    level: user?.level || '',
    avatarUrl: user?.avatarUrl || null,
  });
  const [error, setError] = useState('');
  const [avatarModal, setAvatarModal] = useState(false);
  const { toast, showToast } = useToast();

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    setAvatarModal(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Gallery permission is needed to change your avatar.', 'error');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
        update('avatarUrl', dataUrl);
      }
    } catch {
      showToast('Could not open image picker.', 'error');
    }
  };

  const handleSave = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    try {
      await updateUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl,
      });
      showToast('Profile saved successfully ✓', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    } catch {
      showToast('Saved locally — will sync when back online.', 'info');
      setTimeout(() => navigation.goBack(), 1500);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    saveBtn: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.accent },
    scrollContent: { paddingHorizontal: SPACING.xxl },
    avatarWrap: { alignItems: 'center', marginBottom: 28 },
    cameraIcon: { position: 'absolute', bottom: 20, right: '35%', width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg },
    changeText: { fontSize: 12, color: COLORS.accent, fontWeight: FONT.semibold, marginTop: 8 },
    label: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4, marginLeft: 2 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.md, padding: 12, marginBottom: 14 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    avatarSheet: { backgroundColor: '#1C1C1C', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34 },
    sheetTitle: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 16, textAlign: 'center' },
    sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sheetOptionText: { fontSize: 14, color: COLORS.t1 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Avatar choice modal */}
      <Modal visible={avatarModal} transparent animationType="fade" onRequestClose={() => setAvatarModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAvatarModal(false)}>
          <View style={styles.avatarSheet}>
            <Text style={styles.sheetTitle}>Change Photo</Text>
            <TouchableOpacity style={styles.sheetOption} onPress={pickImage}>
              <Ionicons name="images-outline" size={20} color={COLORS.accent} />
              <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={() => { update('avatarUrl', null); setAvatarModal(false); }}>
              <Ionicons name="trash-outline" size={20} color={COLORS.red} />
              <Text style={[styles.sheetOptionText, { color: COLORS.red }]}>Remove Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={() => setAvatarModal(false)}>
              <Text style={[styles.sheetOptionText, { color: COLORS.t3 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setAvatarModal(true)} style={styles.avatarWrap}>
          <Avatar size={80} url={form.avatarUrl} name={`${form.firstName} ${form.lastName}`} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#000" />
          </View>
          <Text style={styles.changeText}>Change Photo</Text>
        </TouchableOpacity>

        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>First Name</Text>
        <Input placeholder="First Name" value={form.firstName} onChangeText={v => { update('firstName', v); setError(''); }} />

        <Text style={styles.label}>Last Name</Text>
        <Input placeholder="Last Name" value={form.lastName} onChangeText={v => { update('lastName', v); setError(''); }} />

        <Text style={styles.label}>Email</Text>
        <Input placeholder="Email" type="email" value={form.email} onChangeText={v => update('email', v)} />

        <Text style={styles.label}>Phone</Text>
        <Input placeholder="Phone number" type="phone" value={form.phone} onChangeText={v => update('phone', v)} />

        <Text style={styles.label}>Bio</Text>
        <Input placeholder="Tell us about yourself..." multiline rows={3} value={form.bio} onChangeText={v => update('bio', v)} />

        <Text style={styles.label}>Department</Text>
        <Input placeholder="Department" value={form.dept} onChangeText={v => update('dept', v)} />

        <Text style={styles.label}>Level</Text>
        <Input placeholder="Level (e.g. 400)" value={form.level} onChangeText={v => update('level', v)} />

        <View style={{ height: 12 }} />
        <Button onPress={handleSave}>Save Changes</Button>
        <View style={{ height: 10 }} />
        <Button variant="secondary" onPress={() => navigation.goBack()}>Cancel</Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

