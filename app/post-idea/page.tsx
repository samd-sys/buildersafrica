"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PostIdea(){

const [title,setTitle] = useState("")
const [description,setDescription] = useState("")
const [tech,setTech] = useState("")

const submitIdea = async () => {

const { data: { user } } = await supabase.auth.getUser()

const { error } = await supabase
.from("ideas")
.insert([
{
title,
description,
tech_stack: tech,
user_id: user?.id
}
])

if(error){
alert(error.message)
}else{
alert("Idea posted successfully")
}

}

return(

<div className="p-10 flex flex-col gap-4">

<h1 className="text-2xl font-bold">
Post Your Startup Idea
</h1>

<input
placeholder="Startup Title"
className="border p-2"
onChange={(e)=>setTitle(e.target.value)}
/>

<textarea
placeholder="Describe your idea"
className="border p-2"
onChange={(e)=>setDescription(e.target.value)}
/>

<input
placeholder="Tech stack (React, AI, Blockchain...)"
className="border p-2"
onChange={(e)=>setTech(e.target.value)}
/>

<button
className="bg-black text-white p-2"
onClick={submitIdea}
>
Post Idea
</button>

</div>

)

}