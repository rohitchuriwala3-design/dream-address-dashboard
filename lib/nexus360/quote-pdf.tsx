import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

type QuoteLine = {
  name: string;
  sku?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  currency: string;
};

export type ApprovedQuotePdfData = {
  revisionNo: number;
  submittedAt: Date;
  reviewedAt: Date | null;
  opportunityName: string;
  clientName: string;
  currency: string;
  total: string;
  lines: QuoteLine[];
};

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", fontSize: 9, color: "#172033" },
  brand: { fontSize: 10, color: "#64748b", marginBottom: 8 },
  title: { fontSize: 23, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  subtitle: { color: "#64748b", fontSize: 10, marginBottom: 22 },
  metadata: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e2e8f0", marginBottom: 20 },
  label: { color: "#64748b", fontSize: 8, marginBottom: 4 },
  value: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  header: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#cbd5e1", color: "#64748b", fontSize: 8 },
  row: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 0.5, borderColor: "#e2e8f0" },
  item: { flex: 3, paddingRight: 8 },
  qty: { width: 42, textAlign: "right" },
  unit: { width: 90, textAlign: "right" },
  total: { width: 95, textAlign: "right" },
  itemName: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  itemDetail: { color: "#64748b", fontSize: 8, marginTop: 3 },
  grandTotal: { marginTop: 18, marginLeft: "auto", width: 220, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#172033", paddingTop: 10, fontFamily: "Helvetica-Bold", fontSize: 12 },
  note: { position: "absolute", bottom: 38, left: 42, right: 42, color: "#64748b", fontSize: 8, lineHeight: 1.4 },
});

function formatMoney(value: string, currency: string) {
  if (currency !== "INR") return "Amount needs INR review";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Invalid amount";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
  } catch {
    return "Amount needs INR review";
  }
}

function ApprovedQuotePdf({ data }: { data: ApprovedQuotePdfData }) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page, wrap: true },
      React.createElement(Text, { style: styles.brand }, "DREAM ADDRESS STUDIO · APPROVED QUOTATION"),
      React.createElement(Text, { style: styles.title }, data.opportunityName || "Interior Design Proposal"),
      React.createElement(Text, { style: styles.subtitle }, `Revision ${data.revisionNo} · Approved quote snapshot`),
      React.createElement(View, { style: styles.metadata },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.label }, "PREPARED FOR"),
          React.createElement(Text, { style: styles.value }, data.clientName || "Client")),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.label }, "SUBMITTED"),
          React.createElement(Text, { style: styles.value }, data.submittedAt.toLocaleDateString("en-IN"))),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.label }, "APPROVED"),
          React.createElement(Text, { style: styles.value }, data.reviewedAt?.toLocaleDateString("en-IN") || "Approved"))),
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.item }, "DESCRIPTION"),
        React.createElement(Text, { style: styles.qty }, "QTY"),
        React.createElement(Text, { style: styles.unit }, "UNIT PRICE"),
        React.createElement(Text, { style: styles.total }, "LINE TOTAL")),
      ...data.lines.map((line, index) => React.createElement(View, { key: `${index}-${line.name}`, style: styles.row, wrap: false },
        React.createElement(View, { style: styles.item },
          React.createElement(Text, { style: styles.itemName }, line.name),
          line.description || line.sku ? React.createElement(Text, { style: styles.itemDetail }, [line.sku, line.description].filter(Boolean).join(" · ")) : null),
        React.createElement(Text, { style: styles.qty }, String(line.quantity)),
        React.createElement(Text, { style: styles.unit }, formatMoney(line.unitPrice, line.currency)),
        React.createElement(Text, { style: styles.total }, formatMoney(line.lineTotal, line.currency)))),
      React.createElement(View, { style: styles.grandTotal },
        React.createElement(Text, null, "Quoted total"),
        React.createElement(Text, null, formatMoney(data.total, data.currency))),
      React.createElement(Text, { style: styles.note },
        "This document reflects the approved quotation revision shown above. Tax treatment, payment schedule, validity period, and contractual terms must be confirmed before sharing as a binding offer.")));
}

export async function renderApprovedQuotePdf(data: ApprovedQuotePdfData): Promise<Buffer> {
  return renderToBuffer(React.createElement(ApprovedQuotePdf, { data }) as Parameters<typeof renderToBuffer>[0]);
}
