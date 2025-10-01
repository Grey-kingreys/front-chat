import { createCookieSessionStorage, redirect, } from "react-router";


const { getSession, commitSession, destroySession} = createCookieSessionStorage({
    cookie: {
        name: 'session',
        secrets: ['sjh14df5g7'],
        
    }
})

export const getUserToken = async ({request}: {request: Request}) => {
    const session = await getSession(
        request.headers.get("Cookie"),
      );
    return session.get('userToken')
}


export const commitUserToken = async (
    {request, userToken}: 
    {
        request: Request, 
        userToken: string
    }) => {
    const session = await getSession(
        request.headers.get("Cookie"),
      );
      session.set('userToken', userToken)
    return commitSession(session)
}

export const logout = async ({ request }: { request: Request }) => {
    const cookieHeader = request.headers.get("Cookie");
    const session = await getSession(cookieHeader);
    const destroyedSession = await destroySession(session);
    
    return redirect("/",
        {
            headers: {
                "Set-Cookie": destroyedSession
            }
        }
    );
};