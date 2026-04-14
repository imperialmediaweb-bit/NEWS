# Facebook Auto-Poster — Setup Guide

One-time setup (5 minutes). After this, everything is click-click in `/admin/facebook`.

## 1. Create a Facebook App

1. Go to https://developers.facebook.com/apps
2. Click **Create App** → choose **Business** type
3. Name it (e.g. "News Network Auto-Poster") and create it
4. In the left sidebar, add the **Facebook Login** product
5. In **Facebook Login → Settings**, add this **Valid OAuth Redirect URI**:
   ```
   https://YOUR-DOMAIN.com/api/admin/fb-oauth/callback
   ```
6. In **App Settings → Basic**, copy your **App ID** and **App Secret**

## 2. Request the required permissions

In **App Review → Permissions and Features**, request these:

- `pages_show_list`
- `pages_manage_posts`
- `pages_read_engagement`

(For dev/testing you can use Tester role without App Review.)

## 3. Configure environment variables (Railway)

Set these on the Railway project:

```
FB_APP_ID=1234567890
FB_APP_SECRET=abcdef...
CRON_SECRET=generate-a-long-random-string
```

## 4. Run the database migration

On Railway PostgreSQL, run `src/db/migrations/002_facebook_autopost.sql` once.

## 5. Configure the hourly cron

On Railway, add a Cron service that calls:

```
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-DOMAIN.com/api/cron/fb-post
```

Schedule: `0 * * * *` (every hour, on the hour).

## 6. Connect and map pages (the "Next, Next" part)

1. Log in to admin and go to `/admin/facebook`
2. Click **Connect Facebook**
3. On Facebook, tick the pages you want to manage and approve
4. You'll be redirected back with all your pages auto-loaded
5. For each site in the table, pick the corresponding Facebook page from the dropdown
6. Tick the **Enabled** checkbox
7. Done — the cron will start posting hourly

## How it works

- Cron runs every hour
- For each enabled site: pick the newest article that hasn't been posted yet
- Post it to the mapped Facebook Page with title + summary + link
- Rate limit: never less than 60 minutes between posts on the same page (to avoid FB bans)
- Results are logged in the `fb_posts` table

## Token expiration

Facebook Page access tokens are long-lived (don't expire unless the user changes password or revokes the app). If a page stops posting, click **Reconnect Facebook** in the admin UI to refresh tokens.
