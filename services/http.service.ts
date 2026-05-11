import axios, { type AxiosInstance } from 'axios'

export const createHttpService = (): AxiosInstance => {
  const config = useRuntimeConfig()
  const baseURL = typeof config.public.apiBaseUrl === 'string' && config.public.apiBaseUrl
    ? config.public.apiBaseUrl
    : '/'

  return axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
