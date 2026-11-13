"use server";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { renderCampaignEmail } from "@/lib/campaigns/render-email";

export const previewTemplate = async (data: {
  contentHtml: string;
}): Promise<{ html?: string; error?: string }> => {
  try {
    await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  const html = await renderCampaignEmail({
    contentHtml: data.contentHtml,
    unsubscribeUrl: "#",
  });
  return { html };
};
