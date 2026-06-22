import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import FloatingInput from '../../Components/FloatingInput';
import SearchableSelect from '../../Components/SearchableSelect';

export default function MediaGallery({ mediaList }) {
    const { flash } = usePage().props;
    const [selectedTab, setSelectedTab] = useState('all'); // all, Shop, Workers, Other

    const form = useForm({
        file: null,
        label: 'Shop',
        description: '',
    });

    const filteredMedia = mediaList.filter(item => {
        if (selectedTab === 'all') return true;
        return item.label === selectedTab;
    });

    function submit(event) {
        event.preventDefault();
        form.post('/settings/media', {
            forceFormData: true,
            onSuccess: () => {
                form.reset('file', 'description');
                // Reset file input element manually
                document.getElementById('file-input').value = '';
            }
        });
    }

    function handleDelete(mediaId, filename) {
        if (confirm(`Are you sure you want to delete "${filename}"? This will remove the file from storage.`)) {
            router.delete(`/settings/media/${mediaId}`);
        }
    }

    return (
        <AuthenticatedLayout title="Media Gallery">
            <Head title="Media Gallery" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Shop & Staff Media Gallery</h1>
                    <p className="text-sm text-slate-500">Upload and manage pictures of your shop branches, warehouses, employees, or operational documents.</p>
                </div>

                {flash.status && (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        {flash.status}
                    </div>
                )}

                {/* Upload Form Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Upload New Picture</h2>
                    
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3 items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select Image</span>
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => form.setData('file', e.target.files[0])}
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                            />
                            {form.errors.file && <p className="mt-1 text-xs text-red-600">{form.errors.file}</p>}
                        </div>

                        <SearchableSelect
                            label="Category Label"
                            value={form.data.label}
                            onChange={(e) => form.setData('label', e.target.value)}
                            options={[
                                { value: 'Shop', label: 'Shop & Warehouses' },
                                { value: 'Workers', label: 'Staff & Workers' },
                                { value: 'Other', label: 'Other Documents' }
                            ]}
                            required
                            error={form.errors.label}
                        />

                        <FloatingInput
                            label="Short Description / Note"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            error={form.errors.description}
                        />

                        <div className="md:col-span-3 flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                            >
                                {form.processing ? 'Uploading...' : 'Upload Picture'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Filter and Grid Gallery */}
                <div className="space-y-4">
                    {/* Tabs */}
                    <div className="flex rounded-lg bg-slate-200/60 p-0.5 text-xs font-medium text-slate-600 self-start w-fit">
                        {[
                            { key: 'all', label: `All Pictures (${mediaList.length})` },
                            { key: 'Shop', label: 'Shop & Warehouses' },
                            { key: 'Workers', label: 'Staff & Workers' },
                            { key: 'Other', label: 'Other Documents' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setSelectedTab(tab.key)}
                                className={`rounded-md px-3 py-1.5 transition ${selectedTab === tab.key ? 'bg-white font-bold text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Gallery Cards Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredMedia.length > 0 ? (
                            filteredMedia.map((row) => (
                                <div key={row.id} className="group relative rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200">
                                    {/* Image Wrapper */}
                                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                                        <img
                                            src={row.url}
                                            alt={row.filename}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs uppercase tracking-wider ${
                                            row.label === 'Shop' ? 'bg-blue-100 text-blue-800' :
                                            row.label === 'Workers' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {row.label === 'Shop' ? 'Shop' : row.label === 'Workers' ? 'Workers' : 'Other'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(row.id, row.filename)}
                                            className="absolute top-3 right-3 rounded-full bg-red-50 p-1.5 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                                            title="Delete picture"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-400 font-mono truncate" title={row.filename}>
                                                {row.filename}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {row.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 self-end font-medium">
                                            Uploaded: {row.created_at}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white">
                                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-4 text-sm font-medium">No pictures uploaded in this category.</p>
                                <p className="text-xs text-slate-400 mt-1">Use the uploader above to add pictures of your shop or workers.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
