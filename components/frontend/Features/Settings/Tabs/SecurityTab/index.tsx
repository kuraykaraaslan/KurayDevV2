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

    if (data.newPassword !== data.confirmPassword) return toast.error("Yeni şifreler eşleşmiyor");

    setLoading(true);

    await axiosInstance.post('/api/auth/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).then((res) => {
        toast.success("Şifre başarıyla değiştirildi");
        setUser(res.data.user);
        setData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Şifre değiştirilemedi");
      })
      .finally(() => {
        setLoading(false);
      });

  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      <div>
        <h2 className="text-lg font-bold">Şifre Değiştir</h2>
        <p className="text-sm text-base-content/70">Hesap güvenliğini artır.</p>
      </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Mevcut Şifre
              </span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={data.currentPassword}
              onChange={update}
              className="input input-bordered w-full"
              placeholder="Mevcut şifrenizi girin"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Yeni Şifre
              </span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={data.newPassword}
              onChange={update}
              className="input input-bordered w-full"
              placeholder="Yeni şifrenizi girin"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Yeni Şifre (Tekrar)
              </span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={data.confirmPassword}
              onChange={update}
              className="input input-bordered w-full"
              placeholder="Yeni şifrenizi tekrar girin"
              required
            />
          </div>
        <button disabled={loading} className="btn btn-primary w-full" onClick={submit}>
          {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
    </div>
  );
}
