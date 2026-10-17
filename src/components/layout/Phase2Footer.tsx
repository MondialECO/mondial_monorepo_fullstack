"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function Phase2Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t px-8 py-8 sm:px-10 sm:py-10" style={{ borderColor: "var(--stroke-10)", backgroundColor: "var(--background)" }}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
        <p>{t("creator.footer.copyright")}</p>
        <div className="flex items-center gap-6 sm:gap-8">
          <a href="#" className="hover:text-foreground transition-colors">
            {t("creator.footer.privacyPolicy")}
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            {t("creator.footer.supportCenter")}
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            {t("creator.footer.termsOfService")}
          </a>
        </div>
      </div>
    </footer>
  );
}
