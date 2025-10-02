import { supabase } from "@/integrations/supabase/client";

export interface CognitoAuthResponse {
  success: boolean;
  userId: string;
  email: string;
  sessionUrl: string;
}

export const authenticateWithCognito = async (
  accessToken: string,
  idToken: string
): Promise<CognitoAuthResponse> => {
  const { data, error } = await supabase.functions.invoke("cognito-auth", {
    body: {
      accessToken,
      idToken,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to authenticate with Cognito");
  }

  return data as CognitoAuthResponse;
};
