import React from 'react';
import { NavigationContainer, DefaultTheme, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING, RADIUS, progressColor } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { Card, ProgressBar, Chip, Avatar, Badge, StatusDot } from '../components/UI';
import {
  apiMyEnrollments, apiMyCourses,
} from '../services/api';

// ═══ ALL SCREEN IMPORTS ═══
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonScreen from '../screens/LessonScreen';
import BrowseScreen from '../screens/BrowseScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FocusScreen from '../screens/FocusScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import CourseBuilderScreen from '../screens/CourseBuilderScreen';
import CreateLecturerScreen from '../screens/CreateLecturerScreen';
import PendingStudentsScreen from '../screens/PendingStudentsScreen';
import CertificateScreen from '../screens/CertificateScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import CreateStudentScreen from '../screens/CreateStudentScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import MyCertificatesScreen from '../screens/MyCertificatesScreen';
import AIChatScreen from '../screens/AIChatScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import ScheduleLiveClassScreen from '../screens/ScheduleLiveClassScreen';

// ═══ COURSES TAB (role-aware) ═══
function CoursesScreen({ navigation }) {
  const { isStudent, canCreateCourses } = useAuth();
  const [filter, setFilter] = React.useState('All');
  const [items, setItems] = React.useState([]);   // enrollments (student) or courses (creator)
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      if (isStudent) {
        const res = await apiMyEnrollments();
        setItems(res.data.enrollments || []);
      } else {
        const res = await apiMyCourses();
        // Normalise into the same shape so one renderItem handles both
        setItems((res.data.courses || []).map(c => ({ id: c.id, progress: 0, isCourse: true, course: c })));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isStudent]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));
  const onRefresh = () => { setRefreshing(true); load(); };

  const courseEmoji = (code = '') => {
    if (code.includes('DB') || code.includes('4')) return '📊';
    if (code.includes('ML') || code.includes('AI')) return '🤖';
    if (code.includes('SE')) return '⚙️';
    return '🌐';
  };

  const filtered = filter === 'All' ? items
    : filter === 'In Progress' ? items.filter(e => (e.progress || 0) > 0 && (e.progress || 0) < 100)
    : items.filter(e => (e.progress || 0) >= 90);

  const tabTitle = isStudent ? 'My Courses' : 'My Courses';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.topBar}>
        <Text style={s.topTitle}>{tabTitle}</Text>
        {isStudent
          ? <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={{ color: COLORS.silver, fontSize: 12 }}>Browse →</Text>
            </TouchableOpacity>
          : <TouchableOpacity onPress={() => navigation.navigate('CourseBuilder')}>
              <Text style={{ color: COLORS.accent, fontSize: 12 }}>+ Create</Text>
            </TouchableOpacity>
        }
      </View>

      {isStudent && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 18 }}>
          {['All', 'In Progress', 'Completed'].map(f => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={isStudent ? filtered : items}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name={isStudent ? 'book-outline' : 'briefcase-outline'} size={40} color={COLORS.t3} />
              <Text style={{ color: COLORS.t3, marginTop: 12, fontSize: 14 }}>
                {isStudent ? 'No courses yet.' : 'No courses created yet.'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(isStudent ? 'Browse' : 'CourseBuilder')}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: COLORS.accent, fontSize: 13 }}>
                  {isStudent ? 'Browse courses →' : 'Create your first course →'}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const c = item.course;
            const creatorName = c?.creator ? `${c.creator.firstName} ${c.creator.lastName}`.trim() : 'Lecturer';
            return (
              <Card
                onPress={() => navigation.navigate('CourseDetail', { courseId: c?.id })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Text style={{ fontSize: 36 }}>{courseEmoji(c?.code)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.t1, marginBottom: 2 }}>{c?.title}</Text>
                  {isStudent ? (
                    <>
                      <Text style={{ fontSize: 11, color: COLORS.t3, marginBottom: 8 }}>{creatorName} • {c?._count?.modules || 0} modules</Text>
                      <ProgressBar value={item.progress || 0} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                        <Text style={{ fontSize: 11, color: progressColor(item.progress || 0), fontWeight: '700' }}>{Math.round(item.progress || 0)}%</Text>
                        <Badge label={(item.progress || 0) >= 85 ? 'Almost done!' : (item.progress || 0) >= 50 ? 'Good progress' : 'Keep going!'} color={progressColor(item.progress || 0)} />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 11, color: COLORS.t3 }}>{c?.code} • {c?._count?.enrollments || 0} students • {c?._count?.modules || 0} modules</Text>
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: c?.isPublished ? COLORS.teal + '20' : '#1A1A1A' }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: c?.isPublished ? COLORS.teal : COLORS.t3 }}>
                            {c?.isPublished ? 'Published' : 'Draft'}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ═══ CHAT TAB — delegates to full AIChatScreen ═══
function ChatScreen({ navigation }) {
  return <AIChatScreen navigation={navigation} route={{ params: {} }} />;
}

// ═══ SOCIAL TAB — delegates to full SocialFeedScreen ═══
function SocialScreen({ navigation }) {
  return <SocialFeedScreen navigation={navigation} />;
}

// ═══ NAVIGATORS ═══
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.bg, card: COLORS.bg, text: COLORS.t1, border: COLORS.border, primary: COLORS.accent },
};

function MainTabs() {
  const { isStudent, isFaculty, isAdmin } = useAuth();
  const isManagement = isFaculty || isAdmin;

  // Icon map including role-specific tabs
  const ICONS = {
    HomeTab:    'home',
    CoursesTab: isStudent ? 'book' : 'briefcase',
    ChatTab:    'chatbubble-ellipses',
    SocialTab:  'play-circle',
    AdminTab:   'grid',
    ProfileTab: 'person',
  };

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: COLORS.bg, borderTopColor: COLORS.border, borderTopWidth: 1, height: 68, paddingBottom: 8, paddingTop: 6 },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: '#555',
      tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      tabBarIcon: ({ focused, color }) => {
        const base = ICONS[route.name] || 'ellipse';
        return <Ionicons name={focused ? base : base + '-outline'} size={22} color={color} />;
      },
    })}>
      <Tab.Screen name="HomeTab"    component={HomeScreen}    options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="CoursesTab" component={CoursesScreen} options={{ tabBarLabel: isStudent ? 'Courses' : 'My Courses' }} />
      <Tab.Screen name="ChatTab"    component={ChatScreen}    options={{ tabBarLabel: 'AI Chat' }} />
      {isManagement
        ? <Tab.Screen name="AdminTab"  component={AdminDashboardScreen} options={{ tabBarLabel: 'Admin' }} />
        : <Tab.Screen name="SocialTab" component={SocialScreen}         options={{ tabBarLabel: 'Social' }} />
      }
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="Lesson" component={LessonScreen} />
            <Stack.Screen name="Browse" component={BrowseScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Focus" component={FocusScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} />
            <Stack.Screen name="CourseBuilder" component={CourseBuilderScreen} />
            <Stack.Screen name="CreateLecturer" component={CreateLecturerScreen} />
            <Stack.Screen name="PendingStudents" component={PendingStudentsScreen} />
            <Stack.Screen name="Certificate" component={CertificateScreen} />
            <Stack.Screen name="Submissions" component={SubmissionsScreen} />
            <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="MyCertificates" component={MyCertificatesScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
            <Stack.Screen name="ScheduleLiveClass" component={ScheduleLiveClassScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  topTitle: { fontSize: 18, fontWeight: '700', color: COLORS.t1 },
});
