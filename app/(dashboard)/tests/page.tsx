"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  ListChecks,
  Users,
  BarChart3,
  Pencil,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useTestStore } from "@/stores/test";
import Link from "next/link";
import { DialogProvider, useConfirm } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }
> = {
  draft: { label: "Qoralama", variant: "default" },
  active: { label: "Faol", variant: "success" },
  completed: { label: "Tugagan", variant: "info" },
  archived: { label: "Arxiv", variant: "warning" },
};

function TestsPageContent() {
  const router = useRouter();
  const {
    tests,
    totalTests,
    currentPage,
    totalPages,
    isLoading,
    fetchTests,
    deleteTest,
    duplicateTest,
  } = useTestStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const showConfirm = useConfirm();

  useEffect(() => {
    fetchTests({ page, status: statusFilter, search: search || undefined });
  }, [page, statusFilter, search, fetchTests]);

  const handleSearch = () => {
    setPage(1);
    fetchTests({ page: 1, status: statusFilter, search: search || undefined });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Testni o'chirish",
      description: "Testni o'chirishni xohlaysizmi?",
      variant: "warning",
      confirmText: "O'chirish",
      cancelText: "Bekor qilish",
    });
    if (!confirmed) return;
    await deleteTest(id);
    toast.success("Test o'chirildi");
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTest(id);
      toast.success("Test nusxalandi");
      fetchTests({ page, status: statusFilter, search: search || undefined });
    } catch {
      toast.error("Nusxalashda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight text-[var(--color-ink)]">
            Testlar
          </h1>
          <p className="text-[var(--color-slate)] mt-1">
            {totalTests} ta test
          </p>
        </div>
        <Link href="/tests/create">
          <Button>
            <Plus className="h-4 w-4" />
            Yangi test
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-slate-light)]" />
          <Input
            placeholder="Test qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44"
        >
          <option value="all">Barcha holatlar</option>
          <option value="draft">Qoralama</option>
          <option value="active">Faol</option>
          <option value="completed">Tugagan</option>
          <option value="archived">Arxiv</option>
        </Select>
      </div>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft-sm)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead className="text-center">Savollar</TableHead>
              <TableHead className="text-center">Urinishlar</TableHead>
              <TableHead className="text-center">O&apos;rtacha</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-8 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                </TableRow>
              ))
            ) : tests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-[var(--color-slate)]"
                >
                  <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Test topilmadi</p>
                  <Link href="/tests/create" className="text-xs text-[var(--color-deep)] mt-2 inline-block hover:underline">
                    Yangi test yaratish →
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => {
                const statusInfo = STATUS_MAP[test.status] || STATUS_MAP.draft;
                return (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-volt)]/15 flex items-center justify-center shrink-0">
                          <ListChecks
                            size={16}
                            className="text-[var(--color-deep)]"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/tests/${test.id}`}
                            className="font-medium text-[var(--color-ink)] text-sm hover:text-[var(--color-deep)] transition-colors"
                          >
                            {test.title}
                          </Link>
                          <p className="text-xs text-[var(--color-slate-light)]">
                            {new Date(test.created_at).toLocaleDateString(
                              "uz-UZ"
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{test.test_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {test.questions_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users size={14} className="text-[var(--color-slate)]" />
                        <span>{test.attempts_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <BarChart3
                          size={14}
                          className="text-[var(--color-slate)]"
                        />
                        <span>
                          {test.avg_score > 0 ? `${test.avg_score}%` : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <button className="rounded-full p-1.5 text-[var(--color-slate)] hover:bg-[var(--color-mist)] transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownTrigger>
                        <DropdownContent>
                          <DropdownItem onClick={() => router.push(`/tests/${test.id}`)}>
                            <Eye size={14} className="mr-2" />
                            Ko&apos;rish
                          </DropdownItem>
                          {test.status === "draft" && (
                            <DropdownItem onClick={() => router.push(`/tests/${test.id}`)}>
                              <Pencil size={14} className="mr-2" />
                              Tahrirlash
                            </DropdownItem>
                          )}
                          <DropdownItem onClick={() => handleDuplicate(test.id)}>
                            <Copy size={14} className="mr-2" />
                            Nusxalash
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            danger
                            onClick={() => handleDelete(test.id)}
                          >
                            <Trash2 size={14} className="mr-2" />
                            O&apos;chirish
                          </DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center py-4 border-t border-[var(--color-line)]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <DialogProvider>
      <ToastProvider>
        <TestsPageContent />
      </ToastProvider>
    </DialogProvider>
  );
}
