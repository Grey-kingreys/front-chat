import type { Route } from "./+types/home";
import { Form, redirect, useActionData, Link } from "react-router-dom";
import type { ActionFunctionArgs } from "react-router-dom";
import { z } from "zod";
import { commitUserToken } from "./session.server";

// Composants shadcn
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import type { LoaderFunctionArgs } from "react-router-dom";
import { getObtionalUser } from "./auth.server";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

const feedbackSchema = z.object({
  message: z.string(),
  error: z.boolean(),
});

const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getObtionalUser({ request });

  if(user){
    return redirect("/")
  }

  return {}
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chat App - Inscription" },
    { name: "description", content: "Créez votre compte Chat App" },
  ];
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const jsonData = Object.fromEntries(formData);
    
    const validatedData = forgotPasswordSchema.safeParse(jsonData);

    if (!validatedData.success) {
      return {
        error: true,
        message: validatedData.error.issues.map(issue => issue.message).join(", ")
      };
    }

    const response = await fetch('http://localhost:8000/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData.data)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const resJson = await response.json();
    const { message, error } = feedbackSchema.parse(resJson);

    if (error || !message) {
      return {
        error: true,
        message: message || "Erreur lors de l'inscription"
      };
    }

    return redirect("/", {
      headers: {
        "Set-Cookie": 
      }
    });

  } catch (error) {
    console.error("Erreur d'inscription:", error);
    
    if (error instanceof z.ZodError) {
      return {
        error: true,
        message: "Données du formulaire invalides"
      };
    }

    return {
      error: true,
      message: error instanceof Error ? error.message : "Erreur lors de l'inscription"
    };
  }
}

export default function ForgotPasswordForm() {
  const actionData = useActionData<{ error?: boolean; message?: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
          <CardDescription>
            Recuperation 
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form method="post" className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                required
              />
            </div>

          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Button variant="link" className="p-0" asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}