import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

export default function GeminiTest() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        setLoading(true);
        try {
            const res = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: input }] }],
            });
            const text = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response";
            setResponse(text);
        } catch (e) {
            setResponse("Error: " + (e as Error).message);
        }
        setLoading(false);
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Gemini Test</Text>
            <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Gemini something..."
            />
            <TouchableOpacity style={styles.button} onPress={handleAsk} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Loading..." : "Ask"}</Text>
            </TouchableOpacity>
            <Text style={styles.response}>{response}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 16 },
    button: { backgroundColor: "#4285F4", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 16 },
    buttonText: { color: "#fff", fontWeight: "bold" },
    response: { marginTop: 20, fontSize: 16 },
});