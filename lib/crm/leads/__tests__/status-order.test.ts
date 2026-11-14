jest.mock("@/lib/prisma", () => ({ prismadb: {} }));

import { orderLeadStatuses } from "../status-order";

const statuses = [
  { id: "lost", name: "Lost" },
  { id: "qualified", name: "Qualified" },
  { id: "contacted", name: "Contacted" },
  { id: "new", name: "New" },
];

describe("lead status path ordering", () => {
  it("uses a funnel order by default instead of alphabetic order", () => {
    expect(orderLeadStatuses(statuses, []).map((status) => status.id)).toEqual(["new", "contacted", "qualified", "lost"]);
  });

  it("honors an admin's configured order and places later statuses after it", () => {
    const withLater = [...statuses, { id: "site-visit", name: "Site visit" }];
    expect(orderLeadStatuses(withLater, ["qualified", "new", "contacted", "lost"]).map((status) => status.id)).toEqual([
      "qualified", "new", "contacted", "lost", "site-visit",
    ]);
  });
});
