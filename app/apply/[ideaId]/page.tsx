"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Apply(){

const params = useParams()
const ideaId = params.ideaId as string

const [message,setMessage] = useState("")

const apply = async () => {

const { data: { user } } = await supabase.auth.getUser()

if(!user){
alert("You must be logged in")
return
}

// 1️⃣ insert application
const { error } = await supabase
.from("applications")
.insert([
{
idea_id: ideaId,
applicant_id: user.id,
message
}
])

if(error){
alert(error.message)
return
}

// 2️⃣ get startup owner
const { data: idea, error: ideaError } = await supabase
.from("ideas")
.select("user_id")
.eq("id", ideaId)
.single()

if(ideaError){
console.error(ideaError)
return
}

// 3️⃣ create notification
await supabase
.from("notifications")
.insert([
{
user_id: idea.user_id,
message: "You have a new application for your startup"
}
])

alert("Application submitted")

setMessage("")

}

return(

<div className="p-10 flex flex-col gap-4">

<h1 className="text-2xl font-bold">
Apply to Join Startup
</h1>

<textarea
placeholder="Tell the founder why you should join"
className="border p-2"
value={message}
onChange={(e)=>setMessage(e.target.value)}
/>

<button
className="bg-black text-white p-2"
onClick={apply}
>
Submit Application
</button>

</div>

)

}