import { auth } from "@/libs/auth";
 
export default async function Page() {
  const session = await auth()
  if (!session) return (
    <div className="flex items-center justify-center h-screen -mt-20">
      <h1>Signed out</h1>
    </div>
  )
 
  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
