import { useCheckPermissions } from '@/app/features/remind/hooks/useCheckPermissions'
import { useGetReminds } from '@/app/features/remind/hooks/useGetReminds'
import { type RemindSchema, remindSchema } from '@/app/features/remind/resolver'
import type { Remind } from '@/app/models/remind'
import Ionicons from '@expo/vector-icons/Ionicons'
import { valibotResolver } from '@hookform/resolvers/valibot'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format, getDate, getHours, getMinutes, getMonth, getYear } from 'date-fns'
import * as Notifications from 'expo-notifications'
import { useSQLiteContext } from 'expo-sqlite'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export default function Index() {
  const db = useSQLiteContext()
  const { granted } = useCheckPermissions()
  const { reminds, getReminds } = useGetReminds({ db })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RemindSchema>({
    resolver: valibotResolver(remindSchema),
  })

  useEffect(() => {
    getReminds()
  }, [getReminds])

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(async (notification) => {
      await db.runAsync('UPDATE remind SET pushed = 1 WHERE id = ?', notification.request.content.data.dataId)
      await getReminds()
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
    }
  }, [db.runAsync, getReminds])

  const scheduleNotificationAsync = async (data: Remind) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'リマインドです！',
        body: data.title,
        data: { dataId: data.id },
      },
      trigger: {
        year: getYear(data.pushTime),
        month: getMonth(data.pushTime) + 1,
        day: getDate(data.pushTime),
        hour: getHours(data.pushTime),
        minute: getMinutes(data.pushTime),
        repeats: false,
      },
    })
  }

  const onSubmit = async (data: RemindSchema) => {
    await Notifications.cancelAllScheduledNotificationsAsync()
    await db.runAsync(
      'INSERT INTO remind (title, pushTime, pushed) VALUES (?, ?, ?)',
      data.title,
      data.pushTime.toISOString(),
      0,
    )
    await getReminds()
    const updatedReminds = await db.getAllAsync<Remind>('SELECT * FROM remind')

    await Promise.all(
      updatedReminds.map(async (item) => {
        await scheduleNotificationAsync(item)
      }),
    )
  }

  const handleDelete = async (id: number) => {
    await db.runAsync('DELETE FROM remind WHERE id = ?', id)
    getReminds()
  }

  if (!granted)
    return (
      <View
        style={{
          backgroundColor: 'lightblue',
          padding: 10,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Text>通知の許可が必要です</Text>
        <Text>設定から通知の許可をおっこなってください</Text>
      </View>
    )

  return (
    <View
      style={{
        flex: 1,
        position: 'relative',
        padding: 24,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Controller
          control={control}
          render={({ field: { onChange } }) => (
            <View
              style={{
                width: '100%',
              }}
            >
              <Text
                style={{
                  width: '100%',
                  marginBottom: 5,
                  fontSize: 16,
                  color: 'black',
                }}
              >
                タイトル
              </Text>
              <TextInput
                onChangeText={onChange}
                accessibilityLabel="タイトル"
                style={{
                  width: '100%',
                  borderWidth: 1,
                  borderColor: 'black',
                  padding: 5,
                  marginBottom: 10,
                }}
              />
              {errors && <Text>{errors.title?.message}</Text>}
            </View>
          )}
          name="title"
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <View
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <Text
                style={{
                  width: '100%',
                  marginBottom: 5,
                  fontSize: 16,
                  color: 'black',
                }}
              >
                リマインド時間
              </Text>
              <DateTimePicker
                onChange={(_event, selectedDate) => {
                  onChange(selectedDate)
                }}
                value={value ? new Date(value) : new Date()}
                minimumDate={new Date()}
                mode="datetime"
                locale="ja"
              />
              {errors && <Text>{errors.pushTime?.message}</Text>}
            </View>
          )}
          name="pushTime"
        />
        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={{
            backgroundColor: 'lightblue',
            padding: 10,
            borderRadius: 5,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'black', fontSize: 16 }}>追加</Text>
        </Pressable>
      </View>
      <FlatList
        data={reminds}
        renderItem={({ item }) => (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                textDecorationLine: item.pushed ? 'line-through' : 'none',
                color: item.pushed ? 'gray' : 'black',
              }}
            >
              {item.title}
            </Text>
            <Text>{item.pushed ? 'done' : format(new Date(item.pushTime), 'yyyy年MM月dd日 HH:mm')}</Text>
            <Pressable onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash" size={24} color="gray" />
            </Pressable>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  )
}
