import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import Header from "./components/Header";
import RecordingItem from "./components/RecordingItem";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

import { useEffect, useState } from "react";

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

  const RECORDINGS_DIR = FileSystem.documentDirectory + "recordings/";

  useEffect(() => {
    loadRecordings();
    return () => {
      sound && sound.unloadAsync();
    };
  }, []);

  // get list of recordings
  const loadRecordings = async () => {
    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
        intermediates: true,
      });
      return;
    }

    const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);

    const loaded = files.map((file) => ({
      id: file,
      title: file.replace(".m4a", ""),
      uri: RECORDINGS_DIR + file,
      date: new Date().toLocaleDateString(),
      duration: "--:--",
    }));

    setRecordings(loaded.reverse());
  };

  //new recording
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission is required");
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
    } catch (error) {
      console.error("Start recording error:", error);
    }
  };

  // stop recording
  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (!uri) return;

    const filename = `${Date.now()}.m4a`;
    const newUri = RECORDINGS_DIR + filename;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    loadRecordings();
  };

  // Play recording
  const playRecording = async (uri: string) => {
    if (sound) {
      await sound.unloadAsync();
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  };

  // 🔍 Search filter
  const filteredRecordings = recordings.filter((rec) =>
    rec.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9e9e9e" />
        <TextInput
          placeholder="Search recordings"
          placeholderTextColor={"#9e9e9e"}
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
          />
        )}
      />

      <Pressable
        style={styles.recordButton}
        onPress={recording ? stopRecording : startRecording}
      >
        <Ionicons name={recording ? "stop" : "mic"} size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

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
});
