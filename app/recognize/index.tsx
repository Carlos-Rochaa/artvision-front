import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Markdown from "react-native-markdown-display";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Recognize() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();

  function addMessage(msg: any) {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }

  // ============================
  // 📎 Selecionar imagem
  // ============================
  async function pickFromGallery() {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!pick.canceled) {
      sendImage(pick.assets[0].uri);
    }
  }

  // ============================
  // 📷 Tirar foto com câmera
  // ============================
  async function takePhoto() {
    const permission = await Camera.requestCameraPermissionsAsync();

    if (!permission.granted) {
      alert("Permita acesso à câmera para usar essa função.");
      return;
    }

    const pic = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });

    if (!pic.canceled) {
      sendImage(pic.assets[0].uri);
    }
  }

  async function sendImage(uri: string) {
    addMessage({
      sender: "user",
      type: "image",
      image: uri,
    });

    analyze(uri);
  }

  // ============================
  // 🔍 Enviar para análise API
  // ============================
  async function analyze(uri: string) {
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
        content: "❌ Erro ao conectar ao servidor.",
      });
    }
  }

  function removeTyping() {
    setMessages((prev) => prev.filter((m) => m.type !== "typing"));
  }

  // ============================
  // ✉️ Enviar mensagem normal
  // ============================
  function sendText() {
    if (input.trim().length === 0) return;

    addMessage({
      sender: "user",
      type: "text",
      content: input,
    });

    setInput("");

    addMessage({
      sender: "bot",
      type: "text",
      content:
        "✨ Envie uma imagem 📷📎 para receber uma análise artística detalhada.",
    });
  }

  // ============================
  // UI
  // ============================
  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* CHAT */}
        <ScrollView ref={scrollRef} style={styles.chat}>
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";

            return (
              <View
                key={index}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.botRow,
                ]}
              >
                {/* Bot avatar */}
                {!isUser && (
                  <Image
                    source={{ uri: "https://i.imgur.com/7k12EPD.png" }}
                    style={styles.avatar}
                  />
                )}

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
                    <Text style={{ color: "#666" }}>
                      ArtVision está analisando…
                    </Text>
                  )}

                  {msg.type === "text" && <Markdown>{msg.content}</Markdown>}
                </View>

                {/* User avatar */}
                {isUser && (
                  <Image
                    source={{ uri: "https://i.imgur.com/Yo8QFMB.png" }}
                    style={styles.avatar}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* FOOTER - INPUT BAR */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 6 }]}>
          <TouchableOpacity onPress={pickFromGallery}>
            <Text style={styles.icon}>📎</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={takePhoto}>
            <Text style={styles.icon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            value={input}
            onChangeText={setInput}
          />

          <TouchableOpacity onPress={sendText}>
            <Text style={styles.sendBtn}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======================
// ESTILOS
// ======================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  chat: {
    padding: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  botRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#5B8DF6",
    marginLeft: 10,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    marginRight: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 50,
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#DDD",
  },
  input: {
    flex: 1,
    backgroundColor: "#EEE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  icon: {
    fontSize: 26,
    marginHorizontal: 6,
  },
  sendBtn: {
    fontSize: 26,
    color: "#4A80F0",
    marginLeft: 4,
  },
});
