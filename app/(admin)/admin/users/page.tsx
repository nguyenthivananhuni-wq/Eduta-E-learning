import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFilters } from "@/components/admin/UserFilters";
import { UserActionsMenu } from "@/components/admin/UserActionsMenu";

export const metadata = { title: "Người dùng — Admin" };
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Học viên",
  INSTRUCTOR: "Giảng viên",
  ADMIN: "Admin",
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  INSTRUCTOR: "secondary",
  STUDENT: "outline",
};

type SearchParams = Promise<{ q?: string; role?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const role = sp.role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(sp.role) ? sp.role : undefined;

  const users = await db.user.findMany({
    where: {
      ...(role ? { role: role as "STUDENT" | "INSTRUCTOR" | "ADMIN" } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { name: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      suspended: true,
      createdAt: true,
      _count: { select: { enrollments: true, courses: true } },
    },
  });

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="size-7" />
            Người dùng
          </h1>
          <p className="text-muted-foreground mt-1">
            Tổng {users.length} người dùng (hiển thị tối đa 200 gần nhất)
          </p>
        </div>
      </div>

      <UserFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-center">Khóa đăng ký</TableHead>
                <TableHead className="text-center">Khóa sở hữu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === session.user.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{u._count.enrollments}</TableCell>
                    <TableCell className="text-center">{u._count.courses}</TableCell>
                    <TableCell>
                      {u.suspended ? (
                        <Badge variant="destructive">Bị khóa</Badge>
                      ) : (
                        <Badge variant="success">Hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActionsMenu
                        userId={u.id}
                        userEmail={u.email}
                        userName={u.name}
                        isSuspended={u.suspended}
                        isAdmin={u.role === "ADMIN"}
                        isSelf={isSelf}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
