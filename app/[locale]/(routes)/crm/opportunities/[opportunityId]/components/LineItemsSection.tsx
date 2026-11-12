"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import LineItemsTable from "../../../components/line-items/LineItemsTable";
import AddLineItemForm from "../../../components/line-items/AddLineItemForm";
import EditLineItemForm from "../../../components/line-items/EditLineItemForm";
import type { LineItemData } from "../../../components/line-items/LineItemsTable";

import { addOpportunityLineItem } from "@/actions/crm/opportunity-line-items/add-line-item";
import { updateOpportunityLineItem } from "@/actions/crm/opportunity-line-items/update-line-item";
import { removeOpportunityLineItem } from "@/actions/crm/opportunity-line-items/remove-line-item";

interface LineItemsSectionProps {
  opportunityId: string;
  lineItems: LineItemData[];
  currency: string;
  approvalStatus: string;
  products: { id: string; name: string; sku: string | null; unit_price: number }[];
}

const LineItemsSection = ({
  opportunityId,
  lineItems,
  currency,
  approvalStatus,
  products,
}: LineItemsSectionProps) => {
  const [editItem, setEditItem] = useState<LineItemData | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <CardTitle>Line Items</CardTitle>
            <div className="flex items-center gap-3">
              {(approvalStatus === "PENDING" || approvalStatus === "APPROVED") && <span className="text-xs text-muted-foreground">Quote editing locked while {approvalStatus.toLowerCase()}</span>}
              <AddLineItemForm
                products={products}
                action={addOpportunityLineItem}
                parentId={opportunityId}
                parentIdField="opportunityId"
                disabled={approvalStatus === "PENDING" || approvalStatus === "APPROVED"}
              />
            </div>
          </div>
          <Separator />
        </CardHeader>
        <CardContent>
          <LineItemsTable
            items={lineItems}
            currency={currency}
            onRemove={removeOpportunityLineItem}
            onEdit={(item) => setEditItem(item)}
            readOnly={approvalStatus === "PENDING" || approvalStatus === "APPROVED"}
          />
        </CardContent>
      </Card>

      {editItem && approvalStatus !== "PENDING" && approvalStatus !== "APPROVED" && (
        <EditLineItemForm
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
          action={updateOpportunityLineItem}
        />
      )}
    </>
  );
};

export default LineItemsSection;
