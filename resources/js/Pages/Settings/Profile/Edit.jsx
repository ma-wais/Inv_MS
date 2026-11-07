import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';
import React, { useEffect, useRef, useState } from 'react';
import FloatingInput from '../../../Components/FloatingInput';
import PhoneInput from '../../../Components/PhoneInput';
import CnicInput from '../../../Components/CnicInput';

export default function Edit({ user }) {
    const { flash } = usePage().props;
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(user.image_url);

    // Profile info form
    const infoForm = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        cnic: user.cnic ?? '',
        image: null,
        remove_image: false,
        _method: 'PUT', // For multipart form data via POST in Inertia
    });

    // Password change form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
        _method: 'PUT',
    });

    useEffect(() => {
        if (!infoForm.data.image) {
            setImagePreview(infoForm.data.remove_image ? null : user.image_url);
            return;
        }
        const url = URL.createObjectURL(infoForm.data.image);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [infoForm.data.image, infoForm.data.remove_image, user.image_url]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                infoForm.setError('image', 'Choose a JPG, PNG, or WebP image smaller than 2 MB.');
                e.target.value = '';
                return;
            }
            infoForm.clearErrors('image');
            infoForm.setData('remove_image', false);
            infoForm.setData('image', file);
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
                infoForm.reset('image', 'remove_image');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
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
                    <h1 className="text-xl font-bold text-foreground">My Profile</h1>
                    <p className="text-xs text-muted mt-1">Manage your account information, profile photo, and password.</p>
                </div>

                {flash.status && (
                    <div className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
                        {flash.status}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Combined Profile Info Form Card */}
                    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-foreground mb-4 font-sans">Account Details</h2>
                        <form onSubmit={handleInfoSubmit} className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-line-soft">
                                <button type="button" aria-label="Change profile photo" className="relative group cursor-pointer" onClick={triggerFileInput}>
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile"
                                            className="h-20 w-20 rounded-full object-cover border border-line shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-surface-hover text-subtle border border-line flex items-center justify-center text-2xl font-bold font-sans uppercase">
                                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 rounded-full bg-action/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                                        Change photo
                                    </div>
                                </button>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-sm font-semibold text-foreground">Profile Photo</h3>
                                    <p className="text-xs text-subtle mt-1 max-w-md leading-relaxed">
                                        Upload a high-resolution image to represent your account. Max file size: 2MB. Click on the circle to select a file.
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                    />
                                    {imagePreview && <button type="button" onClick={() => { infoForm.setData('image', null); infoForm.setData('remove_image', true); }} className="mt-2 text-xs font-semibold text-danger-ink">Remove photo</button>}
                                    {infoForm.errors.image && <p role="alert" className="mt-2 text-xs text-danger-ink">{infoForm.errors.image}</p>}
                                    {infoForm.progress && <progress aria-label="Photo upload progress" className="mt-2 w-full" value={infoForm.progress.percentage} max="100" />}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <CnicInput value={infoForm.data.cnic} onChange={e => infoForm.setData('cnic', e.target.value)} error={infoForm.errors.cnic} />
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

                                    <PhoneInput
                                        id="phone"
                                        name="phone"
                                        label="Phone Number"
                                        value={infoForm.data.phone}
                                        onChange={(e) => infoForm.setData('phone', e.target.value)}
                                        error={infoForm.errors.phone}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={infoForm.processing}
                                className="rounded-xl bg-action px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                {infoForm.processing ? 'Saving changes...' : 'Save Profile Details'}
                            </button>
                        </form>
                    </div>

                    {/* Security Form Card */}
                    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-foreground mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <FloatingInput name="current_password" type="password" label="Current password" autoComplete="current-password" required value={passwordForm.data.current_password} onChange={e => passwordForm.setData('current_password', e.target.value)} error={passwordForm.errors.current_password} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FloatingInput
                                    id="password"
                                    name="password"
                                    type="password"
                                    label="New Password"
                                    autoComplete="new-password"
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
                                    autoComplete="new-password"
                                    required
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    error={passwordForm.errors.password_confirmation}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="rounded-xl bg-action px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                {passwordForm.processing ? 'Updating password...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
