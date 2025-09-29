
import { z } from "zod";
import { getUserToken, logout } from "./session.server";

const getAuthAuserSchema = z.object({
    email: z.string(),
    name: z.string(),
    id: z.string(),
})



export const getObtionalUser = async ({request}: {request: Request}) => {
     
        
        const userToken = await getUserToken({request});
        console.log({userToken});
        if(!userToken){
            return null
        }
       try{  
        const response = await fetch('http://localhost:8000/auth/validate', {
            //method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
            },
            // body: JSON.stringify(jsonData)
        });

        const data = await response.json();
        return getAuthAuserSchema.parse(data);
    } catch (error) {
        console.log(error)
        throw await logout({
            request
        })
    }
}