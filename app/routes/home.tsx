import type { Route } from "./+types/home";
import { Form, useActionData } from "react-router-dom";
import type { ActionFunctionArgs,  } from "react-router-dom";
import {  z } from "zod";
import { commitUserToken } from "./session.server";
import { useOptionalUser } from "~/root";


const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

const tokenSchema = z.object({
  token: z.string().optional(),
})


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}


export const action = async ({ request }: ActionFunctionArgs) => {
  // ON récupère les données du formulaire
  const formData = await request.formData();
  const jsonData = Object.fromEntries(formData);
  const validatedData = loginSchema.safeParse(jsonData);

  console.log({validatedData})

  if(validatedData.success === false){
    const { error } = validatedData;
    return {
      error: true,
      message: error.issues.map(issue => issue.message).join(", ")
    }
  }

  // On appelle notre API nest avec les données du formulaire
  try {
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData)
    });
  
    const resJson = await response.json();
  
    // Vérifier si le backend a retourné une erreur
    if (!response.ok || resJson.error) {
      // Retourner les erreurs du backend au frontend
      return new Response(JSON.stringify({
        error: true,
        messages: resJson.messages || [resJson.message] || ['Erreur lors de la connexion']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    // Si pas d'erreur, valider et traiter le token
    const {token} = tokenSchema.parse(resJson);
    console.log({token});
  
    // Créer le cookie
    const cookie = await commitUserToken({
      request, 
      userToken: token || ""
    });
  
    // Redirection en cas de succès
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": cookie
      }
    });
  
  } catch (error) {
    // Gestion des erreurs techniques (réseau, JSON, Zod)
    console.error('Erreur technique:', error);
    
    let errorMessage = 'Erreur technique';
    
    if (error instanceof z.ZodError) {
      errorMessage = 'Token invalide reçu du serveur';
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Réponse invalide du serveur';
    }
    
    return new Response(JSON.stringify({
      error: true,
      messages: [errorMessage]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
export default  function Home() {


  const user =  useOptionalUser();
  const isConnected = user !== null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif, serif' }}>
      <h1>Chat App</h1>
      {isConnected ? <h1>Welcome {user.name}</h1> : <LoginForm />}
    </div>
    
  );
}

const LoginForm = () => {
  const actionData = useActionData<{ 
    error?: boolean; 
    message?: string;
    messages?: string[];
  }>();
  
  return(
    <div style={{ fontFamily: 'system-ui, sans-serif, serif' }}>
      <Form method="post">
        <input type="text" name="email" placeholder="Email" /> <br /> <br />
        <input type="password" name="password" placeholder="Password" /> <br /> <br />
        <button type="submit">Login</button>
      </Form>
      
      
      {/* Affichage des erreurs */}
      {actionData?.error && actionData.messages && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {actionData.messages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
      )}
      
      {actionData?.error && actionData.message && !actionData.messages && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {actionData.message}
        </div>
      )}
    </div>
  )
}