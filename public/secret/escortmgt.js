// escortmgt.js - Handles escort availability form submission and Firebase integration
// This script assumes the Firebase SDKs (compat version) are loaded before this script in the HTML.

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLq5KEYwGoODg-IhX-KD_wq7glWW719d0",
    authDomain: "twinxcarebackend.firebaseapp.com",
    projectId: "twinxcarebackend",
    storageBucket: "twinxcarebackend.firebasestorage.app",
    messagingSenderId: "791637368111",
    appId: "1:791637368111:web:2110bb059b6427ca3295da"
};

// Initialize Firebase app if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Utility functions for formatting date and time
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById("loginContainer");
    const loginBtn = document.getElementById("loginBtn");
    const loginEmailInput = document.getElementById("loginEmail");
    const loginPasswordInput = document.getElementById("loginPassword");

    const availabilityForm = document.getElementById("availabilityForm");
    const submitBtn = document.getElementById("submitBtn");

    // Set minimum date to today
    const dateInput = document.getElementById("date");
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = today;
    }

    // Check for existing session
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginContainer.style.display = "none";
            availabilityForm.style.display = "block";
        } else {
            loginContainer.style.display = "block";
            availabilityForm.style.display = "none";
        }
    });

    // Handle Login
    loginBtn.addEventListener("click", async () => {
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        try {
            await auth.signInWithEmailAndPassword(email, password);
            console.log("✅ Login successful");
        } catch (error) {
            console.error("❌ Login failed:", error);
            alert("Login failed: " + error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
        }
    });

    // Handle Form Submission
    availabilityForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const location = availabilityForm.location.value.trim();
        if (!location) {
            alert("Location is required.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const dateVal = availabilityForm.date.value;
        const fromVal = availabilityForm.fromTime.value;
        const toVal = availabilityForm.toTime.value;

        try {
            const docRef = await db.collection("escort").doc("availability").collection("entries").add({
                providerId: auth.currentUser?.uid || "guest",
                providerEmail: auth.currentUser?.email || "guest",
                date: dateVal,
                fromTime: fromVal,
                toTime: toVal,
                location: location,
                maxPax: parseInt(availabilityForm.maxPax.value, 10) || 1,
                contactPhone: availabilityForm.contactPhone.value.trim(),
                notes: availabilityForm.notes.value.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "available"
            });

            console.log("✅ Availability added with ID:", docRef.id);
            alert("Availability submitted successfully!");
            availabilityForm.reset();
        } catch (error) {
            console.error("❌ Submission failed:", error);
            alert("Failed to submit availability. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Availability";
        }
    });

    // Handle Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut();
        });
    }
});
