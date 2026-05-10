import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../utils/theme';
import { Card } from '../components/UI';

const FAQ = [
  { q: 'How do I enroll in a course?', a: 'Go to Browse Courses, find a course and tap "Enroll Now — Free". You will have immediate access to all content.' },
  { q: 'How do I submit an assignment?', a: 'Open the lesson, scroll to the assignment form, type your answer or paste a file link (Google Drive, Dropbox, etc.), then tap Submit.' },
  { q: 'How do I take a quiz?', a: 'Open a Quiz lesson, answer all multiple-choice questions, then tap "Submit Quiz". You need 60% to pass. You can retry any number of times.' },
  { q: 'How do I earn a certificate?', a: 'Complete all lessons in a course (100% progress). Your certificate is automatically generated and appears in the course page and under My Certificates.' },
  { q: 'How do I add a video lecture?', a: 'Upload your video to YouTube, Google Drive, or any hosting service. Copy the shareable link. When adding a lesson, select type "Video" and paste the link. Students tap "Watch Video" to open it.' },
  { q: 'Why is my account showing as Pending?', a: 'All accounts are activated automatically. If you see "Pending", please contact admin at support@mathaino.app.' },
  { q: 'How do I publish a course so students can see it?', a: 'Open the course from My Courses tab. At the top of the course page you will see a "Draft" banner with a Publish button. Tap it to make the course visible to students.' },
];

export default function HelpSupportScreen({ navigation }) {
  const [expanded, setExpanded] = React.useState(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 40 }}>
        {/* Contact card */}
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={24} color={COLORS.accent} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactSub}>support@mathaino.app</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@mathaino.app')}>
            <Ionicons name="open-outline" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Mathaino v1.0.0</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.versionText}>All systems online</Text>
        </View>

        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>

        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setExpanded(expanded === i ? null : i)}
            style={[styles.faqItem, i === FAQ.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons
                name={expanded === i ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.t3}
              />
            </View>
            {expanded === i && (
              <Text style={styles.faqA}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  contactTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1 },
  contactSub: { fontSize: 12, color: COLORS.t3, marginTop: 2 },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  versionText: { fontSize: 11, color: COLORS.t3 },
  sectionLabel: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.t3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 14 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1, flex: 1, lineHeight: 20 },
  faqA: { fontSize: 12, color: COLORS.t2, lineHeight: 20, marginTop: 10 },
});
