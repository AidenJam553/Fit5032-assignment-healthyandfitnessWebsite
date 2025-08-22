// Simple localStorage-based auth mock for demo purposes

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const ADMIN_EMAILS = ['admin@admin.com'];

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function passwordMeetsPolicy(password) {
  if (!password || password.length < 6) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasLower && hasUpper && hasDigit;
}

function isAdminEmail(email) {
  if (!email) return false;
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  return /@admin\.com$/i.test(email);
}

export function getRedirectForEmail(email) {
  return isAdminEmail(email) ? '/admin' : '/';
}

export function registerLocal({ username, email, password }) {
  const users = loadUsers();
  const existsByUsername = users.some(u => u.username?.toLowerCase() === String(username).toLowerCase());
  if (existsByUsername) {
    return { ok: false, error: 'Username already exists' };
  }
  const existsByEmail = users.some(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (existsByEmail) {
    return { ok: false, error: 'Email already exists' };
  }
  if (!passwordMeetsPolicy(password)) {
    return { ok: false, error: 'Password must be 6+ chars with lower, upper, number' };
  }
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    provider: 'local',
    passwordHash: btoa(password),
    role: isAdminEmail(email) ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setCurrentUser({ id: user.id, email: user.email, username: user.username, role: user.role });
  return { ok: true, user };
}

export function loginLocal({ email, password }) {
  const users = loadUsers();
  const user = users.find(u => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!user) return { ok: false, error: 'Account not found' };
  if (user.provider === 'google') return { ok: false, error: 'This account uses Google sign-in' };
  const match = user.passwordHash === btoa(password || '');
  if (!match) return { ok: false, error: 'Incorrect password' };
  setCurrentUser({ id: user.id, email: user.email, username: user.username, role: user.role });
  return { ok: true, user };
}

export function signInWithGoogle(googleEmail) {
  if (typeof googleEmail !== 'string' || !googleEmail.includes('@')) {
    return { ok: false, error: 'Invalid Google email' };
  }
  const email = googleEmail.trim();
  const users = loadUsers();
  let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      username: email.split('@')[0],
      email,
      provider: 'google',
      role: isAdminEmail(email) ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
  }
  setCurrentUser({ id: user.id, email: user.email, username: user.username, role: user.role });
  return { ok: true, user };
}

export function requireAdmin(to) {
  if (!to.path.startsWith('/admin')) return true;
  const current = getCurrentUser();
  return current && current.role === 'admin';
}


