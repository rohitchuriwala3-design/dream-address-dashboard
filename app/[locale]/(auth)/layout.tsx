import { getTranslations } from "next-intl/server";
import "@/app/[locale]/globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "RootLayout" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            N
          </div>
          <div>
            <p className="font-semibold leading-tight">Nexus 360</p>
            <p className="text-xs text-muted-foreground">Dream Address Studio</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
      <footer className="px-5 py-4 text-center text-xs text-muted-foreground">
        Private workspace · Dream Address Studio
      </footer>
    </div>
  );
}
