interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Links under the form, e.g. "Don't have an account? Sign up" */
  footer?: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
