ALTER TABLE "crm_Opportunities"
ADD COLUMN "next_step_due_at" DATE;

CREATE INDEX "crm_Opportunities_next_step_due_at_idx"
ON "crm_Opportunities"("next_step_due_at");
