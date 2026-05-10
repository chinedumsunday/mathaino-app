import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { apiAIChat, apiYoutubeSearch, apiAIYoutubeSuggest } from '../services/api';

const QUICK_PROMPTS_STUDENT = [
  'Explain this concept simply',
  'Give me a practice question',
  'Summarize the key points',
  'What should I focus on?',
];

const QUICK_PROMPTS_LECTURER = [
  'Generate quiz questions on this topic',
  'Suggest a lesson structure',
  'Give real-world examples',
  'Find YouTube resources',
];

function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 14 }]}>
      <View style={styles.dotsRow}>
        <View style={[styles.dot, { opacity: 0.4 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

function YouTubeCard({ videoId, title, channel, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.ytCard}>
      <View style={styles.ytThumb}>
        <Ionicons name="logo-youtube" size={22} color="#FF0000" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ytTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.ytChannel}>{channel}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={COLORS.t3} />
    </TouchableOpacity>
  );
}

export default function AIChatScreen({ route, navigation }) {
  const canGoBack = navigation.canGoBack();
  const { user } = useAuth();
  const courseTitle = route.params?.courseTitle;
  const role = user?.role || 'STUDENT';
  const isLecturer = ['LECTURER', 'FACULTY', 'SUPER_ADMIN'].includes(role);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: isLecturer
        ? `Hi! I'm your Lecture Assistant. I can help you create quiz questions, structure lessons, explain concepts clearly, and find YouTube resources for your students.\n\nWhat are you working on?`
        : `Hi! I'm your Study Assistant. I can explain concepts, help you understand course material, and suggest videos to watch.\n\nWhat do you need help with${courseTitle ? ` in ${courseTitle}` : ''}?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ytVideos, setYtVideos] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const flatRef = useRef(null);
  const history = useRef([]);

  const scrollToBottom = () => setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await apiAIChat(msg, history.current, courseTitle, role);
      const reply = res.data.reply;
      history.current = [...history.current, { role: 'user', content: msg }, { role: 'assistant', content: reply }].slice(-16);

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
      scrollToBottom();

      // Auto-fetch YouTube if message mentions video/watch/youtube or is a resource request
      const wantsVideo = /youtube|video|watch|resource|tutorial/i.test(msg + reply);
      if (wantsVideo && !ytLoading) {
        fetchYoutube(msg);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, courseTitle, role]);

  const fetchYoutube = async (topic) => {
    setYtLoading(true);
    setYtVideos([]);
    try {
      // Get AI-suggested search queries first
      const suggestRes = await apiAIYoutubeSuggest(topic).catch(() => ({ data: { queries: [topic] } }));
      const query = suggestRes.data?.queries?.[0] || topic;
      const res = await apiYoutubeSearch(query);
      if (res.data?.videos?.length) setYtVideos(res.data.videos.slice(0, 5));
    } catch (_) {}
    finally { setYtLoading(false); }
  };

  const quickPrompts = isLecturer ? QUICK_PROMPTS_LECTURER : QUICK_PROMPTS_STUDENT;

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#000" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble, item.error && styles.errorBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {canGoBack
          ? <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
            </TouchableOpacity>
          : <View style={{ width: 32 }} />
        }
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatarLarge}>
            <Ionicons name="sparkles" size={18} color="#000" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{isLecturer ? 'Lecture Assistant' : 'Study Assistant'}</Text>
            {courseTitle && <Text style={styles.headerSub}>{courseTitle}</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchYoutube(courseTitle || 'computer science')} style={styles.ytBtn}>
          <Ionicons name="logo-youtube" size={22} color="#FF0000" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListFooterComponent={loading ? <View style={styles.msgRow}><View style={styles.aiAvatar}><Ionicons name="sparkles" size={14} color="#000" /></View><TypingIndicator /></View> : null}
          onContentSizeChange={scrollToBottom}
        />

        {/* YouTube results panel */}
        {(ytVideos.length > 0 || ytLoading) && (
          <View style={styles.ytPanel}>
            <View style={styles.ytPanelHeader}>
              <Ionicons name="logo-youtube" size={14} color="#FF0000" />
              <Text style={styles.ytPanelTitle}>Related Videos</Text>
              <TouchableOpacity onPress={() => setYtVideos([])} style={{ marginLeft: 'auto' }}>
                <Ionicons name="close" size={16} color={COLORS.t3} />
              </TouchableOpacity>
            </View>
            {ytLoading
              ? <ActivityIndicator color={COLORS.accent} style={{ margin: 12 }} />
              : ytVideos.map(v => (
                <YouTubeCard
                  key={v.id}
                  videoId={v.id}
                  title={v.title}
                  channel={v.channel}
                  onPress={() => Linking.openURL(`https://youtube.com/watch?v=${v.id}`)}
                />
              ))
            }
          </View>
        )}

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickRow}>
            {quickPrompts.map(p => (
              <TouchableOpacity key={p} onPress={() => send(p)} style={styles.quickChip}>
                <Text style={styles.quickChipText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={isLecturer ? 'Ask about lesson planning, quiz ideas...' : 'Ask anything about your studies...'}
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatarLarge: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.t1 },
  headerSub: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
  ytBtn: { padding: 4 },
  messageList: { paddingHorizontal: SPACING.xl, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', borderRadius: RADIUS.lg, padding: 12 },
  aiBubble: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  userBubble: { backgroundColor: COLORS.accent },
  errorBubble: { backgroundColor: COLORS.red + '22', borderColor: COLORS.red + '44' },
  bubbleText: { fontSize: 14, color: COLORS.t1, lineHeight: 20 },
  userBubbleText: { color: '#000' },
  dotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  ytPanel: { backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, maxHeight: 220 },
  ytPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  ytPanelTitle: { fontSize: 12, fontWeight: FONT.bold, color: COLORS.t1 },
  ytCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '80' },
  ytThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FF000018', alignItems: 'center', justifyContent: 'center' },
  ytTitle: { fontSize: 12, fontWeight: FONT.medium, color: COLORS.t1, lineHeight: 16 },
  ytChannel: { fontSize: 10, color: COLORS.t3, marginTop: 2 },
  quickRow: { flexWrap: 'wrap', flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, paddingBottom: 8 },
  quickChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent + '50', backgroundColor: COLORS.accent + '10' },
  quickChipText: { fontSize: 11, color: COLORS.accent, fontWeight: FONT.medium },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.t1, fontSize: 13, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
