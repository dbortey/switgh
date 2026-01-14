# Deployment Checklist for Hostinger

## Prerequisites
- [x] FTP credentials obtained
- [ ] Database credentials obtained
- [ ] Build completed (`npm run build`)

## Step 1: Database Setup

### 1.1 Get Database Credentials from Hostinger
Go to **Databases** section in Hostinger panel and note:
- Database host: `_________________`
- Database name: `_________________`
- Database username: `_________________`
- Database password: `_________________`

### 1.2 Update api/config.php
Replace the placeholder values in `api/config.php`:
```php
define('DB_HOST', 'localhost');        // Your DB host
define('DB_NAME', 'your_database');    // Your DB name
define('DB_USER', 'your_db_user');     // Your DB username
define('DB_PASS', 'your_db_password'); // Your DB password
```

### 1.3 Create Database Tables
Connect to phpMyAdmin (in Hostinger panel) and run:
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional test data:
INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com');
```

## Step 2: Build Frontend

```bash
npm run build
```

Verify `dist/` folder exists with:
- `index.html`
- `assets/` folder with CSS and JS files

## Step 3: FTP Upload

### Your FTP Credentials:
- **Host**: ftp://153.92.10.27
- **Username**: u194804399
- **Port**: 21
- **Upload to**: public_html

### 3.1 Upload Frontend Files
Using FileZilla or SmartFTP:
1. Connect to FTP server
2. Navigate to `/public_html/` folder
3. Upload **contents** of `dist/` folder (not the folder itself):
   - `index.html` → `/public_html/index.html`
   - `assets/` → `/public_html/assets/`
   - `vite.svg` → `/public_html/vite.svg`

### 3.2 Upload Backend Files
1. Create `/public_html/api/` folder (if not exists)
2. Upload entire `api/` folder contents:
   - `config.php`
   - `db.php`
   - `users.php`
   - (Keep `example.php` optional)

## Step 4: Update CORS Settings (Production)

After deployment, update `api/config.php`:
```php
define('ALLOWED_ORIGIN', 'https://yourdomain.com'); // Replace * with your domain
```

## Step 5: Test Deployment

1. Visit your site: `https://yourdomain.com`
2. Check browser console for errors
3. Test API endpoint: `https://yourdomain.com/api/users.php`

Expected JSON response:
```json
{
  "users": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
  ]
}
```

## Troubleshooting

### "Database connection failed"
- Verify credentials in `api/config.php`
- Check database exists in Hostinger panel

### "403 Forbidden" on API
- Ensure `define('API_ACCESS', true);` is at top of each API file
- Check file permissions (should be 644)

### Frontend shows but no data
- Check browser console for CORS errors
- Verify API endpoint URL is correct
- Test API directly: `yourdomain.com/api/users.php`

### CSS not loading
- Verify `base: './'` in `vite.config.ts`
- Check assets uploaded to correct path

## Redeployment (Updates)

To update your site:
1. Make changes to code
2. Run `npm run build`
3. Upload only changed files from `dist/` via FTP
4. For API changes, upload updated PHP files
