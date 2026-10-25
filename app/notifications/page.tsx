"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Notification = {
  id: string
  message: string
  type: string
  created_at: string
  reference: string // idea_id or related reference
}

export default function Notifications() {

  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications for the logged-in user
  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setNotifications(data || [])
  }

  // Accept invite function
  const acceptInvite = async (notificationId: string, ideaId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Add builder to applications table with "accepted" status
    await supabase.from("applications").insert([
      {
        idea_id: ideaId,
        applicant_id: user.id,
        message: "Accepted via invite",
        status: "accepted"
      }
    ])

    // Mark the notification as read
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    // Remove notification from UI
    setNotifications((prev) => prev.filter(n => n.id !== notificationId))
  }

  // Reject invite function
  const rejectInvite = async (notificationId: string) => {
    // Mark the notification as read
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    // Remove notification from UI
    setNotifications((prev) => prev.filter(n => n.id !== notificationId))
  }

  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      {notifications.length === 0 && <p>No notifications yet.</p>}

      {notifications.map((n) => (
        <div key={n.id} className="border p-4 mb-3 rounded shadow-sm">
          <p className="font-bold">
            {n.type === "invite" ? "📨 Invitation: " : ""}{n.message}
          </p>
          <p className="text-sm text-gray-500">{new Date(n.created_at).toLocaleString()}</p>

          {n.type === "invite" && (
            <div className="mt-2 flex gap-2">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => acceptInvite(n.id, n.reference)}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => rejectInvite(n.id)}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}