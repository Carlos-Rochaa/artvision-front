import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Ícones
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

export default function Recognize() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView | null>(null);

  const insets = useSafeAreaInsets();

  function addMessage(msg: any) {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }

  useEffect(() => {
    addMessage({
      sender: "bot",
      type: "text",
      content:
        "Olá! Eu sou o **ArtVision**, seu assistente para análise de obras de arte.\n\nEnvie uma imagem ou faça uma pergunta sobre arte.",
    });
  }, []);

  // ---------------------------------------
  //     ENVIO DE PERGUNTA EM TEXTO → /chat
  // ---------------------------------------
  

  async function sendMessage() {
  if (!text.trim()) return;

  const userMsg = text;

  const previousMessages = messages
    .filter(m => m.type === "text")
    .map((m, index) => ({
      user: m.sender === "user" ? m.content : "",
      bot: m.sender === "bot" ? m.content : ""
    }))
    .filter(h => h.user !== "" || h.bot !== "");

  addMessage({ sender: "user", type: "text", content: userMsg });
  setText("");

  addMessage({ sender: "bot", type: "typing" });

  try {
    const response = await fetch("http://192.168.0.16:8001/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMsg,
        history: previousMessages
      }),
    });

    const json = await response.json();

    removeTyping();

    addMessage({
      sender: "bot",
      type: "text",
      content: json.response,
    });
  } catch (e) {
    removeTyping();
    addMessage({
      sender: "bot",
      type: "text",
      content: "Erro ao conectar com o servidor.",
    });
  }
}



  // ---------------------------------------
  //       ENVIO DE IMAGEM → /analyze
  // ---------------------------------------
  async function analyzeImage(uri: string) {
    addMessage({ sender: "bot", type: "typing" });

    const form = new FormData();
    form.append("file", {
      uri,
      name: "image.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch("http://192.168.0.16:8001/analyze", {
        method: "POST",
        body: form,
      });

      const json = await response.json();

      removeTyping();

      addMessage({
        sender: "bot",
        type: "text",
        content: json.analysis_report,
      });
    } catch (e) {
      removeTyping();
      addMessage({
        sender: "bot",
        type: "text",
        content: "Erro ao conectar com o servidor.",
      });
    }
  }

  async function pickImage() {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!pick.canceled) {
      const uri = pick.assets[0].uri;
      addMessage({ sender: "user", type: "image", image: uri });
      await analyzeImage(uri);
    }
  }

  async function pickCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permissão para acessar câmera negada.");
      return;
    }

    const shot = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });

    if (!shot.canceled) {
      const uri = shot.assets[0].uri;
      addMessage({ sender: "user", type: "image", image: uri });
      await analyzeImage(uri);
    }
  }

  function removeTyping() {
    setMessages((prev) => prev.filter((m) => m.type !== "typing"));
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";

            return (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  isUser ? styles.userAlign : styles.botAlign,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {msg.type === "image" && (
                    <Image source={{ uri: msg.image }} style={styles.image} />
                  )}

                  {msg.type === "typing" && (
                    <Text style={{ color: "#aaa" }}>
                      ArtVision está analisando…
                    </Text>
                  )}

                  {msg.type === "text" && (
                    <Markdown style={markdownStyles}>
                      {msg.content}
                    </Markdown>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Feather name="paperclip" size={22} color="#BBBBBB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={pickCamera}>
            <Feather name="camera" size={22} color="#BBBBBB" />
          </TouchableOpacity>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Mensagem..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
            />
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#4A80F0" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* --- Markdown Styles --- */
const markdownStyles = StyleSheet.create({
  body: {
    color: "#DDD",
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heading2: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  heading3: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
});

/* --- General Styles --- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  chat: {
    paddingHorizontal: 12,
    paddingTop: 15,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 18,
  },
  userAlign: {
    justifyContent: "flex-end",
  },
  botAlign: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#4A80F0",
    marginLeft: "auto",
  },
  botBubble: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    marginRight: "auto",
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderColor: "#333",
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  inputBox: {
    flex: 1,
    marginHorizontal: 8,
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
  },
});
