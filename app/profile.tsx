import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { getFontSizeValue } from "@/utils/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebase/firebase";

export default function Profile() {
  const router = useRouter();
  const { fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string>("user");
  const [firestoreId, setFirestoreId] = useState<string | null>(null);

  // ✅ Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Try to fetch the Firestore document by UID (common case)
        try {
          const directDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (directDoc.exists()) {
            const data = directDoc.data();
            setUsername(data.username || currentUser.displayName || null);
            setRole(data.role || 'user');
            setFirestoreId(directDoc.id);
          } else {
            // Fallback: some projects store user records with random doc IDs and include an `uid` field
            const usersCol = collection(db, 'users');
            const q = query(usersCol, where('uid', '==', currentUser.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const first = snap.docs[0];
              const data = first.data();
              setUsername(data.username || currentUser.displayName || null);
              setRole(data.role || 'user');
              setFirestoreId(first.id);
            } else {
              // Also try `authUid` field just in case
              const q2 = query(usersCol, where('authUid', '==', currentUser.uid));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                const first = snap2.docs[0];
                const data = first.data();
                setUsername(data.username || currentUser.displayName || null);
                setRole(data.role || 'user');
                setFirestoreId(first.id);
              } else {
                // No Firestore user doc found
                setUsername(currentUser.displayName || currentUser.email);
                setFirestoreId(null);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching user doc:', err);
          setUsername(currentUser.displayName || currentUser.email);
        }
      } else {
        setUser(null);
        setUsername(null);
        setRole("user");
      }
    });

    return unsubscribe;
  }, []);

  const handleLogin = () => router.push("/login");
  const handleRegister = () => router.push("/register");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Signed Out", "You have been signed out.");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleAdminMode = () => router.push("/admin/admin");

  const menuItems = [
    { icon: "settings-outline", label: "Settings", onPress: () => router.push("/settings") },
    { icon: "key-outline", label: "Change Password", onPress: () => router.push("/change-password") },
    { icon: "help-circle-outline", label: "Help", onPress: () => router.push("/helpdocs") },
    user && { icon: "log-out-outline", label: "Logout", onPress: handleLogout, isLogout: true },
  ].filter(Boolean) as {
    icon: string;
    label: string;
    onPress: () => void | Promise<void>;
    isLogout?: boolean;
  }[];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity> 

      {user ? (
        <>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={{ color: theme.background, fontWeight: "bold", fontSize: 48 }}>
              {(username || user.email)?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 6, fontSize: textSize + 8 }}>
            {username || user.email}
          </Text>
          <Text style={{ color: theme.text, marginBottom: 6, fontSize: textSize }}>Signed in</Text>
          {firestoreId ? (
            <Text style={{ color: theme.unselected, marginBottom: 14, fontSize: Math.max(12, textSize - 2) }}>User ID: {firestoreId}</Text>
          ) : null}

          {/* ✅ Show Admin button if role is admin */}
          {role === "admin" && (
            <TouchableOpacity
              style={{
                backgroundColor: "#FF5733",
                paddingVertical: 10,
                paddingHorizontal: 30,
                borderRadius: 8,
                marginBottom: 10,
              }}
              onPress={handleAdminMode}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: textSize }}>Enter Admin Mode</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Image source={require("@/assets/images/noprofile.jpg")} style={styles.avatar} />
          <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 6, fontSize: textSize + 8 }}>Guest</Text>
          <Text style={{ color: theme.text, marginBottom: 20, fontSize: textSize }}>Not logged in!</Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={handleLogin}
          >
            <Text style={{ color: theme.background, fontWeight: "bold", fontSize: textSize }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={handleRegister}
          >
            <Text style={{ color: theme.background, fontWeight: "bold", fontSize: textSize }}>Register</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.optionsContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.option} onPress={item.onPress}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color={item.isLogout ? "#d00" : theme.text}
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: item.isLogout ? "#d00" : theme.text, fontSize: textSize }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 80 },
  backButton: { position: "absolute", top: 35, left: 20, zIndex: 1, backgroundColor: "transparent", padding: 6 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  optionsContainer: { marginTop: 30, width: "85%" },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#ccc" },
});
