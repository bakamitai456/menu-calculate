# Google Sheets Sync — Setup Guide

Syncing lets you share Menu Calculator data across multiple devices using a Google Sheet as a backend. Setup takes about 5 minutes and only needs to be done once.

## Prerequisites

- A Google account
- A Google Sheet (create a new blank one at [sheets.google.com](https://sheets.google.com))

---

## Step 1 — Open the Apps Script editor

1. Open your Google Sheet
2. Click **Extensions** in the menu bar
3. Click **Apps Script**

A new tab opens with the script editor.

---

## Step 2 — Paste the sync script

1. Delete all existing code in the editor (select all, then delete)
2. Open the file `apps-script.gs` from this project
3. Copy the entire contents and paste it into the editor
4. Click the **Save** button (disk icon) or press `Ctrl+S`

---

## Step 3 — Deploy as a Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon next to "Type" and select **Web app**
3. Fill in the settings:
   - **Description**: `Menu Calculator Sync` (optional)
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. If prompted, click **Authorize access** and follow the Google sign-in flow
6. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> **Note:** Every time you redeploy with code changes, you get a new URL. Use "Manage deployments" → edit the existing deployment to keep the same URL.

---

## Step 4 — Connect Menu Calculator

1. Open Menu Calculator in your browser (`index.html` or `ingredients.html`)
2. Paste the Web App URL into the **Apps Script URL** field in the navigation bar
3. Press **Tab** or **Enter** to confirm — the status indicator should change to **Syncing...** and then **Synced**

Your data is now syncing every 10 seconds.

---

## Step 5 — Set up additional devices

On each additional device or browser:

1. Open Menu Calculator
2. Paste the **same Web App URL** into the Apps Script URL field
3. The first sync will pull all data from the Sheet automatically

---

## How sync works

| Scenario | Result |
|----------|--------|
| Item added on device A | Appears on device B within 10 seconds |
| Item deleted on device A | Removed from device B within 10 seconds |
| Item edited on device A only | Device B gets the updated version |
| Same item edited on **both** devices | Conflict modal appears — you choose which version to keep |

---

## Conflict resolution

When the same item is changed on two devices between syncs, a **Sync Conflict** dialog appears:

- The left panel shows your **local** version
- The right panel shows the **remote** (Google Sheet) version
- Click **Keep Local** or **Keep Remote** to resolve

If there are multiple conflicts, they are shown one at a time. After all are resolved, sync completes automatically.

---

## Troubleshooting

**Status shows "Error"**
- Check that the URL in the Apps Script URL field is correct
- Make sure the Web App is deployed with "Who has access: Anyone"
- Open the URL directly in a browser — it should return `{}`

**Data not appearing on second device**
- Confirm both devices use the exact same Web App URL
- Wait up to 10 seconds, or click **Sync Now**
- Check the browser console for error messages

**Sync status stays "Error" / data never appears in the Sheet**
- Apps Script always redirects requests (302), which causes browsers to silently convert POST to GET. The current script version uses GET for all operations to avoid this. If you deployed an older version of the script, update it: paste the latest `apps-script.gs` code, then go to **Deploy → Manage deployments → Edit → New version → Deploy**. The URL stays the same.

**"Unsaved changes" on redeploy**
- When you redeploy the Apps Script, use **"Manage deployments" → Edit** to update the existing deployment. This keeps the URL the same so you don't need to update it in the app.

**I want to reset all synced data**
- Open your Google Sheet, go to the `SyncData` sheet, and clear cell A1
- The next sync from any device will push that device's local data up

---

## Privacy

All data is stored in **your own Google Sheet** under your Google account. No data is sent to any third-party service.
