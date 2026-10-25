"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Profile(){

const [name,setName] = useState("")
const [bio,setBio] = useState("")
const [skills,setSkills] = useState("")
const [github,setGithub] = useState("")
const [portfolio,setPortfolio] = useState("")

const saveProfile = async () => {

const { data:{user} } = await supabase.auth.getUser()

const { error } = await supabase
.from("profiles")
.insert([
{
user_id: user?.id,
name,
bio,
skills,
github,
portfolio
}
])

if(error){
alert(error.message)
}else{
alert("Profile saved")
}

}

return(

<div className="p-10 flex flex-col gap-4">

<h1 className="text-2xl font-bold">
Create Your Builder Profile
</h1>

<input
placeholder="Name"
className="border p-2"
onChange={(e)=>setName(e.target.value)}
/>

<textarea
placeholder="Short bio"
className="border p-2"
onChange={(e)=>setBio(e.target.value)}
/>

<input
placeholder="Skills (React, AI, UI Design)"
className="border p-2"
onChange={(e)=>setSkills(e.target.value)}
/>

<input
placeholder="GitHub URL"
className="border p-2"
onChange={(e)=>setGithub(e.target.value)}
/>

<input
placeholder="Portfolio website"
className="border p-2"
onChange={(e)=>setPortfolio(e.target.value)}
/>

<button
className="bg-black text-white p-2"
onClick={saveProfile}
>
Save Profile
</button>

</div>

)

}