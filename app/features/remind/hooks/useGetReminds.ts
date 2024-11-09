import { useState } from 'react'
import type { SQLiteDatabase } from 'expo-sqlite'
import type { Remind } from '@/app/models/remind'

export const useGetReminds = ({ db }: { db: SQLiteDatabase }) => {
  const [reminds, setReminds] = useState<Remind[]>([])

  async function getReminds() {
    try {
      const rows = await db.getAllAsync<Remind>('SELECT * FROM remind')
      setReminds(rows)
    } catch (error) {
      console.log('Error:', error)
    }
  }

  return { reminds, getReminds }
}
