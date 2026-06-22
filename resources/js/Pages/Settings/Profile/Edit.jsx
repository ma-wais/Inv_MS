import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useRef, useState } from 'react';
import FloatingInput from '../../../Components/FloatingInput';

export default function Edit({ user }) {
    const { flash } = usePage().props;
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(user.image_url);

    // Profile info form
    const infoForm = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        image: null,
        _method: 'PUT', // For multipart form data via POST in Inertia
    });

    // Password change form
    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
        _method: 'PUT',
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            infoForm.setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        infoForm.post('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                infoForm.reset('image');
            }
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.post('/profile', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            }
        });
    };

    return (
        <AuthenticatedLayout title="My Profile">
            <Head title="My Profile" />

            <div className="mx-auto max-w-4xl space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage your account information, profile photo, and password.</p>
                </div>

                {flash.status && (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {flash.status}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left: Profile Photo Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit flex flex-col items-center text-center">
                        <h2 className="text-sm font-bold text-slate-800 self-start mb-4">Profile Picture</h2>
                        
                        <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Profile"
                                    className="h-28 w-28 rounded-full object-cover border border-slate-200 shadow-sm"
                                />
                            ) : (
                                <div className="h-28 w-28 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-3xl font-bold font-sans uppercase">
                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                                Change photo
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                            Upload a high-resolution image to represent your account. Max file size: 2MB.
                        </p>
                    </div>

                    {/* Right: Forms Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Info Form Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-800 mb-4">Account Information</h2>
                            <form onSubmit={handleInfoSubmit} className="space-y-4">
                                <FloatingInput
                                    id="name"
                                    name="name"
                                    label="Full Name"
                                    required
                                    value={infoForm.data.name}
                                    onChange={(e) => infoForm.setData('name', e.target.value)}
                                    error={infoForm.errors.name}
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FloatingInput
                                        id="email"
                                        name="email"
                                        type="email"
                                        label="Email Address"
                                        required
                                        value={infoForm.data.email}
                                        onChange={(e) => infoForm.setData('email', e.target.value)}
                                        error={infoForm.errors.email}
                                    />

                                    <FloatingInput
                                        id="phone"
                                        name="phone"
                                        label="Phone Number"
                                        value={infoForm.data.phone}
                                        onChange={(e) => infoForm.setData('phone', e.target.value)}
                                        error={infoForm.errors.phone}
                                        placeholder="e.g. +92 300 1234567"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={infoForm.processing}
                                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60"
                                >
                                    {infoForm.processing ? 'Saving changes...' : 'Save Profile Details'}
                                </button>
                            </form>
                        </div>

                        {/* Security Form Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-800 mb-4">Change Password</h2>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FloatingInput
                                        id="password"
                                        name="password"
                                        type="password"
                                        label="New Password"
                                        required
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        error={passwordForm.errors.password}
                                    />

                                    <FloatingInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        label="Confirm New Password"
                                        required
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        error={passwordForm.errors.password_confirmation}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60"
                                >
                                    {passwordForm.processing ? 'Updating password...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
