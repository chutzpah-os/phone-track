"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});
type LoginInput = z.infer<typeof loginSchema>;

function mensagemErro(codigo: string): string {
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em instantes.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setErro(null);
    setEnviando(true);
    try {
      await login(data.email, data.senha);
      router.push("/");
    } catch (err) {
      const codigo = (err as { code?: string }).code ?? "";
      setErro(mensagemErro(codigo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[340px]">
        <h1 className="text-center text-[26px] font-extrabold tracking-tight">
          Phone<span className="text-accent">Track</span>
        </h1>
        <p className="mt-2 text-center text-sm text-fg-muted">
          Entre com seu e-mail e senha para acessar a conferência diária.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-fg"
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-600">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-xs font-semibold">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              className="rounded-md border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-fg"
              {...register("senha")}
            />
            {errors.senha && (
              <span className="text-xs text-red-600">{errors.senha.message}</span>
            )}
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-md bg-fg py-3.5 text-[14px] font-bold text-accent disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
