import RegisterForm from './register-form';

export default function RegisterPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-1 flex-col gap-10 px-6 py-24 sm:px-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Backend · NestJS + Redis sessions
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Create an account
          </h1>
        </div>

        <RegisterForm />
      </main>
    </div>
  );
}
