import "./globals.css"
import Navbar from "@/components/Navbar"

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {

return (

<html lang="en">

<body>

<Navbar />

<div className="max-w-5xl mx-auto">

{children}

</div>

</body>

</html>

)

}
