// Client-side auth functions using Firebase Authentication

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth } from './firebase'
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
  return signOut(auth);
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

// 获取当前用户的角色
export function getCurrentUserRole() {
  const currentUser = getCurrentUser();
  return currentUser ? currentUser.role : null;
}

// 检查用户是否有特定权限
export function hasPermission(permission) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // 管理员拥有所有权限
  if (currentUser.role === 'admin') return true;
  
  // 检查用户权限列表
  return currentUser.permissions && currentUser.permissions.includes(permission);
}

// 检查用户是否为普通用户
export function isRegularUser() {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === 'user';
}

// 检查用户是否已登录
export function isUserLoggedIn() {
  const currentUser = getCurrentUser();
  return currentUser !== null;
}

// 获取当前用户ID
export function getCurrentUserId() {
  const currentUser = getCurrentUser();
  return currentUser ? currentUser.id : null;
}

// 获取当前用户信息
export function getCurrentUserInfo() {
  const currentUser = getCurrentUser();
  return currentUser ? {
    id: currentUser.id,
    email: currentUser.email,
    username: currentUser.username,
    role: currentUser.role,
    permissions: currentUser.permissions || []
  } : null;
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
  
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: username.trim()
    });
    
    // Create user document in Firestore
    const userData = {
      id: user.uid,
      username: username.trim(),
      email: email.trim(),
      role: 'user',
      provider: 'local',
      createdAt: new Date().toISOString()
    };
    
    const result = await userService.createUser(userData);
    
    if (!result.ok) {
      console.error('Failed to create user in Firestore:', result.error);
      return { ok: false, error: 'Failed to create user profile' };
    }
    
    // 注册成功后退出登录，要求用户重新登录
    await signOut(auth);
    
    console.log('Registration successful, user signed out');
    
    return { 
      ok: true, 
      message: 'Registration successful! Please login with your credentials.',
      user: {
        id: user.uid,
        email: user.email,
        username: username.trim(),
        role: 'user'
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already exists';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { ok: false, error: errorMessage };
  }
}

export async function loginLocal({ email, password }) {
  // Validate input
  if (!email || !password) {
    return { ok: false, error: 'Missing email or password' };
  }
  
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const result = await userService.getUserByEmail(email);
    if (!result.ok) {
      return { ok: false, error: 'User data not found' };
    }
    
    const userData = result.user;
    
    // 调试：打印用户数据
    console.log('Login user data:', userData);
    console.log('User role:', userData.role);
    
    setCurrentUser({ 
      id: user.uid, 
      email: user.email, 
      username: userData.username, 
      role: userData.role 
    });
    
    // 调试：打印设置后的当前用户
    console.log('Current user after login:', getCurrentUser());
    
    return { ok: true, user: { id: user.uid, email: user.email, username: userData.username, role: userData.role } };
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Account not found';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later';
    }
    
    return { ok: false, error: errorMessage };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const email = user.email;
    const name = user.displayName || user.email.split('@')[0];
    
    // Prohibit creating admin accounts through Google login
    if (isAdminEmail(email)) {
      await signOut(auth); // Sign out the user
      return { ok: false, error: 'Admin account can only login locally, please use password login' };
    }
    
    // Check if user exists in Firestore
    let userResult = await userService.getUserByEmail(email);
    
    if (!userResult.ok) {
      // Create new user in Firestore
      const userData = {
        id: user.uid,
        username: name,
        email: email,
        provider: 'google',
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      userResult = await userService.createUser(userData);
    }
    
    if (userResult.ok) {
      setCurrentUser({ 
        id: user.uid, 
        email: user.email, 
        username: userResult.user.username, 
        role: userResult.user.role 
      });
    }
    
    return userResult;
  } catch (error) {
    console.error('Google sign-in error:', error);
    let errorMessage = 'Google sign-in failed';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked by browser';
    }
    
    return { ok: false, error: errorMessage };
  }
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

// Initialize auth state listener
export function initializeAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      try {
        const result = await userService.getUserByEmail(user.email);
        if (result.ok) {
          setCurrentUser({
            id: user.uid,
            email: user.email,
            username: result.user.username,
            role: result.user.role
          });
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    } else {
      // User is signed out
      setCurrentUser(null);
    }
  });
}


