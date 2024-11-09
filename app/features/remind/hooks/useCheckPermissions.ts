import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

export const useCheckPermissions = () => {
  const [granted, setGranted] = useState(true)

  useEffect(() => {
    const checkPermissions = async (): Promise<void> => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      setGranted(finalStatus === 'granted')
    }
    checkPermissions()

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return { granted }
}
