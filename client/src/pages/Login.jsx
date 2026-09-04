import LoginForm from "../components/auth/LoginForm";

function Login() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your APEX dashboard.</p>
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;
