# Firebase Storage Setup Instructions

## ⚠️ IMPORTANT: Firebase Storage Configuration Required

Your image uploads are not working because Firebase Storage needs to be properly configured. Follow these steps:

## 1. Enable Firebase Storage in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **programs-tracker**
3. In the left sidebar, click **"Storage"**
4. Click **"Get started"** if Storage is not enabled
5. Choose **"Start in test mode"** for now
6. Select a location closest to your users

## 2. Update Firebase Storage Security Rules

1. In Firebase Console > Storage > Rules tab
2. Replace the current rules with this content:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all program images
    match /program-images/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // Allow read/write access to uploads folder (fallback)
    match /uploads/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Default rule - allow all for testing
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"** to save the rules

## 3. Verify Storage Bucket Name

Make sure your Firebase config in `client/src/firebase.ts` has the correct storage bucket:

```javascript
storageBucket: "programs-tracker.firebasestorage.app"
```

## 4. Test the Upload

1. Go to Admin Panel in your app
2. Create or edit a program
3. Try uploading an image
4. You should see:
   - Upload progress indicator
   - "✓ Image stored in Firebase" confirmation
   - Image preview in the form
   - Image displayed in program cards

## 5. Check Firebase Console

After uploading, verify in Firebase Console > Storage that:
- A new folder `program-images/` is created
- Your uploaded images appear in the folder
- Each image has a unique timestamp-based name

## 6. Troubleshooting

If images still don't upload:

1. **Check browser console** for error messages
2. **Verify project ID** matches in all config files
3. **Check Firebase project billing** - Storage may require Blaze plan
4. **Test with a small image** (< 1MB) first

## ✅ Success Indicators

- Progress bar shows during upload
- Green "✓ Image stored in Firebase" message appears
- Images display in program cards (both small icon and hover preview)
- Images persist when you refresh the page or view from different devices

The app will automatically use Firebase Storage URLs that work across all devices and persist permanently.