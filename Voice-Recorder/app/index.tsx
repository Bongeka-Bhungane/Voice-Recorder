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
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import Header from "./components/Header";
import RecordingItem from "./components/RecordingItem";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "./context/ThemeContext";



type Recording = {
  id: string;
  title: string;
  date: string;
  duration: string;
  uri: string;
  createdAt: number;
  modificationTime?: number;
};

export default function Index() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [search, setSearch] = useState("");
  const [playbackSpeeds, setPlaybackSpeeds] = useState<Record<string, number>>(
    {}
  );
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});


  // rename modal
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );

  const router = useRouter();

  //filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSorted = [...recordings]
    .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.createdAt - b.createdAt; // oldest → newest
      }
      return b.createdAt - a.createdAt; // newest → oldest
    });

  const RECORDINGS_DIR = FileSystem.documentDirectory + "recordings/";

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  //color theme
  const { colors } = useTheme();



  //togle speed play back
  const cycleSpeed = (uri: string) => {
    setPlaybackSpeeds((prev) => {
      const current = prev[uri] ?? 1;
      const next =
        current === 0.5 ? 1 : current === 1 ? 1.5 : current === 1.5 ? 2 : 0.5;

      return { ...prev, [uri]: next };
    });
  };

  // Load existing recordings

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

    // Define type for FileSystem.getInfoAsync with modificationTime
    type FileInfoWithMod = {
      exists: boolean;
      uri: string;
      isDirectory?: boolean;
      size?: number;
      modificationTime?: number; // in seconds
    };

    for (const file of files) {
      const uri = RECORDINGS_DIR + file;

      const fileInfo: FileInfoWithMod = (await FileSystem.getInfoAsync(
        uri
      )) as FileInfoWithMod;
      // Convert seconds → milliseconds
      const createdAt = fileInfo.modificationTime
        ? fileInfo.modificationTime * 1000
        : Date.now();

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
        createdAt,
        date: new Date(createdAt).toLocaleDateString(),
        duration:
          status.isLoaded && status.durationMillis
            ? formatDuration(status.durationMillis)
            : "--:--",
      });
    }

    // Sort newest first
    loaded.sort((a, b) => b.createdAt - a.createdAt);

    setRecordings(loaded);
  };

  const togglePlay = async (uri: string) => {
    const speed = playbackSpeeds[uri] ?? 1;

    if (sound && playingUri === uri) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    if (sound) {
      await sound.unloadAsync();
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    await newSound.setRateAsync(speed, true);

    setSound(newSound);
    setPlayingUri(uri);
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      const duration = status.durationMillis ?? 0;
      const position = status.positionMillis ?? 0;

      setProgressMap((prev) => ({
        ...prev,
        [uri]: duration > 0 ? position / duration : 0,
      }));

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlayingUri(null);
        setProgressMap((prev) => ({ ...prev, [uri]: 0 }));
      }
    });


    await newSound.playAsync();
  };



  // Delete Recording

  const deleteRecording = async (item: Recording) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await FileSystem.deleteAsync(item.uri);
            loadRecordings();
          },
        },
      ]
    );
  };

  // Options Modal Handlers

  const openOptions = (item: Recording) => {
    Alert.alert(item.title, "Choose an action", [
      { text: "Rename", onPress: () => openRename(item) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteRecording(item),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Rename Modal Handlers

  const openRename = (item: Recording) => {
    setSelectedRecording(item);
    setRenameText(item.title);
    setRenameVisible(true);
  };

  const confirmRename = async () => {
    if (!selectedRecording) return;
    const newUri = RECORDINGS_DIR + renameText + ".m4a";
    await FileSystem.moveAsync({
      from: selectedRecording.uri,
      to: newUri,
    });
    setRenameVisible(false);
    loadRecordings();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header onFilterPress={() => setFilterVisible(true)} />

      <View style={[styles.searchBox, { backgroundColor: colors.input }]}>
        <Ionicons name="search" size={20} color="#9e9e9e" />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search recordings"
          placeholderTextColor="#9e9e9e"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredAndSorted}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <RecordingItem
            title={item.title}
            date={item.date}
            duration={item.duration}
            isPlaying={playingUri === item.uri && isPlaying}
            speed={playbackSpeeds[item.uri] ?? 1}
            progress={progressMap[item.uri] ?? 0}
            onPlay={() => togglePlay(item.uri)}
            onSpeedChange={() => cycleSpeed(item.uri)}
            onLongPress={() => openOptions(item)}
          />
        )}
      />

      <Pressable
        style={styles.recordButton}
        onPress={() => router.push("/recordingScreen")}
      >
        <Ionicons name="mic" size={26} color="#fff" />
      </Pressable>

      {/* Rename Modal */}
      <Modal transparent visible={renameVisible}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.card }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.modal, borderWidth: 1, borderColor: colors.text, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Recording</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
            />
            <Pressable style={styles.confirm} onPress={confirmRename}>
              <Text style={{ color: "#fff"}}>Rename</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal transparent visible={filterVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.filterBox}>
            <Text style={styles.modalTitle}>Sort by date</Text>

            <Pressable
              style={[
                styles.filterOption,
                sortOrder === "desc" && styles.activeOption,
              ]}
              onPress={() => {
                setSortOrder("desc");
                setFilterVisible(false);
              }}
            >
              <Ionicons name="arrow-down" size={18} color="#fff" />
              <Text style={styles.filterText}>Newest first</Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterOption,
                sortOrder === "asc" && styles.activeOption,
              ]}
              onPress={() => {
                setSortOrder("asc");
                setFilterVisible(false);
              }}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
              <Text style={styles.filterText}>Oldest first</Text>
            </Pressable>

            <Pressable
              style={styles.cancelFilter}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={{ color: "#9e9e9e" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}


//styles

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
    width: 260,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  modalText: {
    color: "#fff",
    fontWeight: "500",
  },
  filterBox: {
    backgroundColor: "#1e1e1e",
    width: "85%",
    borderRadius: 16,
    padding: 20,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  activeOption: {
    backgroundColor: "#e53935",
  },
  filterText: {
    color: "#fff",
    fontSize: 16,
  },
  cancelFilter: {
    marginTop: 18,
    alignItems: "center",
  },
});
