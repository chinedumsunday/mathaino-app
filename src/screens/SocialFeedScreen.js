import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Linking, KeyboardAvoidingView,
  Platform, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import {
  apiGetFeed, apiCreatePost, apiDeletePost, apiToggleLike,
  apiGetComments, apiAddComment, apiDeleteComment, apiYoutubeSearch,
} from '../services/api';

const ROLE_COLOR = {
  STUDENT: COLORS.blue,
  LECTURER: COLORS.teal,
  FACULTY: COLORS.orange,
  SUPER_ADMIN: COLORS.pink,
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function isInstagramUrl(url) {
  return url && /instagram\.com\/(p|reel|tv)\//i.test(url);
}

function InstagramCard({ url }) {
  return (
    <TouchableOpacity style={styles.igCard} onPress={() => Linking.openURL(url)}>
      <View style={styles.igIconWrap}>
        <Ionicons name="logo-instagram" size={26} color="#E1306C" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.igLabel}>Instagram Post</Text>
        <Text style={styles.igUrl} numberOfLines={1}>{url}</Text>
        <Text style={styles.igTap}>Tap to view on Instagram</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={COLORS.t3} />
    </TouchableOpacity>
  );
}

function YouTubeCard({ videoId }) {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(`https://youtube.com/watch?v=${videoId}`)}
      style={styles.ytCard}
    >
      <View style={styles.ytThumb}>
        <Ionicons name="logo-youtube" size={28} color="#FF0000" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ytLabel}>YouTube Video</Text>
        <Text style={styles.ytId} numberOfLines={1}>{videoId}</Text>
        <Text style={styles.ytTap}>Tap to watch</Text>
      </View>
    </TouchableOpacity>
  );
}

function PostCard({ post, currentUser, onLike, onDelete, navigation }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState(post.comments || []);
  const [commentText, setCommentText]   = useState('');
  const [posting, setPosting]           = useState(false);
  const [liked, setLiked]               = useState(post.likedByMe);
  const [likeCount, setLikeCount]       = useState(post._count?.likes || 0);

  const authorName = `${post.user?.firstName} ${post.user?.lastName}`.trim();
  const isOwner = post.userId === currentUser?.id ||
    ['FACULTY', 'SUPER_ADMIN'].includes(currentUser?.role);

  const handleLike = async () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try { await onLike(post.id); }
    catch (_) { setLiked(l => !l); setLikeCount(c => liked ? c + 1 : c - 1); }
  };

  const handleLoadComments = async () => {
    if (!showComments) {
      try {
        const res = await apiGetComments(post.id);
        setComments(res.data.comments || []);
      } catch (_) {}
    }
    setShowComments(s => !s);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await apiAddComment(post.id, commentText.trim());
      setComments(c => [...c, res.data.comment]);
      setCommentText('');
    } catch (_) {}
    finally { setPosting(false); }
  };

  const handleDeleteComment = async (cid) => {
    try {
      await apiDeleteComment(cid);
      setComments(c => c.filter(x => x.id !== cid));
    } catch (_) {}
  };

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('UserDetail', { userId: post.userId })}>
          <Avatar size={38} name={authorName} color={ROLE_COLOR[post.user?.role] || COLORS.blue} url={post.user?.avatarUrl} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.postAuthor}>{authorName}</Text>
          <View style={styles.postMeta}>
            <Badge
              label={post.user?.role === 'FACULTY' ? 'Admin' : (post.user?.role?.charAt(0) + post.user?.role?.slice(1).toLowerCase())}
              color={ROLE_COLOR[post.user?.role] || COLORS.blue}
            />
            <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => onDelete(post.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.t3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body text */}
      {!!post.body && <Text style={styles.postBody}>{post.body}</Text>}

      {/* Photo */}
      {!!post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* YouTube */}
      {!!post.youtubeId && <YouTubeCard videoId={post.youtubeId} />}

      {/* Instagram */}
      {!!post.instagramUrl && <InstagramCard url={post.instagramUrl} />}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#E1306C' : COLORS.t3} />
          <Text style={[styles.actionCount, liked && { color: '#E1306C' }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLoadComments} style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.t3} />
          <Text style={styles.actionCount}>{post._count?.comments || comments.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {comments.map(c => (
            <View key={c.id} style={styles.commentRow}>
              <Avatar size={24} name={`${c.user?.firstName} ${c.user?.lastName}`} color={ROLE_COLOR[c.user?.role] || COLORS.blue} />
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>{c.user?.firstName} {c.user?.lastName}</Text>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
              {(c.userId === currentUser?.id || ['FACULTY', 'SUPER_ADMIN'].includes(currentUser?.role)) && (
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                  <Ionicons name="close-circle-outline" size={14} color={COLORS.t3} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.commentInput}>
            <Avatar size={24} name={`${currentUser?.firstName} ${currentUser?.lastName}`} color={COLORS.accent} />
            <TextInput
              style={styles.commentTextInput}
              placeholder="Write a comment..."
              placeholderTextColor="#555"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleAddComment}
            />
            <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim() || posting}>
              <Ionicons name="send" size={16} color={commentText.trim() ? COLORS.accent : COLORS.t3} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function SocialFeedScreen({ navigation }) {
  const canGoBack = navigation.canGoBack();
  const { user } = useAuth();

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Compose state
  const [newPost, setNewPost]             = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { uri, base64 }
  const [igUrl, setIgUrl]                 = useState('');
  const [showIgInput, setShowIgInput]     = useState(false);
  const [posting, setPosting]             = useState(false);
  const [postError, setPostError]         = useState('');

  // YouTube modal
  const [ytQuery, setYtQuery]           = useState('');
  const [ytVideos, setYtVideos]         = useState([]);
  const [ytSearching, setYtSearching]   = useState(false);
  const [ytModal, setYtModal]           = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [ytNotConfigured, setYtNotConfigured] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGetFeed();
      setPosts(res.data.posts || []);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const pickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedImage({ uri: `data:image/jpeg;base64,${asset.base64}` });
      }
    } catch (_) {}
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !selectedVideo && !selectedImage && !igUrl.trim()) || posting) return;
    if (igUrl.trim() && !isInstagramUrl(igUrl.trim())) {
      setPostError('Please enter a valid Instagram post URL (e.g. https://instagram.com/p/...)');
      return;
    }
    setPosting(true);
    setPostError('');
    try {
      const res = await apiCreatePost(
        newPost.trim(),
        selectedVideo?.id || null,
        selectedImage?.uri || null,
        igUrl.trim() || null,
      );
      setPosts(p => [res.data.post, ...p]);
      setNewPost('');
      setSelectedVideo(null);
      setSelectedImage(null);
      setIgUrl('');
      setShowIgInput(false);
    } catch (e) {
      setPostError(e.message || 'Could not post.');
    } finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeletePost(id);
      setPosts(p => p.filter(x => x.id !== id));
    } catch (_) {}
  };

  const handleLike = (id) => apiToggleLike(id);

  const searchYoutube = async () => {
    if (!ytQuery.trim()) return;
    setYtSearching(true);
    setYtVideos([]);
    try {
      const res = await apiYoutubeSearch(ytQuery.trim());
      setYtVideos(res.data.videos || []);
      setYtNotConfigured(!res.data.configured);
    } catch (_) {}
    finally { setYtSearching(false); }
  };

  const attachVideo = (video) => {
    setSelectedVideo(video);
    setYtModal(false);
    setYtVideos([]);
    setYtQuery('');
  };

  const hasContent = newPost.trim() || selectedVideo || selectedImage || igUrl.trim();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack
          ? <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
            </TouchableOpacity>
          : <View style={{ width: 32 }} />
        }
        <Text style={styles.title}>Learning Feed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AIChat')} style={styles.aiBtn}>
          <Ionicons name="sparkles" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Compose area */}
      <View style={styles.composeCard}>
        <Avatar size={36} name={`${user?.firstName} ${user?.lastName}`} color={COLORS.accent} url={user?.avatarUrl} />
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.composeInput}
            placeholder="Share something with your peers..."
            placeholderTextColor="#555"
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
          />

          {/* Selected image preview */}
          {selectedImage && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* YouTube attachment */}
          {selectedVideo && (
            <View style={styles.attachedVideo}>
              <Ionicons name="logo-youtube" size={14} color="#FF0000" />
              <Text style={styles.attachedTitle} numberOfLines={1}>{selectedVideo.title}</Text>
              <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                <Ionicons name="close-circle" size={14} color={COLORS.t3} />
              </TouchableOpacity>
            </View>
          )}

          {/* Instagram URL input */}
          {showIgInput && (
            <View style={styles.igInputRow}>
              <Ionicons name="logo-instagram" size={16} color="#E1306C" />
              <TextInput
                style={styles.igTextInput}
                placeholder="Paste Instagram post URL..."
                placeholderTextColor="#555"
                value={igUrl}
                onChangeText={setIgUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              {!!igUrl && (
                <TouchableOpacity onPress={() => { setIgUrl(''); setShowIgInput(false); }}>
                  <Ionicons name="close-circle" size={14} color={COLORS.t3} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action row */}
          <View style={styles.composeActions}>
            <View style={styles.attachBtns}>
              {/* Photo */}
              <TouchableOpacity onPress={pickPhoto} style={styles.attachBtn}>
                <Ionicons name="image-outline" size={18} color={COLORS.teal} />
              </TouchableOpacity>
              {/* YouTube */}
              <TouchableOpacity onPress={() => setYtModal(true)} style={styles.attachBtn}>
                <Ionicons name="logo-youtube" size={18} color="#FF0000" />
              </TouchableOpacity>
              {/* Instagram */}
              <TouchableOpacity onPress={() => setShowIgInput(s => !s)} style={styles.attachBtn}>
                <Ionicons name="logo-instagram" size={18} color="#E1306C" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handlePost}
              disabled={!hasContent || posting}
              style={[styles.postBtn, (!hasContent || posting) && { opacity: 0.4 }]}
            >
              {posting
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.postBtnText}>Post</Text>
              }
            </TouchableOpacity>
          </View>
          {!!postError && <Text style={styles.postErrorText}>{postError}</Text>}
        </View>
      </View>

      {/* Feed */}
      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDelete}
              navigation={navigation}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          contentContainerStyle={styles.feedContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-circle-outline" size={48} color={COLORS.t3} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Be the first to share something!</Text>
            </View>
          }
        />
      )}

      {/* YouTube search modal */}
      <Modal visible={ytModal} transparent animationType="slide" onRequestClose={() => setYtModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.ytModalOverlay}>
          <View style={styles.ytModalSheet}>
            <View style={styles.ytModalHandle} />
            <Text style={styles.ytModalTitle}>Search YouTube</Text>
            <View style={styles.ytSearchRow}>
              <TextInput
                style={styles.ytSearchInput}
                placeholder="Search for educational videos..."
                placeholderTextColor="#555"
                value={ytQuery}
                onChangeText={setYtQuery}
                onSubmitEditing={searchYoutube}
                autoFocus
              />
              <TouchableOpacity onPress={searchYoutube} style={styles.ytSearchBtn} disabled={ytSearching}>
                {ytSearching
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Ionicons name="search" size={18} color="#000" />
                }
              </TouchableOpacity>
            </View>
            {ytNotConfigured && (
              <Text style={styles.ytNotConfigText}>YouTube search is not configured yet.</Text>
            )}
            <ScrollView>
              {ytVideos.map(v => (
                <TouchableOpacity key={v.id} onPress={() => attachVideo(v)} style={styles.ytResultRow}>
                  <View style={styles.ytResultThumb}>
                    <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ytResultTitle} numberOfLines={2}>{v.title}</Text>
                    <Text style={styles.ytResultChannel}>{v.channel} · {v.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setYtModal(false)} style={styles.ytModalCancel}>
              <Text style={styles.ytModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
  aiBtn: { padding: 4 },

  composeCard: {
    flexDirection: 'row', gap: 12,
    marginHorizontal: SPACING.xl, marginBottom: 12,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 12,
  },
  composeInput: { color: COLORS.t1, fontSize: 13, minHeight: 40, maxHeight: 100 },

  previewWrap: { marginTop: 8, position: 'relative', alignSelf: 'flex-start' },
  imagePreview: { width: 120, height: 120, borderRadius: RADIUS.md },
  removePreview: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
  },

  attachedVideo: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: '#FF000010', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8,
  },
  attachedTitle: { flex: 1, fontSize: 11, color: COLORS.t2 },

  igInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: '#E1306C10', borderRadius: RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  igTextInput: { flex: 1, color: COLORS.t1, fontSize: 12 },

  composeActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  attachBtns: { flexDirection: 'row', gap: 12 },
  attachBtn: { padding: 4 },
  postBtn: { backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 18, borderRadius: 10 },
  postBtnText: { fontSize: 13, fontWeight: FONT.bold, color: '#000' },
  postErrorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },

  feedContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },

  postCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, marginBottom: 10,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAuthor: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  postTime: { fontSize: 10, color: COLORS.t3 },
  deleteBtn: { padding: 4 },
  postBody: { fontSize: 13, color: COLORS.t1, lineHeight: 20, marginBottom: 10 },
  postImage: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: 10 },

  igCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E1306C10', borderRadius: RADIUS.md,
    padding: 10, marginBottom: 10,
  },
  igIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#E1306C20', alignItems: 'center', justifyContent: 'center',
  },
  igLabel: { fontSize: 10, color: COLORS.t3, textTransform: 'uppercase', letterSpacing: 0.5 },
  igUrl: { fontSize: 11, color: COLORS.t2, marginTop: 2 },
  igTap: { fontSize: 10, color: '#E1306C', marginTop: 4 },

  ytCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF000010', borderRadius: RADIUS.md,
    padding: 10, marginBottom: 10,
  },
  ytThumb: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#FF000020', alignItems: 'center', justifyContent: 'center',
  },
  ytLabel: { fontSize: 10, color: COLORS.t3, textTransform: 'uppercase', letterSpacing: 0.5 },
  ytId: { fontSize: 11, color: COLORS.t2, marginTop: 2 },
  ytTap: { fontSize: 10, color: COLORS.accent, marginTop: 4 },

  postActions: {
    flexDirection: 'row', gap: 20, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 12, color: COLORS.t3 },

  commentsSection: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8,
  },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  commentBubble: { flex: 1, backgroundColor: '#111', borderRadius: RADIUS.md, padding: 8 },
  commentAuthor: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.t2, marginBottom: 2 },
  commentBody: { fontSize: 12, color: COLORS.t1, lineHeight: 17 },
  commentInput: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentTextInput: {
    flex: 1, backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: 10, paddingVertical: 7, color: COLORS.t1, fontSize: 12,
  },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
  emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4, textAlign: 'center' },

  ytModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  ytModalSheet: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SPACING.xl, maxHeight: '85%',
  },
  ytModalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  ytModalTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 14 },
  ytSearchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ytSearchInput: {
    flex: 1, backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, color: COLORS.t1, fontSize: 13,
  },
  ytSearchBtn: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  ytResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  ytResultThumb: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center',
  },
  ytResultTitle: { fontSize: 12, fontWeight: FONT.medium, color: COLORS.t1, lineHeight: 16 },
  ytResultChannel: { fontSize: 10, color: COLORS.t3, marginTop: 2 },
  ytModalCancel: { alignItems: 'center', paddingVertical: 16 },
  ytModalCancelText: { fontSize: 14, color: COLORS.t3 },
  ytNotConfigText: { fontSize: 11, color: COLORS.t3, marginBottom: 10, textAlign: 'center' },
});
