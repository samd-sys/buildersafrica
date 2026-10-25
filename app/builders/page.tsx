"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Builder = {
  id: string
  name: string
  bio: string
  skills: string
  github: string
  portfolio: string
}

export default function Builders() {
  const [builders, setBuilders] = useState<Builder[]>([])
  const [search, setSearch] = useState("")

  const loadBuilders = async () => {
    let query = supabase.from("profiles").select("*")
    if (search) query = query.ilike("skills", `%${search}%`)
    const { data, error } = await query
    if (error) console.error(error)
    setBuilders(data || [])
  }

  useEffect(() => { loadBuilders() }, [search])

  const inviteBuilder = async (builderId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("You must be logged in as a founder"); return }

    const { data: ideas } = await supabase.from("ideas").select("*").eq("user_id", user.id)
    if (!ideas || ideas.length === 0) { alert("You must have a startup to invite"); return }

    const ideaId = ideas[0].id
    await supabase.from("notifications").insert([{
      user_id: builderId,
      message: `You have been invited to join the startup: ${ideas[0].title}`,
      type: "invite",
      reference: ideaId
    }])
    alert("Builder invited successfully!")
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Builder Directory</h1>
      <input
        type="text"
        placeholder="Search by skill (React, AI, UI/UX…)"
        className="border p-2 mb-6 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {builders.length === 0 && <p>No builders found.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {builders.map((b) => (
          <div key={b.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-bold text-lg">{b.name}</h2>
            <p className="mt-1">{b.bio}</p>
            <p className="text-sm mt-2">Skills: {b.skills}</p>
            <div className="mt-2 space-x-3">
              <a href={b.github} target="_blank" className="text-blue-500">GitHub</a>
              <a href={b.portfolio} target="_blank" className="text-blue-500">Portfolio</a>
            </div>
            <button
              className="bg-green-500 text-white px-3 py-1 mt-2 rounded"
              onClick={() => inviteBuilder(b.id)}
            >
              Invite to Startup
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}