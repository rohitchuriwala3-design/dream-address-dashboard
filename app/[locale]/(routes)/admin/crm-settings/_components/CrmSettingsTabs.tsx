"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { ConfigList } from "./ConfigList";
import { ProductCategoriesTab } from "./ProductCategoriesTab";
import type { CrmConfigType, ConfigValue } from "../_actions/crm-settings";
import { LeadFieldRulesTab } from "./LeadFieldRulesTab";
import type { LeadFieldSettings } from "@/lib/crm/leads/field-settings";

type TabConfig = {
  key: CrmConfigType;
  label: string;
  values: ConfigValue[];
};

interface Props {
  tabs: TabConfig[];
  leadFieldSettings: LeadFieldSettings;
}

export function CrmSettingsTabs({ tabs, leadFieldSettings }: Props) {
  const at = useTranslations("AdminPage");
  return (
    <Tabs defaultValue={tabs[0]?.key}>
      <TabsList className="flex-wrap h-auto gap-1">
        {tabs.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
        ))}
        <TabsTrigger value="productCategories">{at("productCategories")}</TabsTrigger>
        <TabsTrigger value="leadFields">Lead Fields</TabsTrigger>
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="mt-6">
          <ConfigList configType={t.key} label={t.label} values={t.values} />
        </TabsContent>
      ))}
      <TabsContent value="productCategories" className="mt-6">
        <ProductCategoriesTab />
      </TabsContent>
      <TabsContent value="leadFields" className="mt-6">
        <LeadFieldRulesTab initial={leadFieldSettings} />
      </TabsContent>
    </Tabs>
  );
}
