# 🌍 How to Connect x-o-dos.com to this App

You have asked how to connect your domain (`x-o-dos.com`) and where to paste the settings in Google Cloud or Google AI Studio.

## 🛑 Important Clarification
**You do NOT paste DNS settings inside Google AI Studio.**

*   **Google AI Studio** is where you *write* the code.
*   **Google Cloud (Firebase)** is where you *host* the code.
*   **Your Domain Registrar** (e.g., GoDaddy, Namecheap) is where you *paste* the DNS settings.

---

## Step 1: Prepare for Google Cloud Hosting

I have added a `firebase.json` file to your project. This is the configuration file Google Cloud needs.

1.  **Build the Project**:
    You need to turn this code into a website. Run these commands in your terminal:
    ```bash
    npm install
    npm run build
    ```
    *(This creates a `dist` folder with your website files)*

---

## Step 2: Deploy to Google Cloud (Firebase)

1.  **Install Firebase CLI**:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Google**:
    ```bash
    firebase login
    ```

3.  **Initialize Project**:
    ```bash
    firebase init hosting
    ```
    *   Select **"Create a new project"**.
    *   Name it `xodos-platform` (or similar).
    *   **What do you want to use as your public directory?** Type: `dist`
    *   **Configure as a single-page app?** Type: `Yes`
    *   **Set up automatic builds and deploys?** Type: `No`

4.  **Deploy**:
    ```bash
    firebase deploy
    ```
    *   You will get a URL like: `https://xodos-platform.web.app`

---

## Step 3: Get Your DNS Values

1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Click on your project (`xodos-platform`).
3.  Click **Hosting** in the left sidebar.
4.  Click **"Add Custom Domain"**.
5.  Type `x-o-dos.com`.
6.  Click **Continue**. Google will now show you the **Values** you need.

---

## Step 4: Where to Paste Settings (DNS Configuration)

Go to the website where you bought `x-o-dos.com` (e.g., GoDaddy, Namecheap, Google Domains). Find the **DNS Management** or **Name Server** section.

### 1. Verify Ownership (TXT Record)
*Copy the value from the Firebase Console and paste it here:*

| Type | Host / Name | Value / Answer | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | *(Paste the long google-site-verification string here)* | 3600 |

*Wait a few minutes, then click "Verify" in the Firebase Console.*

### 2. Point to App (A Records)
*Firebase will give you two IP addresses. Create two separate A records:*

| Type | Host / Name | Value / IP Address | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `199.36.158.100` *(Example - Copy actual from Firebase)* | 3600 |
| **A** | `@` | `199.36.158.101` *(Example - Copy actual from Firebase)* | 3600 |

### 3. Subdomain (CNAME Record)
*To make `www.x-o-dos.com` work:*

| Type | Host / Name | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `x-o-dos.com` | 3600 |

---

## ✅ Final Checklist

1.  Code is built (`npm run build`).
2.  Code is deployed (`firebase deploy`).
3.  DNS records are pasted in your **Domain Registrar**, not AI Studio.
4.  Wait up to 24 hours (usually 1 hour) for `x-o-dos.com` to start working globally.
