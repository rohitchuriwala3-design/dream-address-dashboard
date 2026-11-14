import { getUsers } from "@/actions/get-users";
import React from "react";
import Container from "../../components/ui/Container";
import { InviteForm } from "./components/IviteForm";
import { Separator } from "@/components/ui/separator";

import { getSession } from "@/lib/auth-server";
import { AdminUserDataTable } from "./table-components/data-table";
import { columns } from "./table-components/columns";
import { Button } from "@/components/ui/button";
import SendMailToAll from "./components/send-mail-to-all";
import { getTranslations } from "next-intl/server";
import { prismadb } from "@/lib/prisma";
import { OrganizationalAssignments } from "./components/organizational-assignments";

const AdminUsersPage = async () => {
  const t = await getTranslations("AdminPage");

  const session = await getSession();

  if (session?.user?.role !== "admin") {
    return (
      <Container
        title={t("title")}
        description={t("accessNotAllowed")}
      >
        <div className="flex w-full h-full items-center justify-center">
          {t("accessNotAllowed")}
        </div>
      </Container>
    );
  }

  const [users, accessLevels] = await Promise.all([
    getUsers(),
    prismadb.nexusAccessLevel.findMany({ where: { isActive: true }, orderBy: { rank: "asc" }, select: { id: true, name: true, slug: true, rank: true } }),
  ]);

  return (
    <Container
      title={t("users.title")}
      description={t("users.description")}
    >
      <section className="flex flex-col gap-4 rounded-lg border p-4 sm:p-6">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
          {t("users.inviteHeading")}
        </h4>
        <InviteForm />
      </section>
      <Separator className="my-6" />
      <OrganizationalAssignments users={users} levels={accessLevels} />
      <Separator className="my-6" />
      <div>
        <SendMailToAll />
      </div>
      <Separator className="my-6" />

      <AdminUserDataTable columns={columns} data={users} />
    </Container>
  );
};

export default AdminUsersPage;
