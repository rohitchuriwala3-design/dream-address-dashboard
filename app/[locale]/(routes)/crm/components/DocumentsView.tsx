"use client";

import { columns } from "@/app/[locale]/(routes)/documents/components/columns";
import { DocumentsDataTable } from "@/app/[locale]/(routes)/documents/components/data-table";
import { BulkUploadModal } from "@/app/[locale]/(routes)/documents/components/bulk-upload-modal";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DocumentsViewProps {
  data: any;
  accountId?: string;
  leadId?: string;
}

const DocumentsView = ({ data, accountId, leadId }: DocumentsViewProps) => {
  const [expanded, setExpanded] = useState(Boolean(data?.length));
  const count = Array.isArray(data) ? data.length : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Documents & files</CardTitle>
            <CardDescription>{count} {count === 1 ? "file" : "files"} linked to this record</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(accountId || leadId) && <BulkUploadModal accountId={accountId} leadId={leadId} />}
            <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Collapse documents" : "Expand documents"} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Separator />
      </CardHeader>
      {expanded && <CardContent>
        {!data || data.length === 0 ? (
          "No assigned documents found"
        ) : (
          <DocumentsDataTable data={data} columns={columns} />
        )}
      </CardContent>}
    </Card>
  );
};

export default DocumentsView;
