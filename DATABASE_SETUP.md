# PostgreSQL Database Image Storage Setup

## ✅ VERCEL COMPATIBLE - No Firebase upgrades needed!

Your image upload system now uses PostgreSQL database storage with base64 encoding. This works perfectly with:
- **Vercel hosting** (including free tier)
- **Vercel Postgres** database
- **Neon Database**
- **Supabase**
- **Any PostgreSQL provider**

## How It Works

1. **Image Upload**: Users select images in the admin form
2. **Processing**: Images are compressed and converted to base64
3. **Database Storage**: Base64 data is stored directly in PostgreSQL
4. **Cross-Device Access**: Images work on any device since they're in the database

## Database Schema

The `programs` table now includes:
- `image_data`: Base64 encoded image content
- `image_name`: Original filename
- `image_type`: MIME type (image/jpeg, image/png, etc.)

## Features

✅ **5MB file size limit**  
✅ **Automatic image compression**  
✅ **Support for JPEG, PNG, GIF, WebP**  
✅ **Progress indicator during upload**  
✅ **Cross-device compatibility**  
✅ **No external storage dependencies**  
✅ **Works with all PostgreSQL providers**  

## Usage

1. **Admin Panel**: Go to `/admin`
2. **Create/Edit Program**: Click "Create Program" or edit existing
3. **Upload Image**: Click the image upload area
4. **Save**: Image data is stored in the database
5. **View**: Images appear in program cards on all devices

## Deployment

When deploying to Vercel:
1. Add your PostgreSQL connection string as `DATABASE_URL`
2. The app automatically handles image storage in the database
3. No additional configuration needed

## Database Migration

The schema was automatically updated with:
```sql
ALTER TABLE programs ADD COLUMN image_data TEXT;
ALTER TABLE programs ADD COLUMN image_name TEXT;
ALTER TABLE programs ADD COLUMN image_type TEXT;
```

Your images are now stored permanently in the database and will work on any device!