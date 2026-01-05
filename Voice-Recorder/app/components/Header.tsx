import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

const Header = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recoder</Text>

      <View style={styles.icons}>
        <Pressable>
          <Ionicons name="volume-high-outline" size={22} color="#fff" />
        </Pressable>

        <Pressable>
          <Ionicons name="menu-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 60,
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  icons: {
    flexDirection: "row",
    gap: 20,
  },
});