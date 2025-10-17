# Heroku Deployment Guide

This guide covers deploying the Commerce Intelligence application to Heroku with MongoDB Atlas.

## Prerequisites

1. Heroku account and Heroku CLI installed
2. MongoDB Atlas account (free tier is sufficient for development)
3. Git repository initialized

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier works fine)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Heroku access
5. Get your connection string (replace `<password>` with your actual password):
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/database-name?retryWrites=true&w=majority
   ```

## Step 2: Create Heroku Application

```bash
# Login to Heroku
heroku login

# Create new Heroku app
heroku create your-app-name

# Add buildpack (Node.js is default)
heroku buildpacks:set heroku/nodejs
```

## Step 3: Configure Environment Variables

```bash
# Set MongoDB connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority"

# Set app URL (replace with your actual Heroku app URL)
heroku config:set APP_URL="https://your-app-name.herokuapp.com"

# Optional: Set other environment variables
heroku config:set NODE_ENV="production"
```

Verify configuration:
```bash
heroku config
```

## Step 4: Deploy Application

```bash
# Add Heroku remote (if not already added)
git remote add heroku https://git.heroku.com/your-app-name.git

# Deploy to Heroku
git push heroku main
```

The deployment will:
1. Install dependencies
2. Build the Next.js application
3. Start the production server

## Step 5: Initialize Database

After successful deployment, initialize the database with default configurations:

**Option 1: Using the npm script**
```bash
# Set APP_URL environment variable locally
export APP_URL=https://your-app-name.herokuapp.com

# Run initialization script
npm run init:db
```

**Option 2: Using cURL**
```bash
curl -X POST https://your-app-name.herokuapp.com/api/init
```

**Option 3: Using Heroku CLI**
```bash
heroku run npm run init:db
```

Verify initialization:
```bash
curl https://your-app-name.herokuapp.com/api/init
```

Expected response:
```json
{
  "success": true,
  "status": {
    "connected": true,
    "wasteConfiguration": true
  },
  "ready": true
}
```

## Step 6: Verify Deployment

1. Open your application:
   ```bash
   heroku open
   ```

2. Check logs for any errors:
   ```bash
   heroku logs --tail
   ```

3. Test waste price management page:
   - Navigate to `/waste-price`
   - Verify configuration loads correctly
   - Try generating waste prices

## Troubleshooting

### Issue: "No waste price configuration found"

**Solution 1**: Run database initialization
```bash
curl -X POST https://your-app-name.herokuapp.com/api/init
```

**Solution 2**: Check MongoDB connection
```bash
heroku logs --tail | grep -i mongo
```

Verify `MONGODB_URI` is set correctly:
```bash
heroku config:get MONGODB_URI
```

### Issue: MongoDB connection timeout

**Causes**:
- IP address not whitelisted in MongoDB Atlas
- Incorrect connection string
- Network connectivity issues

**Solutions**:
1. In MongoDB Atlas, go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
2. Verify connection string format
3. Check Heroku logs for specific error messages

### Issue: Application crashes on startup

**Debug Steps**:
```bash
# View recent logs
heroku logs --tail

# Check dyno status
heroku ps

# Restart application
heroku restart

# Scale dynos
heroku ps:scale web=1
```

### Issue: Database initialization fails

**Check initialization status**:
```bash
curl https://your-app-name.herokuapp.com/api/init
```

**Manual initialization via Heroku run**:
```bash
heroku run node -e "
const https = require('https');
const url = 'https://your-app-name.herokuapp.com/api/init';
https.get(url, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});
"
```

## Database Backups

### Backup MongoDB Atlas Data

MongoDB Atlas provides automatic backups in their free tier. To create a manual backup:

1. Go to MongoDB Atlas Dashboard
2. Navigate to your cluster
3. Click "..." → Backup
4. Download backup as needed

### Restore from Backup

1. Use MongoDB Atlas restore feature
2. Or use mongorestore:
   ```bash
   mongorestore --uri="your-mongodb-uri" /path/to/backup
   ```

## Continuous Deployment

### Set Up Auto-Deploy from GitHub

1. Go to Heroku Dashboard
2. Select your app
3. Navigate to "Deploy" tab
4. Connect to GitHub repository
5. Enable automatic deploys from main branch

This will automatically deploy when you push to the main branch.

### Post-Deployment Hook

To automatically initialize the database after each deployment, you can add a release phase command in your `Procfile`:

```
release: node scripts/init-db.js
web: npm start
```

**Note**: The init script is idempotent - it won't create duplicate configurations.

## Monitoring

### View Application Logs
```bash
# Real-time logs
heroku logs --tail

# Filter by source
heroku logs --source app

# Show last 100 lines
heroku logs -n 100
```

### Monitor Database

1. MongoDB Atlas Dashboard shows:
   - Connection count
   - Operations per second
   - Storage usage
   - Performance metrics

2. Set up alerts in MongoDB Atlas for:
   - High CPU usage
   - Storage approaching limits
   - Connection issues

## Scaling

### Horizontal Scaling (More Dynos)
```bash
heroku ps:scale web=2
```

### Vertical Scaling (Larger Dynos)
```bash
heroku ps:resize web=standard-2x
```

## Cost Optimization

### Free Tier Limits
- Heroku: 550-1000 free dyno hours/month
- MongoDB Atlas: 512MB storage free
- Auto-sleep after 30 minutes of inactivity

### Keep App Awake
Use a service like UptimeRobot to ping your app every 5 minutes:
```
https://your-app-name.herokuapp.com/api/init
```

## Security Best Practices

1. **Never commit secrets**:
   - Use `.gitignore` for `.env*` files
   - Store credentials in Heroku config vars

2. **Rotate credentials regularly**:
   ```bash
   heroku config:set MONGODB_URI="new-connection-string"
   ```

3. **Use strong passwords** for MongoDB users

4. **Enable MongoDB Atlas encryption** at rest

5. **Set up IP whitelist** in MongoDB Atlas (if possible)

## Support Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Application logs: `heroku logs --tail`

## Quick Reference Commands

```bash
# Deployment
git push heroku main

# Database initialization
curl -X POST https://your-app-name.herokuapp.com/api/init

# View logs
heroku logs --tail

# Restart app
heroku restart

# Open app
heroku open

# Check config
heroku config

# Run command in Heroku
heroku run <command>

# Scale dynos
heroku ps:scale web=1

# Check dyno status
heroku ps
```
