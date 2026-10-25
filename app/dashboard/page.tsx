"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard(){

const [ideas,setIdeas] = useState<any[]>([])
const [applications,setApplications] = useState<any[]>([])

const loadDashboard = async () => {

const { data: { user } } = await supabase.auth.getUser()

if(!user) return

// get founder ideas
const { data: ideasData } = await supabase
.from("ideas")
.select("*")
.eq("user_id", user.id)

setIdeas(ideasData || [])

if(!ideasData || ideasData.length === 0) return

const ideaIds = ideasData.map(i => i.id)

// get applications for founder ideas
const { data: appData } = await supabase
.from("applications")
.select("*")
.in("idea_id", ideaIds)

setApplications(appData || [])

}

useEffect(()=>{
loadDashboard()
},[])

return(

<div className="p-10">

<h1 className="text-3xl font-bold mb-6">
Founder Dashboard
</h1>

<h2 className="text-xl font-bold mb-4">
Your Startups
</h2>

{ideas.map((idea:any)=>(
<div
key={idea.id}
className="border p-4 mb-4"
>

<h3 className="font-bold">
{idea.title}
</h3>

<p>
{idea.description}
</p>

</div>
))}

<h2 className="text-xl font-bold mt-8 mb-4">
Applications
</h2>

{applications.map((app:any)=>(
<div
key={app.id}
className="border p-4 mb-3"
>

<p>
Application Message:
</p>

<p>
{app.message}
</p>

<p className="text-sm text-gray-500">
Status: {app.status}
</p>

</div>
))}

</div>

)

}