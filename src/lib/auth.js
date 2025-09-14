// Client-side auth functions using Firebase

import { userService } from './firebaseService'

const CURRENT_USER_KEY = 'currentUser';

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function isAdminEmail(email) {
  if (!email) return false;
  const adminEmails = ['admin@admin.com', 'admin1@admin.com'];
  return adminEmails.includes(email.toLowerCase());
}

// 检查当前用户是否为管理员
export function isCurrentUserAdmin() {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === 'admin';
}

export function getRedirectForEmail(email) {
  return isAdminEmail(email) ? '/admin' : '/';
}

// 根据用户角色获取重定向路径
export function getRedirectForUser(user) {
  if (user && user.role === 'admin') {
    return '/admin';
  }
  return '/';
}

// Password strength validation
export function getPasswordStrength(password) {
  if (!password) return { score: 0, level: 'none', message: 'Please enter a password' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !isCommonPassword(password),
    noSequential: !hasSequentialChars(password),
    noRepeating: !hasRepeatingChars(password)
  };
  
  // Calculate score
  Object.values(checks).forEach(check => {
    if (check) score++;
  });
  
  // Determine level and message
  let level, message;
  
  // 检查最低要求
  const hasMinRequirements = checks.hasLower && checks.hasUpper && checks.hasDigit;
  
  if (!hasMinRequirements) {
    level = 'weak';
    message = 'Password must include at least one uppercase letter, one lowercase letter, and one number.';
  } else if (score <= 3) {
    level = 'weak';
    message = 'Password meets minimum requirements but is still weak. Consider adding special characters.';
  } else if (score <= 5) {
    level = 'fair';
    message = 'Password is fair. Consider adding more complexity.';
  } else if (score <= 7) {
    level = 'good';
    message = 'Good password strength!';
  } else {
    level = 'strong';
    message = 'Excellent password strength!';
  }
  
  return { score, level, message, checks };
}

// Check if password meets minimum policy requirements
function passwordMeetsPolicy(password) {
  if (!password) return false;
  
  // 最低要求：必须包含数字、大写字母和小写字母
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  
  return hasLower && hasUpper && hasDigit;
}

// Check for common passwords
function isCommonPassword(password) {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
    'qazwsx', 'trustno1', 'jordan', 'jennifer', 'zxcvbn', 'asdfgh',
    'hunter', 'buster', 'soccer', 'harley', 'batman', 'andrew',
    'tigger', 'sunshine', 'iloveyou', '2000', 'charlie', 'robert',
    'thomas', 'hockey', 'ranger', 'daniel', 'starwars', 'klaster',
    '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper',
    '1234', 'zoey', '12345', '1234567890', 'letmein', '654321',
    'superman', 'qazwsx', 'michael', 'football', 'shadow', 'monkey',
    'mustang', 'jordan', 'jennifer', 'hunter', 'fuck', 'jordan',
    'master', 'jennifer', 'hunter', 'fuck', 'jordan', 'master'
  ];
  return commonPasswords.includes(password.toLowerCase());
}

// Check for sequential characters
function hasSequentialChars(password) {
  const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
                    'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs',
                    'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz'];
  const lowerPassword = password.toLowerCase();
  return sequences.some(seq => lowerPassword.includes(seq));
}

// Check for repeating characters
function hasRepeatingChars(password) {
  return /(.)\1{2,}/.test(password);
}

export async function registerLocal({ username, email, password }) {
  // Validate input
  if (!username || !email || !password) {
    return { ok: false, error: 'Missing required fields' };
  }
  
  // Prohibit registration of admin accounts
  if (isAdminEmail(email)) {
    return { ok: false, error: 'Admin account already exists, registration of new admin accounts is prohibited' };
  }
  
  // Validate password policy
  if (!passwordMeetsPolicy(password)) {
    const strength = getPasswordStrength(password);
    return { ok: false, error: strength.message };
  }
  
  // Check if user already exists
  const existingUser = await userService.getUserByEmail(email);
  if (existingUser.ok) {
    return { ok: false, error: 'Email already exists' };
  }
  
  // Hash password
  let hashedPassword;
  try {
    const bcrypt = await import('bcryptjs');
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Password hashing error:', error);
    return { ok: false, error: 'Registration failed' };
  }
  
  // Create user
  const userId = crypto.randomUUID();
  const userData = {
    id: userId,
    username: username.trim(),
    email: email.trim(),
    password: hashedPassword,
    role: 'user',
    provider: 'local',
    createdAt: new Date().toISOString()
  };
  
  const result = await userService.createUser(userData);
  
  // 注册成功后不自动登录，用户需要重新登录
  // if (result.ok) {
  //   setCurrentUser({ 
  //     id: result.user.id, 
  //     email: result.user.email, 
  //     username: result.user.username, 
  //     role: result.user.role 
  //   });
  // }
  
  return result;
}

export async function loginLocal({ email, password }) {
  // Validate input
  if (!email || !password) {
    return { ok: false, error: 'Missing email or password' };
  }
  
  // Find user
  const result = await userService.getUserByEmail(email);
  if (!result.ok) {
    return { ok: false, error: 'Account not found' };
  }
  
  const user = result.user;
  if (user.provider === 'google') {
    return { ok: false, error: 'This account uses Google sign-in' };
  }
  
  // Verify password hash using bcrypt
  try {
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { ok: false, error: 'Incorrect password' };
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return { ok: false, error: 'Authentication failed' };
  }
  
  // 调试：打印用户数据
  console.log('Login user data:', user);
  console.log('User role:', user.role);
  
  setCurrentUser({ 
    id: user.id, 
    email: user.email, 
    username: user.username, 
    role: user.role 
  });
  
  // 调试：打印设置后的当前用户
  console.log('Current user after login:', getCurrentUser());
  
  return { ok: true, user: { id: user.id, email: user.email, username: user.username, role: user.role } };
}

export async function signInWithGoogle(googleEmail, googleName = null) {
  if (typeof googleEmail !== 'string' || !googleEmail.includes('@')) {
    return { ok: false, error: 'Invalid Google email' };
  }
  const email = googleEmail.trim();
  
  // Prohibit creating admin accounts through Google login
  if (isAdminEmail(email)) {
    return { ok: false, error: 'Admin account can only login locally, please use password login' };
  }
  
  // Check if user exists
  let result = await userService.getUserByEmail(email);
  
  if (!result.ok) {
    // Create new user
    const userId = crypto.randomUUID();
    const username = googleName ? googleName.trim() : email.split('@')[0];
    const userData = {
      id: userId,
      username,
      email,
      provider: 'google',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    result = await userService.createUser(userData);
  }
  
  if (result.ok) {
    setCurrentUser({ 
      id: result.user.id, 
      email: result.user.email, 
      username: result.user.username, 
      role: result.user.role 
    });
  }
  
  return result;
}

// User profile management functions
export async function getUserProfile(userId) {
  return await userService.getUser(userId);
}

export async function updateUserProfile(userId, profileData) {
  const result = await userService.saveUser({ id: userId, ...profileData });
  
  if (result.ok) {
    // Update current user in localStorage
    const current = getCurrentUser();
    if (current && current.id === userId) {
      setCurrentUser({ 
        ...current, 
        username: result.user.username,
        email: result.user.email 
      });
    }
  }
  
  return result;
}

export function requireAdmin(to) {
  if (!to.path.startsWith('/admin')) return true;
  const current = getCurrentUser();
  return current && current.role === 'admin';
}


