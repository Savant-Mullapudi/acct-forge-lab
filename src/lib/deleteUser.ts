import { supabase } from "@/integrations/supabase/client";

export interface DeleteUserParams {
  userId: string;
  email: string;
}

export const deleteUser = async ({ userId, email }: DeleteUserParams): Promise<void> => {
  const { data, error } = await supabase.functions.invoke("delete-user", {
    body: {
      userId,
      email,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to delete user");
  }

  if (!data?.success) {
    throw new Error("User deletion failed");
  }

  console.log("User deleted successfully from both Supabase and Cognito");
};
