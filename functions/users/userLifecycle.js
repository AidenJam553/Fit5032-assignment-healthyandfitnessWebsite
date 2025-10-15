/**
 * User Lifecycle Cloud Functions
 * 
 * Automatically manage user data when Firebase Authentication users are created or deleted
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Trigger: When a new user is created in Firebase Authentication
 * 
 * Automatically creates a corresponding user document in Firestore
 * with default user settings and role
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  console.log(`🆕 New user created: ${user.email} (${user.uid})`);

  try {
    // Create user document in Firestore
    const userDoc = {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      username: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      provider: user.providerData[0]?.providerId || 'unknown',
      role: 'user', // Default role
      isActive: true,
      permissions: [], // Regular users have no special permissions
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Additional fields for fitness tracking
      profile: {
        phone: null,
        dob: null,
        gender: null,
        weightKg: null,
        heightCm: null,
        bmrKcal: null,
        bio: null,
        region: null
      }
    };

    // Ensure using Auth UID as document ID
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .set(userDoc);

    console.log(`✅ User document created in Firestore for: ${user.email}`);

    // Optional: Send welcome email
    // You can implement this later if needed

  } catch (error) {
    console.error(`❌ Error creating user document for ${user.email}:`, error);
    // Note: We don't throw here because we don't want to block user creation
    // The user can still use the app, and we can sync data later
  }
});

/**
 * Trigger: When a user is deleted from Firebase Authentication
 * 
 * Automatically cleans up all user-related data from Firestore
 * including user profile, bookings, posts, etc.
 */
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  console.log(`🗑️ User deleted from Auth: ${user.email} (${user.uid})`);

  const db = admin.firestore();
  const batch = db.batch();

  try {
    // 1. Delete user profile document
    const userDocRef = db.collection('users').doc(user.uid);
    batch.delete(userDocRef);
    console.log(`  - Marked user document for deletion: ${user.uid}`);

    // 2. Delete user's bookings
    const bookingsSnapshot = await db.collection('bookings')
      .where('userId', '==', user.uid)
      .get();
    
    bookingsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    console.log(`  - Marked ${bookingsSnapshot.size} bookings for deletion`);

    // 3. Delete user's forum posts
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', user.uid)
      .get();
    
    postsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    console.log(`  - Marked ${postsSnapshot.size} forum posts for deletion`);

    // 4. Delete user's workout records
    const recordsSnapshot = await db.collection('records')
      .where('userId', '==', user.uid)
      .get();
    
    recordsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    console.log(`  - Marked ${recordsSnapshot.size} workout records for deletion`);

    // 5. Commit all deletions in a single batch
    await batch.commit();
    console.log(`✅ Successfully cleaned up all data for user: ${user.email}`);

    // 6. Log the deletion for audit purposes
    try {
      await db.collection('user_deletion_logs').add({
        userId: user.uid,
        userEmail: user.email,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        dataDeleted: {
          bookings: bookingsSnapshot.size,
          posts: postsSnapshot.size,
          records: recordsSnapshot.size
        }
      });
    } catch (logError) {
      console.error('Failed to log user deletion:', logError);
    }

  } catch (error) {
    console.error(`❌ Error cleaning up data for user ${user.email}:`, error);
    
    // Log the error for manual cleanup later
    try {
      await db.collection('cleanup_errors').add({
        userId: user.uid,
        userEmail: user.email,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (logError) {
      console.error('Failed to log cleanup error:', logError);
    }
  }
});

