
# Security Setup Instructions

## Required Environment Variables

Before running this application, you need to set up the following environment variables:

### 1. Firebase Client Configuration
Set these in Replit Secrets or your `.env` file:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Admin Service Account
Set this in Replit Secrets:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
```

### 3. Session Secret
For secure sessions:

```
SESSION_SECRET=your_random_session_secret
```

## How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. In the "General" tab, find your web app config
5. For the service account:
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Copy the entire JSON content as a string for `FIREBASE_SERVICE_ACCOUNT_KEY`

## Security Notes

- Never commit `.env` files or service account JSON files to version control
- Use Replit Secrets for production environment variables
- Regenerate service account keys if they are ever exposed
- Use strong, random session secrets in production
