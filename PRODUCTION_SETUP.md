# Produccion con Firebase

## 1. Crear proyecto Firebase
- Abre [Firebase Console](https://console.firebase.google.com/)
- Crea un proyecto
- Activa `Authentication`
- Activa proveedor `Google`
- Activa `Cloud Firestore`

## 2. Obtener credenciales web
- En `Project settings`
- Agrega una app web
- Copia las variables y colocalas en `.env`

## 3. Variables necesarias
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_EMAILS`

## 4. Firestore
- Crea la base en modo production
- Carga reglas iniciales desde `firebase.rules`
- La app usa la coleccion `users`

## 5. Produccion frontend
- `npm.cmd run build`
- despliega `dist/` en Firebase Hosting, Vercel o Netlify

## 6. Nota actual
- Si Firebase no esta configurado, la app sigue funcionando en modo demo local.
