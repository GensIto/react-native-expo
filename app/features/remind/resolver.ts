import * as v from 'valibot'

export const remindSchema = v.object({
  title: v.pipe(v.string('必須項目です'), v.minLength(1)),
  pushTime: v.date(),
})

export type RemindSchema = v.InferOutput<typeof remindSchema>
