"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Member = {
  id: string
  member_id: string
  role: string
  idea_id: string
}

export default function Team({ params }: any) {

const ideaId = params.ideaId
const [members,setMembers] = useState<Member[]>([])

const loadTeam = async () => {

const { data, error } = await supabase
.from("teams")
.select("*")
.eq("idea_id", ideaId)

if(error){
console.error(error)
return
}

setMembers(data || [])

}

useEffect(()=>{
loadTeam()
},[])

return(

<div className="p-10">

<h1 className="text-3xl font-bold mb-6">
Startup Team
</h1>

{members.map((m)=>(
<div
key={m.id}
className="border p-3 mb-2"
>

<p>Member ID: {m.member_id}</p>
<p>Role: {m.role}</p>

</div>
))}

</div>

)

}