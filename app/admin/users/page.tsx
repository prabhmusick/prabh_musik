"use client";

import * as React from "react";
import { Users } from "lucide-react";

import { PageHeader } from "../../../components/admin/PageHeader";
import { UserTable } from "../../../components/admin/users/UserTable";
import { UserFilters } from "../../../components/admin/users/UserFilters";
import { useUsers } from "../../../hooks/useUsers";
import { EmptyState } from "../../../components/admin/EmptyState";
import { TableSkeleton } from "../../../components/admin/LoadingSkeleton";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  // Filter users based on name, email, mobile, and status select values
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      // 1. Search query matching
      if (search) {
        const query = search.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesMobile =
          user.mobile?.toLowerCase().includes(query) || false;

        if (!matchesName && !matchesEmail && !matchesMobile) return false;
      }

      // 2. Status matching
      if (statusFilter && user.status !== statusFilter) return false;

      return true;
    });
  }, [users, search, statusFilter]);

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      {/* Ambient Accent Glow */}
      <div className="absolute top-[-100px] right-[-100px] h-[400px] w-[400px] bg-gradient-to-b from-accent/5 to-transparent blur-[100px] pointer-events-none -z-10" />

      <PageHeader
        title="User Directory"
        description="Monitor, view, block, or unblock marketplace users."
      />

      <UserFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleResetFilters}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : filteredUsers.length > 0 ? (
        <UserTable users={filteredUsers} />
      ) : (
        <EmptyState
          title={
            search || statusFilter ? "No Users Found" : "No Users Registered"
          }
          description={
            search || statusFilter
              ? "Try adjusting your search query or removing status filters."
              : "No users are registered in the system."
          }
          icon={<Users size={40} />}
        />
      )}
    </div>
  );
}
