"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Login(){

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const login = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if(error){
    alert(error.message)
  }else{
    alert("Login successful")
  }
}

return(

<div className="flex flex-col gap-3 p-10">

<h1 className="text-2xl font-bold">
Login
</h1>

<input
placeholder="Email"
className="border p-2"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
className="border p-2"
onChange={(e)=>setPassword(e.target.value)}
/>

<button
className="bg-black text-white p-2"
onClick={login}
>
Login
</button>

</div>

)

}