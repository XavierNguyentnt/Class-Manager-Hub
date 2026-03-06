import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");
  const current = i18n.language || "vi";

  function onValueChange(value: string) {
    i18n.changeLanguage(value);
    try {
      localStorage.setItem("lang", value);
    } catch {}
  }

  return (
    <Select value={current} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t("language.label")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="vi">{t("language.vi")}</SelectItem>
        <SelectItem value="en">{t("language.en")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

