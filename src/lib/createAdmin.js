// Admin account creation tool
// Run this script in browser console to create admin account

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from './firebase.js'
import { userService } from './firebaseService.js'

export async function createAdminAccount(email = 'admin@admin.com', password = 'Admin123!', username = 'Administrator') {
  try {
    console.log('🔐 Starting to create admin account...')
    
    // Check if admin account already exists
    const existingUser = await userService.getUserByEmail(email)
    if (existingUser.ok) {
      console.log('❌ Admin account already exists!')
      console.log('Email:', email)
      console.log('Username:', existingUser.user.username)
      console.log('Role:', existingUser.user.role)
      return { ok: false, error: 'Admin account already exists' }
    }
    
    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters')
      return { ok: false, error: 'Password must be at least 8 characters' }
    }
    
    // Use Firebase Auth to create admin account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update user display name
    await updateProfile(user, {
      displayName: username
    })
    
    // Create admin user data in Firestore
    const adminData = {
      id: user.uid,
      username: username,
      email: email,
      role: 'admin',
      provider: 'local',
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: [
        'manage_users',
        'manage_courses', 
        'manage_ratings',
        'manage_comments',
        'view_analytics',
        'system_settings'
      ]
    }
    
    // Create user document in Firestore
    const result = await userService.createUser(adminData)
    
    if (result.ok) {
      console.log('✅ Admin account created successfully!')
      console.log('Email:', email)
      console.log('Password:', password)
      console.log('Username:', username)
      console.log('Role:', adminData.role)
      console.log('Permissions:', adminData.permissions)
      console.log('Firebase UID:', user.uid)
      console.log('')
      console.log('⚠️  Please login immediately and change password!')
      console.log('Login URL: /login')
      
      return { ok: true, user: result.user }
    } else {
      console.log('❌ Creation failed:', result.error)
      return result
    }
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error)
    let errorMessage = 'Creation failed';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already in use';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    }
    
    return { ok: false, error: errorMessage };
  }
}

// Convenience function for use in browser console
window.createAdmin = createAdminAccount

// Usage examples:
// createAdmin() // Use default values
// createAdmin('admin@example.com', 'MySecurePassword123!', 'MyAdmin') // Custom values
