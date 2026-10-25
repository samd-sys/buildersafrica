"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Application = {
  id: string
  message: string
  status: string
  idea_id: string
  applicant_id: string
}

export default function Applications() {

  const [apps, setApps] = useState<Application[]>([])

  // Load all applications
  const loadApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")

    if (error) {
      console.error(error)
      return
    }

    setApps(data || [])
  }

  // Accept application
  const acceptApplication = async (app: Application) => {
    const { error: teamError } = await supabase
      .from("teams")
      .insert([
        {
          idea_id: app.idea_id,
          member_id: app.applicant_id,
          role: "builder"
        }
      ])

    if (teamError) {
      alert(teamError.message)
      return
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", app.id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    alert("Builder added to team")
    loadApplications()
  }

  // Reject application
  const rejectApplication = async (app: Application) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", app.id)

    if (error) {
      alert(error.message)
      return
    }

    alert("Application rejected")
    loadApplications()
  }

  useEffect(() => {
    loadApplications()
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Applications</h1>

      {apps.length === 0 && <p>No applications yet.</p>}

      {apps.map((app) => (
        <div key={app.id} className="border p-4 mb-4 rounded shadow-sm">
          <p className="font-medium">Message: {app.message}</p>
          <p className="text-gray-500 mt-1">Status: {app.status}</p>

          {app.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => acceptApplication(app)}
              >
                Accept
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => rejectApplication(app)}
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