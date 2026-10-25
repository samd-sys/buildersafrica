"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Startup({ params }: any){

const { ideaId } = use(params) as { ideaId: string }

const [idea,setIdea] = useState<any>(null)
const [team,setTeam] = useState<any[]>([])

const loadStartup = async () => {

const { data } = await supabase
.from("ideas")
.select("*")
.eq("id", ideaId)
.single()

setIdea(data)

}

const loadTeam = async () => {

const { data } = await supabase
.from("teams")
.select("*")
.eq("idea_id", ideaId)

setTeam(data || [])

}

useEffect(()=>{
loadStartup()
loadTeam()
},[])

if(!idea){
return <div className="p-10">Loading...</div>
}

return(
<div className="p-10">

<h1 className="text-4xl font-bold mb-4">
{idea.title}
</h1>

<p className="mb-4">
{idea.description}
</p>

<p className="text-gray-500 mb-6">
Tech Stack: {idea.tech_stack}
</p>

<h2 className="text-2xl font-bold mb-3">
Team
</h2>

{team.map((member:any)=>(
<div key={member.id} className="border p-3 mb-2">
<p>Member ID: {member.member_id}</p>
<p>Role: {member.role}</p>
</div>
))}

</div>
)

}