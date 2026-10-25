"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Ideas(){

const [ideas,setIdeas] = useState<any[]>([])

useEffect(()=>{
loadIdeas()
},[])

const loadIdeas = async () => {

const { data,error } = await supabase
.from("ideas")
.select("*")

if(data){
setIdeas(data)
}

}

return(

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{ideas.map((idea:any)=>(

<div key={idea.id} className="border rounded-lg p-5 shadow-sm">

<h2 className="text-xl font-bold">
{idea.title}
</h2>

<p className="text-gray-600 mt-2">
{idea.description}
</p>

<div className="flex justify-between mt-4">

<span className="text-sm text-gray-500">
Founder: {idea.user_id}
</span>

<a
href={`/apply/${idea.id}`}
className="bg-black text-white px-3 py-1 rounded"
>
Apply
</a>

</div>

</div>

))}

</div>

)

}