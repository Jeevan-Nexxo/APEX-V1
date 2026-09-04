import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, Shield, Eye, Briefcase, GraduationCap, Mail, Phone, Building, MapPin, FolderOpen, Star, Home } from "lucide-react";

function Users() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [statusDialogUser, setStatusDialogUser] = useState(null);
  const [statusAction, setStatusAction] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/admin/users", { params });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter, statusFilter]);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role) setRoleFilter(role);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (sortField === "full_name" || sortField === "email") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, sortField, sortDir]);

  const generateUserNumber = (id) => {
    if (!id) return "N/A";
    const hash = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `APX-U-${hash}`;
  };

  const openUserDetail = async (userId) => {
    setSelectedUser(userId);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setDetailData(res.data.user);
    } catch (err) {
      toast.error("Failed to load user details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmStatusChange = (user, action) => {
    setStatusDialogUser(user);
    setStatusAction(action);
  };

  const executeStatusChange = async () => {
    if (!statusDialogUser) return;
    try {
      setActionLoading(true);
      const newStatus = statusAction === "block" ? "blocked" : "active";
      await api.patch(`/admin/users/${statusDialogUser.id}/status`, { account_status: newStatus });
      toast.success(`User ${statusAction === "block" ? "blocked" : "unblocked"} successfully.`);
      setStatusDialogUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const roleBadge = (role) => {
    const map = {
      student: { variant: "default", icon: GraduationCap },
      visitor: { variant: "secondary", icon: Eye },
      manager: { variant: "outline", icon: Briefcase },
      admin: { variant: "destructive", icon: Shield },
    };
    const { variant, icon: Icon } = map[role] || map.student;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage student, visitor, manager, and admin accounts.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" /> Home
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setSearchParams((p) => { const np = new URLSearchParams(p); if (e.target.value) np.set("role", e.target.value); else np.delete("role"); return np; }); }}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="visitor">Visitor</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">S.No</th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("id")}>
                    <span className="inline-flex items-center">APEX User Number <SortIcon field="id" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("full_name")}>
                    <span className="inline-flex items-center">Name <SortIcon field="full_name" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("role")}>
                    <span className="inline-flex items-center">Role <SortIcon field="role" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("account_status")}>
                    <span className="inline-flex items-center">Status <SortIcon field="account_status" /></span>
                  </th>
                  <th className="px-4 py-3 font-medium">Control</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u, idx) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openUserDetail(u.id)}
                        className="font-mono text-xs font-medium text-primary hover:underline cursor-pointer"
                      >
                        {generateUserNumber(u.id)}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{u.full_name}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.account_status === "blocked" ? "destructive" : "secondary"}>
                        {u.account_status || "active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.account_status === "blocked" ? (
                        <Button variant="outline" size="sm" onClick={() => confirmStatusChange(u, "unblock")}>
                          Unblock
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => confirmStatusChange(u, "block")}>
                          Block
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Total: {users.length} user{users.length !== 1 ? "s" : ""}</p>

      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) { setSelectedUser(null); setDetailData(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold shrink-0">
                  {detailData.profile_picture ? (
                    <img src={detailData.profile_picture} alt={detailData.full_name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    detailData.full_name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{detailData.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{detailData.email}</p>
                  <div className="mt-1">{roleBadge(detailData.role)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{detailData.email}</span>
                </div>
                {detailData.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{detailData.profile.phone}</span>
                  </div>
                )}
                {detailData.role === "student" && detailData.profile && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{detailData.profile.college}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{detailData.profile.department} &middot; {detailData.profile.year_of_study}</span>
                    </div>
                  </>
                )}
                {detailData.role === "visitor" && detailData.profile && (
                  <>
                    {detailData.profile.organization && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{detailData.profile.organization}</span>
                      </div>
                    )}
                    {detailData.profile.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{detailData.profile.purpose}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {detailData.role === "student" && (
                  <div className="rounded-xl border border-border bg-background p-3">
                    <FolderOpen className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-lg font-semibold text-foreground">{detailData.projectCount}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                )}
                {detailData.role === "visitor" && (
                  <div className="rounded-xl border border-border bg-background p-3">
                    <Eye className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-lg font-semibold text-foreground">{detailData.projectViewCount}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                )}
                {detailData.role === "manager" && (
                  <div className="rounded-xl border border-border bg-background p-3">
                    <Star className="mx-auto h-4 w-4 text-muted-foreground" />
                    <p className="mt-1 text-lg font-semibold text-foreground">{detailData.projectReviewCount}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {detailData.account_status === "blocked" ? (
                  <Button variant="outline" onClick={() => { setSelectedUser(null); setDetailData(null); confirmStatusChange(detailData, "unblock"); }}>
                    Unblock User
                  </Button>
                ) : (
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => { setSelectedUser(null); setDetailData(null); confirmStatusChange(detailData, "block"); }}>
                    Block User
                  </Button>
                )}
                <DialogClose render={<Button />}>Close</DialogClose>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">User not found.</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!statusDialogUser} onOpenChange={(open) => { if (!open) setStatusDialogUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction === "block" ? "Block User?" : "Unblock User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction === "block"
                ? `Are you sure you want to block ${statusDialogUser?.full_name}? They will not be able to access the platform until unblocked.`
                : `Are you sure you want to unblock ${statusDialogUser?.full_name}? They will regain access to the platform.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeStatusChange} disabled={actionLoading} className={statusAction === "block" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {statusAction === "block" ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Users;
