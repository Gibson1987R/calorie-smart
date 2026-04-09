import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseConfigurado } from "./firebase";
import { usuariosDemo } from "./storage";

const USERS_COLLECTION = "users";

function getAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function construirUsuarioDesdeGoogle(authUser) {
  const displayName = authUser.displayName || "Usuario";
  const partes = displayName.split(" ");

  return {
    id: authUser.uid,
    nombre: partes[0] || "Usuario",
    apellidos: partes.slice(1).join(" ") || "",
    email: authUser.email || "",
    telefono: authUser.phoneNumber || "",
    foto:
      authUser.photoURL ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        displayName
      )}`,
    password: "",
    rol: getAdminEmails().includes((authUser.email || "").toLowerCase())
      ? "admin"
      : "usuario",
    perfil: {
      peso: 70,
      altura: 170,
      edad: 30,
      sexo: "masculino",
      actividad: "moderado",
      objetivo: "mantener",
    },
    metaPersonalizada: null,
    consumos: [],
  };
}

export async function asegurarUsuarioFirebase(authUser) {
  if (!firebaseConfigurado || !db || !authUser) return null;

  const userRef = doc(db, USERS_COLLECTION, authUser.uid);
  const userData = construirUsuarioDesdeGoogle(authUser);

  await setDoc(
    userRef,
    {
      ...userData,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return userData;
}

export async function seedUsuariosDemoSiHaceFalta() {
  if (!firebaseConfigurado || !db) return;

  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  if (!snapshot.empty) return;

  await Promise.all(
    usuariosDemo.map((usuario) =>
      setDoc(doc(db, USERS_COLLECTION, usuario.id), {
        ...usuario,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    )
  );
}

export async function cargarUsuariosFirebase() {
  if (!firebaseConfigurado || !db) return [];

  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function guardarUsuarioFirebase(usuario) {
  if (!firebaseConfigurado || !db) return;

  const userRef = doc(db, USERS_COLLECTION, usuario.id);
  await setDoc(
    userRef,
    {
      ...usuario,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function actualizarMetaFirebase(userId, nuevaMeta) {
  if (!firebaseConfigurado || !db) return;

  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    metaPersonalizada: nuevaMeta,
    updatedAt: serverTimestamp(),
  });
}
