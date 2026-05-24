"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"

export function UserEmailSync() {
  const { user } = useUser()

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress
      // Set a secure, long-lived cookie with the user's primary email address
      document.cookie = `ghost_user_email=${encodeURIComponent(
        email
      )}; path=/; max-age=31536000; SameSite=Lax; Secure`
    }
  }, [user])

  return null
}
