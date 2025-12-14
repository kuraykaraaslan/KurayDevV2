'use client';

import { useState } from 'react';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import useGlobalStore from '@/libs/zustand';

export default function SecurityTab() {
  const { setUser } = useGlobalStore();
  const [data, setData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const update = (e: any) =>
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (data.newPassword !== data.confirmPassword)
      return toast.error("Yeni şifreler eşleşmiyor");

    try {
      setLoading(true);
      const res = await axiosInstance.post('/api/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success("Şifre değiştirildi");
      setUser(res.data.user);
      setData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      <div>
        <h2 className="text-lg font-bold">Şifre Değiştir</h2>
        <p className="text-sm text-base-content/70">Hesap güvenliğini artır.</p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {["currentPassword", "newPassword", "confirmPassword"].map(field => (
          <div key={field} className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                {field === "currentPassword" ? "Mevcut Şifre" :
                 field === "newPassword" ? "Yeni Şifre" : "Yeni Şifre Tekrar"}
              </span>
            </label>
            <input
              type="password"
              name={field}
              value={(data as any)[field]}
              onChange={update}
              className="input input-bordered"
              required
            />
          </div>
        ))}

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>
    </div>
  );
}
