import type { Route } from "./+types/home";
import { Form, useLoaderData, redirect, useActionData } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import { z } from "zod";
import { commitUserToken } from "./session.server";
import { getObtionalUser } from "./auth.server";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

const tokenSchema = z.object({
  token: z.string().optional(),
  message: z.string().optional(),
  error: z.boolean().optional(),
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat App - Inscription" }, // ← Titre plus spécifique
    { name: "description", content: "Créez votre compte Chat App" },
  ];
}



export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const jsonData = Object.fromEntries(formData);
    
    // Validation avec gestion d'erreur
    const validatedData = registerSchema.parse(jsonData);

    const response = await fetch('http://localhost:8000/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData) // ← Utiliser les données validées
    });

    // Vérifier le statut HTTP
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const resJson = await response.json();
    const { token, message, error } = tokenSchema.parse(resJson);

    if (error || !token) {
      return {
        error: true,
        message: message || "Erreur lors de l'inscription"
      };
    }

    // Créer le cookie et rediriger
    const cookie = await commitUserToken({
      request, 
      userToken: token
    });

    return redirect("/", {
      headers: {
        "Set-Cookie": cookie
      }
    });

  } catch (error) {
    console.error("Erreur d'inscription:", error);
    
    if (error instanceof z.ZodError) {
      return {
        error: true,
        message: "Données du formulaire invalides",
        errors: error
      };
    }

    return {
      error: true,
      message: error instanceof Error ? error.message : "Erreur lors de l'inscription"
    };
  }
}

export default function RegisterForm() { // ← Nom en PascalCase
  const actionData = useActionData<{ error?: boolean; message?: string }>();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif, serif', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Chat App - Inscription</h1>

      <Form method="post">
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="password" 
            name="password" 
            placeholder="Mot de passe" 
            required
            minLength={6}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            name="name" 
            placeholder="Nom" 
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Créer votre compte
        </button>

        {/* Affichage des erreurs */}
        {actionData?.error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {actionData.message}
          </div>
        )}
      </Form>
    </div>
  );
}