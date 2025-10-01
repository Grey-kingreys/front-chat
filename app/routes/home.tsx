import type { Route } from "./+types/home";
import { Form, Link, redirect, useActionData } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import {  z } from "zod";
import { commitUserToken } from "./session.server";
import { useOptionalUser } from "~/root";

import { Button } from "../components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"




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
      {isConnected ? <Dashboard /> : <LoginForm />}
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Connectez-vous a votre compte</CardTitle>
        <CardDescription>
          Entrez votre email ci-dessous pour vous connecter
        </CardDescription>
        <div className="mt-2"> {/* Remplacement de CardAction */}
          <Button variant="link" asChild>
            <Link to="/register">Vous inscrire</Link>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Form method="post">
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Mot de passe oublié?
                </a>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
        </Form>
      </CardContent>
      
      <CardFooter className="flex-col gap-2">
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>

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
      </CardFooter>
    </Card>
  )
}

const Dashboard = () => {
  const user = useOptionalUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec bouton de déconnexion */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Form method="post" action="/logout">
            <Button 
              type="submit"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Se déconnecter
            </Button>
          </Form>
        </div>

        {/* Carte de bienvenue */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-800">
              Bienvenue, {user?.name || "Utilisateur"}
            </CardTitle>
            <CardDescription className="text-lg">
              Heureux de vous revoir sur votre espace personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <p className="text-blue-800">
                Votre tableau de bord est prêt. Commencez à explorer vos fonctionnalités.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}