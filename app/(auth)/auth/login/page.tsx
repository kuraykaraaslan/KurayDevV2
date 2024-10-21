import { redirect } from "next/navigation"
import { signIn, auth, providerMap } from "@/libs/auth"
import { AuthError } from "next-auth"
import { toast } from 'react-toastify';
import { faGithub, IconDefinition } from "@fortawesome/free-brands-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default async function SignInPage(props: {
    searchParams: { callbackUrl: string | undefined }
}) {

    const icons = {
        github: faGithub,
    } as Record<string, IconDefinition>

    return (
        <div className="flex flex-col gap-2">
            {Object.values(providerMap).map((provider) => (
                <form
                    action={async () => {
                        "use server"
                        try {
                            await signIn(provider.id, {
                                redirectTo: props.searchParams?.callbackUrl ?? "",
                            })
                        } catch (error) {
                            // Signin can fail for a number of reasons, such as the user
                            // not existing, or the user not having the correct role.
                            // In some cases, you may want to redirect to a custom error
                            if (error instanceof AuthError) {
                               toast.error(error.message)
                            }

                            // Otherwise if a redirects happens Next.js can handle it
                            // so you can just re-thrown the error and let Next.js handle it.
                            // Docs:
                            // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                            throw error
                        }
                    }}
                >
                    <button
                            type="submit"
                            data-provider="apple"
                            className="btn btn-block w-full py-2.5 bg-[#000] text-white hover:text-[#000] hover:bg-white"
                        >
                            <FontAwesomeIcon icon={icons[provider.id]}
                            className="mr-2 w-5 h-5" />
                            <span>Sign in with {provider.name}</span>
                        </button>
                </form>
            ))}
        </div>
    )
}