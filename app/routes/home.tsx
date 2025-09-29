import type { Route } from "./+types/home";
import { Form, useLoaderData, redirect } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import {  z } from "zod";
import { commitUserToken } from "./session.server";
import { getObtionalUser } from "./auth.server";


const loginSchema = z.object({
    email: z.string(),
    password: z.string(),
})

const tokenSchema = z.object({
  token: z.string(),
})


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const loader = async ({ request }: LoaderFunctionArgs ) => {
  const user = await getObtionalUser({request});
  return {user}
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // ON récupère les données du formulaire
  const formData = await request.formData();
  const jsonData = Object.fromEntries(formData);
  const validatedData = loginSchema.parse(jsonData);

  console.log({validatedData})

  // On appelle notre API nest avec les données du formulaire
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonData)
  });

  // En cas de succès on récupère le token

    try{const resJson = await response.json();

    const {token} = tokenSchema.parse(resJson);
    console.log({token});

    // Créer le cookie
    const cookie = await commitUserToken({
      request, 
      userToken: token
    });

    // Retourner une Response avec le cookie
  return new Response(null, {
      status: 302,
      headers: {
        "Location": "/", // Rediriger vers la même page
        "Set-Cookie": cookie
      }
    });
}catch(error){
    console.log(error)
}

} 

export default function Home() {

  const {user} = useLoaderData<typeof loader>();
  const isConnected = user !== null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif, serif' }}>
      <h1>Chat App</h1>
      {isConnected ? <h1>Welcome {user.name}</h1> : <LoginForm />}
    </div>
  );
}

const LoginForm = () => {
  return(
    <div  style={{ fontFamily: 'system-ui, sans-serif, serif' }}>
      <Form method="post"> {/* Supprimer action="" */}
        <input type="text" name="email" placeholder="Email" /> <br /> <br />
        <input type="password" name="password" placeholder="Password" /> <br /> <br />
        <button type="submit">Login</button>
      </Form>
    </div>
  )
}
  