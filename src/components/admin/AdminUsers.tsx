import React, { useEffect, useState } from 'react';
import { Users, Shield, Trash2, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/user';
import { fetchUsersList, updateUserRoleApi, deleteUserApi } from '../../services/catalogApi';

interface AdminUsersProps {
  currentUserId?: string;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await fetchUsersList();
      setUsers(list);
    } catch {
      setErrorMsg('Không thể nạp danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionLoading(userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateUserRoleApi(userId, newRole);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg('Đã cập nhật vai trò người dùng thành công.');
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Không thể đổi vai trò người dùng.');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    const target = confirmDeleteUser;
    setConfirmDeleteUser(null);
    setActionLoading(target.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deleteUserApi(target.id);
    setActionLoading(null);

    if (res.success) {
      setSuccessMsg(`Đã xóa tài khoản ${target.email} thành công.`);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Không thể xóa tài khoản người dùng.');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-[#0F2A45]" />
            <span>Quản Lý Danh Sách Người Dùng ({users.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị viên có toàn quyền xem, gán vai trò (Admin / Sales) và xóa tài khoản nhân viên.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="px-3.5 py-2.5">Họ & Tên</th>
                <th className="px-3.5 py-2.5">Email</th>
                <th className="px-3.5 py-2.5">Số điện thoại</th>
                <th className="px-3.5 py-2.5">Xác thực</th>
                <th className="px-3.5 py-2.5">Vai trò</th>
                <th className="px-3.5 py-2.5">Ngày tạo</th>
                <th className="px-3.5 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Đang nạp danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Không có người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUserId === u.id;
                  const isPending = actionLoading === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0F2A45] to-[#1E4C7C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.fullName}</div>
                            {isCurrent && (
                              <span className="text-[10px] text-cyan-600 font-medium">(Bạn)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-slate-600">{u.email}</td>
                      <td className="px-3.5 py-3 text-slate-600">{u.phone || '—'}</td>
                      <td className="px-3.5 py-3">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Đã xác thực
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa xác thực
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <select
                          disabled={isCurrent || isPending}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`text-xs px-2 py-1 rounded-lg border font-semibold outline-none ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isCurrent ? 'Không thể tự thay đổi vai trò của chính mình' : undefined}
                        >
                          <option value="sales">Sales (Kinh doanh)</option>
                          <option value="admin">Admin (Quản trị viên)</option>
                        </select>
                      </td>
                      <td className="px-3.5 py-3 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => setConfirmDeleteUser(u)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa người dùng"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal xác nhận xóa người dùng */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-800">Xác Nhận Xóa Tài Khoản</h4>
              <p className="text-xs text-slate-600 mt-1">
                Bạn có chắc chắn muốn xóa tài khoản <strong>{confirmDeleteUser.email}</strong>?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="w-1/2 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteUser}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
