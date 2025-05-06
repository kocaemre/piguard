import NextAuth from "next-auth";
import { getAuthOptions } from "@/app/lib/auth/auth-options";

const handler = async (req: Request, context: { params: { nextauth: string[] } }) => {
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(req, context);
};

export { handler as GET, handler as POST }; 