export const COURSES = [
  { id: '1', title: 'Database Systems', lecturer: 'Dr. Okonkwo', progress: 72, modules: 12, lessons: 36, duration: '24h', icon: 'db', code: 'CSC 401', enrolled: true, desc: 'Learn relational databases, SQL, normalization, and modern database systems.' },
  { id: '2', title: 'Machine Learning', lecturer: 'Prof. Adeyemi', progress: 45, modules: 8, lessons: 28, duration: '18h', icon: 'ml', code: 'CSC 405', enrolled: true, desc: 'Introduction to supervised and unsupervised learning algorithms.' },
  { id: '3', title: 'Software Engineering', lecturer: 'Dr. Ibrahim', progress: 90, modules: 10, lessons: 32, duration: '20h', icon: 'se', code: 'CSC 403', enrolled: true, desc: 'Software development lifecycle, agile methodologies, and best practices.' },
  { id: '4', title: 'Computer Networks', lecturer: 'Dr. Chukwu', progress: 28, modules: 6, lessons: 18, duration: '12h', icon: 'net', code: 'CSC 407', enrolled: true, desc: 'Network protocols, architectures, and security fundamentals.' },
  { id: '5', title: 'Data Structures', lecturer: 'Dr. Eze', progress: 0, modules: 10, lessons: 30, duration: '22h', icon: 'db', code: 'CSC 301', enrolled: false, desc: 'Arrays, linked lists, trees, graphs, and algorithm complexity.' },
  { id: '6', title: 'Cyber Security', lecturer: 'Prof. Nwosu', progress: 0, modules: 7, lessons: 21, duration: '16h', icon: 'net', code: 'CSC 409', enrolled: false, desc: 'Security principles, cryptography, and ethical hacking basics.' },
];

export const MODULES = [
  { id: 'm1', title: 'Introduction to DBMS', lessons: [
    { id: 'l1', title: 'What is a Database?', type: 'video', dur: '12m', done: true },
    { id: 'l2', title: 'DBMS Architecture', type: 'doc', dur: '8m', done: true },
    { id: 'l3', title: 'Quiz: Fundamentals', type: 'quiz', dur: '5m', done: false },
  ]},
  { id: 'm2', title: 'Relational Model', lessons: [
    { id: 'l4', title: 'Tables & Relations', type: 'video', dur: '15m', done: true },
    { id: 'l5', title: 'Keys & Constraints', type: 'video', dur: '10m', done: false },
  ]},
  { id: 'm3', title: 'SQL Fundamentals', lessons: [
    { id: 'l6', title: 'SELECT Queries', type: 'video', dur: '20m', done: false },
    { id: 'l7', title: 'Practice: SQL Basics', type: 'quiz', dur: '15m', done: false },
  ]},
  { id: 'm4', title: 'Normalization', lessons: [
    { id: 'l8', title: '1NF, 2NF, 3NF', type: 'video', dur: '18m', done: false },
    { id: 'l9', title: 'BCNF & Beyond', type: 'doc', dur: '12m', done: false },
  ]},
];

export const LEADERBOARD = [
  { id: '1', name: 'Chidi Okafor', xp: 3200, streak: 14, color: '#6BCB77', dept: 'Computer Science' },
  { id: '2', name: 'Ada Okonkwo', xp: 2450, streak: 7, color: '#FFB347', dept: 'Computer Science', isYou: true },
  { id: '3', name: 'Fatima Bello', xp: 2380, streak: 5, color: '#FF6B8A', dept: 'Mathematics' },
  { id: '4', name: 'Emeka Nwankwo', xp: 2100, streak: 9, color: '#4DA6FF', dept: 'Computer Science' },
  { id: '5', name: 'Blessing Eze', xp: 1950, streak: 3, color: '#FFD93D', dept: 'Physics' },
  { id: '6', name: 'Tunde Bakare', xp: 1800, streak: 11, color: '#6BCB77', dept: 'Computer Science' },
  { id: '7', name: 'Grace Adeyemi', xp: 1650, streak: 2, color: '#FF6B8A', dept: 'Statistics' },
  { id: '8', name: 'Samuel Obi', xp: 1500, streak: 6, color: '#4DA6FF', dept: 'Computer Science' },
];

export const USERS = [
  { id: '1', name: 'Ada Okonkwo', email: 'ada@edtain.app', role: 'Student', status: 'active', dept: 'Computer Science', joined: 'Jan 2024' },
  { id: '2', name: 'John Lecturer', email: 'john@edtain.app', role: 'Lecturer', status: 'active', dept: 'Computer Science', joined: 'Aug 2023' },
  { id: '3', name: 'Jane Faculty', email: 'jane@edtain.app', role: 'Faculty', status: 'active', dept: 'Computer Science', joined: 'Mar 2023' },
  { id: '4', name: 'New User', email: 'new@edtain.app', role: 'Student', status: 'pending', dept: 'Mathematics', joined: 'Apr 2024' },
  { id: '5', name: 'Suspended User', email: 'bad@edtain.app', role: 'Student', status: 'suspended', dept: 'Physics', joined: 'Dec 2023' },
  { id: '6', name: 'Prof. Adeyemi', email: 'adeyemi@edtain.app', role: 'Lecturer', status: 'active', dept: 'Computer Science', joined: 'Jan 2022' },
];

export const VIDEOS = [
  { id: '1', title: 'Understanding Big-O Notation', channel: 'CS Academy', views: '124K', dur: '14:32' },
  { id: '2', title: 'REST APIs Explained Simply', channel: 'TechWorld', views: '89K', dur: '11:05' },
  { id: '3', title: 'Database Indexing Deep Dive', channel: 'DB Mastery', views: '56K', dur: '22:18' },
  { id: '4', title: 'Git & GitHub for Beginners', channel: 'CodeLab', views: '210K', dur: '18:45' },
];

export const IG_POSTS = [
  { id: '1', user: 'EdTain Official', handle: '@edtain_app', text: 'New semester, new goals! 🎯 Check out our latest courses in AI and Cybersecurity. #EdTech #Learning', likes: 142, time: '2h' },
  { id: '2', user: 'CS Department', handle: '@cs_unn', text: 'Congratulations to our students who aced the midterms! Keep pushing! 💪📚', likes: 89, time: '5h' },
  { id: '3', user: 'Student Council', handle: '@sug_unn', text: 'Hackathon registration is now open! Teams of 3-5. Build something amazing! 🚀', likes: 234, time: '1d' },
];

export const NOTIFICATIONS = [
  { id: '1', title: 'New lesson available', desc: 'Database Systems — Normalization updated', accent: '#6BCB77', time: '2h ago', unread: true },
  { id: '2', title: 'Live class starting soon', desc: 'Machine Learning at 4:30 PM', accent: '#FF4D4D', time: '3h ago', unread: true },
  { id: '3', title: 'Course completed! 🎉', desc: 'You finished Software Engineering', accent: '#FFD93D', time: '1d', unread: false },
  { id: '4', title: 'New announcement', desc: 'Faculty meeting Friday at 10 AM', accent: '#FFB347', time: '1d', unread: false },
];

export const AI_RESPONSES = [
  "Great question! Let me break that down for you... 📚",
  "That's a common concept in your coursework. Here's how I'd explain it simply... 🤔",
  "I found some relevant material from your Database Systems course that might help! 💡",
  "Think of it this way — imagine you're organizing a library. Each shelf is a table, each book is a row... 📖",
  "Based on your progress, I'd recommend reviewing Module 3 first. You've got this! 💪",
  "Here's a quick summary: the key difference is in how data is structured vs accessed. Want me to go deeper? 🔍",
];
