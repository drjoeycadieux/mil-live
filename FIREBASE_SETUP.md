# Firebase setup

The portal uses Firebase Authentication (email/password) and Cloud Firestore.
The Firebase web configuration is public client configuration, not a server
credential. Never put service-account keys or private credentials in this site.

1. Create a Firebase project and register a Web app.
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId` into
   [firebase-config.js](./firebase-config.js).
4. Create a Cloud Firestore database and publish [firestore.rules](./firestore.rules).
5. Serve the site over HTTP(S) (not `file://`) because it uses JavaScript modules.
6. To approve a request, review its `accessRequests` document in the Firebase
   console. Create the account under **Authentication → Users**, then add a
   Firestore document at `userProfiles/{AUTH_USER_UID}` with:

   ```json
   {
     "approved": true,
     "email": "the-user-email@example.com"
   }
   ```

   The email must match the Firebase Authentication account. The profile is
   readable only by that signed-in user; browser clients cannot create or edit
   approval records. Send the user a password-reset link or provide a temporary
   password securely after approval.
7. Optionally enable Firebase App Check and configure Authentication's
   authorized domains before public deployment. The access-request form is
   intentionally public and should be monitored for abuse.

The dashboard checks sign-in and approval in the browser. Its current map and
bulletins use public open-data feeds; do not treat a static-page login check as
protection for confidential data or server-side resources.
