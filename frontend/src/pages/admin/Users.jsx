import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Users as UsersIcon, Search, Shield, ShoppingBag, Store } from "lucide-react";

const roleIcons = { admin: Shield, customer: ShoppingBag, vendor: Store };
const roleBadge = { admin: "bg-purple-100 text-purple-700", customer: "bg-blue-100 text-blue-700", vendor: "bg-pink-100 text-pink-700" };

export default function AdminUsers() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, search],
    queryFn: () => api.get(`/admin/users?role=${roleFilter}&search=${search}`),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-purple-600" /> User Management
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No users found</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const RoleIcon = roleIcons[u.role] || ShoppingBag;
                return (
                  <tr key={u._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-bold">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge[u.role] || "bg-gray-100 text-gray-700"}`}>
                        <RoleIcon className="w-3 h-3" /> {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.isActive !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {u.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => toggleMut.mutate({ id: u._id, isActive: u.isActive === false })}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive !== false ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                        >
                          {u.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
