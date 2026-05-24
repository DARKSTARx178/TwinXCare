import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { getFontSizeValue } from "@/utils/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { clearSessionStamp } from "@/utils/sessionSecurity";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const directDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (directDoc.exists()) {
            const data = directDoc.data();
            setUsername(data.username || currentUser.displayName || null);
            setRole(data.role || 'user');
            setFirestoreId(directDoc.id);
          } else {
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
              const q2 = query(usersCol, where('authUid', '==', currentUser.uid));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                const first = snap2.docs[0];
                const data = first.data();
                setUsername(data.username || currentUser.displayName || null);
                setRole(data.role || 'user');
                setFirestoreId(first.id);
              } else {
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
      await clearSessionStamp();
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
    user && { icon: "ribbon-outline", label: "My Certifications", onPress: () => router.push("/escorts/certifications") },
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

      <View style={styles.header}>
        {user ? (
          <>
            <View style={[styles.avatar, { backgroundColor: theme.primaryGlow, borderColor: theme.primary, borderWidth: 2 }]}>
              <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 40 }}>
                {(username || user.email || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text, fontSize: textSize + 8 }]}>
                {username || (user.email ? user.email.split('@')[0] : 'User')}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? '#fee2e2' : 'rgba(129, 173, 231, 0.1)' }]}>
                <Text style={[styles.roleText, { color: role === 'admin' ? '#ef4444' : theme.primary }]}>
                  {role.toUpperCase()}
                </Text>
              </View>
            </View>

            {role === "admin" && (
              <TouchableOpacity
                style={[styles.adminButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                onPress={handleAdminMode}
              >
                <Ionicons name="shield-half-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.primary, fontWeight: "800", fontSize: textSize - 2 }}>Enter Admin View</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <View style={[styles.avatar, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="person-outline" size={50} color="#94a3b8" />
            </View>
            <Text style={[styles.userName, { color: theme.text, fontSize: textSize + 8 }]}>Guest</Text>
            <Text style={{ color: theme.textDim, marginBottom: 20 }}>Please sign in to access more features</Text>

            <View style={styles.authRow}>
              <TouchableOpacity style={[styles.authButton, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]} onPress={handleLogin}>
                <Text style={[styles.authButtonText, { color: theme.primary }]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.authButtonOutline, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]} onPress={handleRegister}>
                <Text style={[styles.authButtonOutlineText, { color: theme.primary }]}>Register</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={[styles.menuCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.onPress}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.isLogout ? 'rgba(239, 68, 68, 0.1)' : 'rgba(129, 173, 231, 0.08)' }]}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={item.isLogout ? "#ef4444" : theme.primary}
              />
            </View>
            <Text style={[styles.menuLabel, { color: item.isLogout ? "#ef4444" : theme.text, fontSize: textSize }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textDim} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ))}
      </View>

      {user && firestoreId && (
        <Text style={[styles.footerId, { color: theme.textDim }]}>USER REF: {firestoreId.substring(0, 12).toUpperCase()}...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontWeight: "800",
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  authRow: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  authButtonOutline: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
    borderWidth: 2,
  },
  authButtonOutlineText: {
    fontWeight: '800',
  },
  menuCard: {
    padding: 12,
    borderRadius: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontWeight: '600',
  },
  footerId: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});
