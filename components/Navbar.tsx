"use client"

import Link from "next/link"

export default function Navbar(){

return(

<nav className="w-full border-b bg-gray p-4 flex justify-between">

<div className="font-bold text-xl">
BuildersAfrica
</div>

<div className="flex gap-6">

<Link href="/">Home</Link>

<Link href="/ideas">Ideas</Link>

<Link href="/builders">Builders</Link>

<Link href="/dashboard">Dashboard</Link>

<Link href="/notifications">Notifications</Link>

</div>

</nav>

)

}