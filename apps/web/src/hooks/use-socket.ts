'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let socketInstance: Socket | null = null

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    if (!socketInstance) {
      socketInstance = io(`${SOCKET_URL}/live-chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      })
    }

    socketRef.current = socketInstance

    return () => {
      // Don't disconnect on unmount - keep connection alive across page navigations
    }
  }, [token])

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler)
      return () => {
        socketRef.current?.off(event, handler)
      }
    },
    [],
  )

  const emit = useCallback(
    (event: string, data?: unknown) => {
      socketRef.current?.emit(event, data)
    },
    [],
  )

  return { socket: socketRef.current, on, emit }
}
