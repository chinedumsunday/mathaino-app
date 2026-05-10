import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your deployed URL when ready
// const API_BASE = 'http://10.0.2.2:3000/api'; // Android emulator
const API_BASE = 'http://localhost:3000/api'; // iOS simulator / web
// const API_BASE = 'http://YOUR_IP:3000/api'; // Physical device (use your computer's local IP)
// const API_BASE = 'https://your-app.onrender.com/api'; // Production

let authToken = null;

// ═══ TOKEN MANAGEMENT ═══
export const setToken = async (token) => {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem('authToken', token);
  } else {
    await AsyncStorage.removeItem('authToken');
  }
};

export const getToken = () => authToken;

export const loadToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) authToken = token;
  return token;
};

// ═══ BASE REQUEST ═══
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.error?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    // Network error
    if (err.message === 'Network request failed') {
      throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    throw err;
  }
};

// ═══ AUTH ═══
export const apiRegister = (body) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const apiLogin = (idToken) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) });

export const apiGetMe = () =>
  request('/auth/me');

export const apiForgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const apiVerifyOTP = (email, otp) =>
  request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });

export const apiResetPassword = (email, otp, newPassword) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) });

// ═══ USERS ═══
export const apiListUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/users${query ? '?' + query : ''}`);
};

export const apiGetUser = (id) =>
  request(`/users/${id}`);

export const apiUpdateProfile = (body) =>
  request('/users/profile', { method: 'PATCH', body: JSON.stringify(body) });

export const apiChangeRole = (id, role) =>
  request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const apiChangeStatus = (id, status) =>
  request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const apiGetStats = () =>
  request('/users/stats');

// ═══ COURSES ═══
export const apiCreateCourse = (body) =>
  request('/courses', { method: 'POST', body: JSON.stringify(body) });

export const apiListCourses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/courses${query ? '?' + query : ''}`);
};

export const apiGetCourse = (id) =>
  request(`/courses/${id}`);

export const apiUpdateCourse = (id, body) =>
  request(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDeleteCourse = (id) =>
  request(`/courses/${id}`, { method: 'DELETE' });

export const apiTogglePublish = (id) =>
  request(`/courses/${id}/publish`, { method: 'PATCH' });

export const apiMyCourses = () =>
  request('/courses/my');

// ═══ MODULES ═══
export const apiCreateModule = (courseId, body) =>
  request(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(body) });

export const apiListModules = (courseId) =>
  request(`/courses/${courseId}/modules`);

export const apiUpdateModule = (id, body) =>
  request(`/modules/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDeleteModule = (id) =>
  request(`/modules/${id}`, { method: 'DELETE' });

export const apiReorderModules = (courseId, moduleIds) =>
  request(`/courses/${courseId}/modules/reorder`, { method: 'PATCH', body: JSON.stringify({ moduleIds }) });

// ═══ CONTENT ═══
export const apiCreateContent = (moduleId, body) =>
  request(`/modules/${moduleId}/content`, { method: 'POST', body: JSON.stringify(body) });

export const apiListContent = (moduleId) =>
  request(`/modules/${moduleId}/content`);

export const apiGetContent = (id) =>
  request(`/content/${id}`);

export const apiUpdateContent = (id, body) =>
  request(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDeleteContent = (id) =>
  request(`/content/${id}`, { method: 'DELETE' });

export const apiReorderContent = (moduleId, contentIds) =>
  request(`/modules/${moduleId}/content/reorder`, { method: 'PATCH', body: JSON.stringify({ contentIds }) });

// ═══ ENROLLMENT ═══
export const apiEnroll = (courseId) =>
  request(`/courses/${courseId}/enroll`, { method: 'POST' });

export const apiUnenroll = (courseId) =>
  request(`/courses/${courseId}/enroll`, { method: 'DELETE' });

export const apiMyEnrollments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/enrollments/my${query ? '?' + query : ''}`);
};

export const apiUpdateProgress = (enrollmentId, progress) =>
  request(`/enrollments/${enrollmentId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) });

export const apiCourseStudents = (courseId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/courses/${courseId}/students${query ? '?' + query : ''}`);
};

// ═══ AI CHATBOT ═══
export const apiChatbotSend = (message, history = []) =>
  request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) });

// ═══ SOCIAL ═══
export const apiYouTubeSearch = (q) => {
  const query = new URLSearchParams({ q }).toString();
  return request(`/social/youtube?${query}`);
};

export const apiInstagramFeed = () =>
  request('/social/instagram');

// ═══ ENROLLMENT MANAGEMENT ═══
export const apiPendingEnrollments = () =>
  request('/enrollments/pending');

export const apiApproveEnrollment = (id, action) =>
  request(`/enrollments/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ action }) });

// ═══ LECTURER MANAGEMENT ═══
export const apiCreateLecturer = (body) =>
  request('/users/lecturers', { method: 'POST', body: JSON.stringify(body) });

// ═══ NOTIFICATIONS ═══
export const apiListNotifications = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/notifications${query ? '?' + query : ''}`);
};

export const apiMarkNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PATCH' });

export const apiMarkAllNotificationsRead = () =>
  request('/notifications/read-all', { method: 'PATCH' });

export const apiDeleteNotification = (id) =>
  request(`/notifications/${id}`, { method: 'DELETE' });

// ═══ STUDENT MANAGEMENT ═══
export const apiCreateStudent = (body) =>
  request('/users/students', { method: 'POST', body: JSON.stringify(body) });

// ═══ PROGRESS / COMPLETION ═══
export const apiMarkComplete = (contentId) =>
  request(`/content/${contentId}/complete`, { method: 'POST' });

export const apiGetCompletion = (contentId) =>
  request(`/content/${contentId}/completion`);

// ═══ QUIZ ═══
export const apiSubmitQuiz = (contentId, answers) =>
  request(`/content/${contentId}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) });

export const apiGetQuizAttempts = (contentId) =>
  request(`/content/${contentId}/quiz/attempts`);

// ═══ ASSIGNMENTS ═══
export const apiSubmitAssignment = (contentId, body) =>
  request(`/content/${contentId}/submit`, { method: 'POST', body: JSON.stringify(body) });

export const apiGetSubmission = (contentId) =>
  request(`/content/${contentId}/submission`);

export const apiGradeSubmission = (contentId, submissionId, body) =>
  request(`/content/${contentId}/submission/${submissionId}/grade`, { method: 'PATCH', body: JSON.stringify(body) });

export const apiCourseSubmissions = (courseId) =>
  request(`/courses/${courseId}/submissions`);

// ═══ DISCUSSIONS ═══
export const apiListDiscussions = (courseId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/courses/${courseId}/discussions${query ? '?' + query : ''}`);
};

export const apiCreateDiscussion = (courseId, body) =>
  request(`/courses/${courseId}/discussions`, { method: 'POST', body: JSON.stringify({ body }) });

export const apiDeleteDiscussion = (id) =>
  request(`/discussions/${id}`, { method: 'DELETE' });

export const apiCreateReply = (discussionId, body) =>
  request(`/discussions/${discussionId}/replies`, { method: 'POST', body: JSON.stringify({ body }) });

export const apiDeleteReply = (id) =>
  request(`/discussions/replies/${id}`, { method: 'DELETE' });

// ═══ CERTIFICATES ═══
export const apiGetCertificate = (courseId) =>
  request(`/courses/${courseId}/certificate`);

export const apiMyCertificates = () =>
  request('/certificates');

// ═══ AI ═══
export const apiAIChat = (message, history = [], courseTitle, role) =>
  request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history, courseTitle, role }) });

export const apiAIYoutubeSuggest = (topic) =>
  request('/ai/youtube-suggest', { method: 'POST', body: JSON.stringify({ topic }) });

// ═══ SOCIAL FEED ═══
export const apiGetFeed = (page = 1) =>
  request(`/social/feed?page=${page}&limit=20`);

export const apiCreatePost = (body, youtubeId, imageUrl, instagramUrl) =>
  request('/social/posts', { method: 'POST', body: JSON.stringify({ body, youtubeId, imageUrl, instagramUrl }) });

export const apiDeletePost = (id) =>
  request(`/social/posts/${id}`, { method: 'DELETE' });

export const apiToggleLike = (id) =>
  request(`/social/posts/${id}/like`, { method: 'POST' });

export const apiGetComments = (id) =>
  request(`/social/posts/${id}/comments`);

export const apiAddComment = (id, body) =>
  request(`/social/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });

export const apiDeleteComment = (id) =>
  request(`/social/comments/${id}`, { method: 'DELETE' });

export const apiYoutubeSearch = (q) =>
  request(`/social/youtube?q=${encodeURIComponent(q)}`);

// ═══ LIVE SESSIONS ═══
export const apiGetLeaderboard = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/users/leaderboard${q ? '?' + q : ''}`);
};

export const apiCreateLiveSession = (body) =>
  request('/live-sessions', { method: 'POST', body: JSON.stringify(body) });

export const apiListLiveSessions = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/live-sessions${q ? '?' + q : ''}`);
};

export const apiCancelLiveSession = (id) =>
  request(`/live-sessions/${id}/cancel`, { method: 'PATCH' });

// ═══ HEALTH ═══
export const apiHealth = () =>
  request('/health');