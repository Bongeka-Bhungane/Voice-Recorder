import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Modal,
  Text,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

import Header from "./components/Header";
import RecordingItem from "./components/RecordingItem";

type Recording = {
  id: string;
  title: string;
  date: string;
  duration: string;
  uri: string;
};

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [search, setSearch] = useState("");

  // rename modal state
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );

  const RECORDINGS_DIR = FileSystem.documentDirectory + "recordings/";

  useEffect(() => {
    loadRecordings();

    return () => {
      sound && sound.unloadAsync();
    };
  }, []);

  /* ---------------- HELPERS ---------------- */

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  /* ---------------- LOAD FILES ---------------- */

  const loadRecordings = async () => {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
        intermediates: true,
      });
      return;
    }

    const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
    const loaded: Recording[] = [];

    for (const file of files) {
      const uri = RECORDINGS_DIR + file;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {},
        undefined,
        false
      );

      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      loaded.push({
        id: file,
        title: file.replace(".m4a", ""),
        uri,
        date: new Date().toLocaleDateString(),
        duration:
          status.isLoaded && status.durationMillis
            ? formatDuration(status.durationMillis)
            : "--:--",
      });
    }

    setRecordings(loaded.reverse());
  };

  /* ---------------- RECORDING ---------------- */

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone permission required");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (!uri) return;

    const filename = `${Date.now()}.m4a`;
    const newUri = RECORDINGS_DIR + filename;

    await FileSystem.moveAsync({ from: uri, to: newUri });
    loadRecordings();
  };

  /* ---------------- PLAYBACK ---------------- */

  const playRecording = async (uri: string) => {
    if (sound) await sound.unloadAsync();

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  };

  /* ---------------- RENAME ---------------- */

  const openRename = (item: Recording) => {
    setSelectedRecording(item);
    setRenameText(item.title);
    setRenameVisible(true);
  };

  const confirmRename = async () => {
    if (!selectedRecording || !renameText.trim()) return;

    const safeName = renameText.replace(/[^a-zA-Z0-9-_ ]/g, "");
    const newUri = RECORDINGS_DIR + safeName + ".m4a";

    await FileSystem.moveAsync({
      from: selectedRecording.uri,
      to: newUri,
    });

    setRenameVisible(false);
    setSelectedRecording(null);
    loadRecordings();
  };

  /* ---------------- FILTER ---------------- */

  const filteredRecordings = recordings.filter((rec) =>
    rec.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9e9e9e" />
        <TextInput
          placeholder="Search recordings"
          placeholderTextColor="#9e9e9e"
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredRecordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, padding: 6, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <RecordingItem
            title={item.title}
            date={item.date}
            duration={item.duration}
            onPlay={() => playRecording(item.uri)}
            onLongPress={() => openRename(item)}
          />
        )}
      />

      {/* RECORD BUTTON */}
      <Pressable
        style={styles.recordButton}
        onPress={recording ? stopRecording : startRecording}
      >
        <Ionicons name={recording ? "stop" : "mic"} size={26} color="#fff" />
      </Pressable>

      {/* RENAME MODAL */}
      <Modal transparent visible={renameVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Recording</Text>

            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              style={styles.modalInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancel]}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.confirm]}
                onPress={confirmRename}
              >
                <Text style={styles.modalText}>Rename</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  searchBox: {
    margin: 20,
    backgroundColor: "#373738ff",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    color: "#fff",
    flex: 1,
  },

  recordButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#e53935",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#1e1e1e",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  modalInput: {
    backgroundColor: "#2e2e2e",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  cancel: {
    backgroundColor: "#555",
  },

  confirm: {
    backgroundColor: "#e53935",
  },

  modalText: {
    color: "#fff",
    fontWeight: "500",
  },
});
