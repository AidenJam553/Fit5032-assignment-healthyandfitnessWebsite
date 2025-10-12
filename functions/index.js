/**
 * Firebase Cloud Functions for Healthy & Fitness Website
 * 
 * This file contains all serverless functions for the application.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import function modules
const { sendEmail } = require('./email/sendEmail');
const { onUserCreate, onUserDelete } = require('./users/userLifecycle');

// Export all functions
exports.sendEmail = sendEmail;
exports.onUserCreate = onUserCreate;
exports.onUserDelete = onUserDelete;

