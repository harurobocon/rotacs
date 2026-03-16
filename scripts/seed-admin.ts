import { credential } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function seedAdmin() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  initializeApp({
    credential: credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  const auth = getAuth();
  const db = getFirestore();

  const email = process.env.ROTACS_ADMIN_MAIL;
  const uid = process.env.ROTACS_ADMIN_UID;
  const password = process.env.ROTACS_ADMIN_PASSWORD;

  if (!email || !uid || !password) {
    console.error("Missing ROTACS_ADMIN_ credentials in .env");
    process.exit(1);
  }

  console.log("Creating/Updating Admin Auth User...");
  try {
    try {
      await auth.createUser({
        uid,
        email,
        password,
        displayName: "管理者",
      });
      console.log("Auth user created.");
    } catch (e: any) {
      if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
        console.log("Auth user already exists, updating password if necessary...");
        await auth.updateUser(uid, { password });
      } else {
        throw e;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log("Custom claims set: { admin: true }");

    // Create user document in Firestore
    const userCollection = process.env.NEXT_PUBLIC_USER_COLLECTION || "users_dev";
    const userRef = db.collection(userCollection).doc(uid);
    
    await userRef.set({
      id: uid,
      username: "admin",
      display_name: "管理者",
      role: "admin",
      pit_side: "ピット",
      pit_number: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Firestore admin document created in collection '${userCollection}'.`);

    // Optionally create reservation settings
    const checkLocCol = process.env.NEXT_PUBLIC_CHECK_LOCATION_SETTINGS_COLLECTION || "check_location_settings_dev";
    await db.collection(checkLocCol).doc("current").set({
      check1: "single",
      check2: "single",
      practice: "single"
    }, { merge: true });
    console.log("Default check location settings created.");

    const resSettingsCol = process.env.NEXT_PUBLIC_RESERVATION_SETTINGS_COLLECTION || "reservation_settings_dev";
    await db.collection(resSettingsCol).doc("testrun").set({ is_disabled: false }, { merge: true });
    await db.collection(resSettingsCol).doc("check1").set({ is_disabled: false }, { merge: true });
    await db.collection(resSettingsCol).doc("check2").set({ is_disabled: false }, { merge: true });
    await db.collection(resSettingsCol).doc("practice").set({ is_disabled: false }, { merge: true });
    console.log("Default reservation settings created.");

    console.log("Admin seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up admin:", error);
    process.exit(1);
  }
}

seedAdmin();
