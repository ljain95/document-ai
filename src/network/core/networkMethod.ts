import { useMemo } from 'react'
import { toast } from 'sonner'
import api from './api'
import { debug } from './debug'
import type { MapString } from '@/@types/common'

export type NetworkMethod<T, U> = (body: T, params?: MapString) => Promise<U>

export type HttpMethod = 'get' | 'post' | 'put' | 'delete'

interface NetworkGenerator {
  url: string
  method: HttpMethod
}

export function filterQuery(params: MapString): string {
  return btoa(JSON.stringify(params))
}

function interpolate(url: string, params?: MapString): string {
  if (!params) return url
  let out = url
  for (const key of Object.keys(params)) {
    out = out.replace(`:${key}`, params[key])
  }
  return out
}

function generateNetworkMethod<T, U>(
  data: NetworkGenerator,
): [NetworkMethod<T, U>, string, string] {
  debug('generate method for', data)

  let wrapped: NetworkMethod<T, U>
  if (data.method === 'post') {
    wrapped = async (body, params) => {
      const url = interpolate(data.url, params)
      const res = await api.post<U>(url, body)
      return res.data
    }
  } else if (data.method === 'put') {
    wrapped = async (body, params) => {
      const url = interpolate(data.url, params)
      const res = await api.put<U>(url, body)
      return res.data
    }
  } else if (data.method === 'delete') {
    wrapped = async (_body, params) => {
      const url = interpolate(data.url, params)
      const res = await api.delete<U>(url)
      return res.data
    }
  } else {
    wrapped = async (body, params) => {
      const url = interpolate(data.url, params)
      const qs = new URLSearchParams((body ?? {}) as MapString).toString()
      const res = await api.get<U>(qs ? `${url}?${qs}` : url)
      return res.data
    }
  }

  return [wrapped, data.url, data.method]
}

export function useNetworkMethodGenerator<T, U>(
  path: string,
  method: HttpMethod = 'get',
): NetworkMethod<T, U> {
  return useMemo(
    () => generateNetworkMethod<T, U>({ url: path, method })[0],
    [path, method],
  )
}

export function handleNetworkError(err: unknown): void {
  const msg =
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    (err as { message?: string })?.message ??
    'Something went wrong!'
  toast.error(msg)
}

export default generateNetworkMethod
