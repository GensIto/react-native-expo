import { Stack } from 'expo-router'
import * as SQLite from 'expo-sqlite'
import React from 'react'

async function migrateDbIfNeeded() {
  try {
    /**
     * DBが汚れた際に削除するためのコード
     * const db = await SQLite.openDatabaseAsync("app.db");
     * await db.closeAsync();
     * await SQLite.deleteDatabaseAsync("app.db");
     */
    const db = await SQLite.openDatabaseAsync('app.db')
    await db.execAsync(
      `PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS remind (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          pushTime DATETIME NOT NULL,
          pushed BOOLEAN NOT NULL DEFAULT 0
        );`,
    )
  } catch (error) {
    console.error('DBマイグレーションエラー:', error)
  }
}

export default function RootLayout() {
  return (
    <SQLite.SQLiteProvider databaseName="app.db" onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SQLite.SQLiteProvider>
  )
}
