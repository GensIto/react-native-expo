import { Tabs } from 'expo-router'
import React from 'react'

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'リマインド' }} />
      {/* <Tabs.Screen name='about' options={{ title: "about" }} /> */}
    </Tabs>
  )
}
