import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX,
    FiDownload,
    FiCopy,
    FiCheck,
    FiPrinter,
    FiRefreshCw,
    FiInfo,
    FiMessageCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getProjectQRCodes } from '../../api/qrcode';

const ProjectQRModal = ({ isOpen, onClose, projectId, projectName }) => {
    const [qrList, setQrList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [selectedQrIndex, setSelectedQrIndex] = useState(0);

    useEffect(() => {
        if (isOpen && projectId) {
            const fetchQRs = async () => {
                setLoading(true);
                try {
                    const res = await getProjectQRCodes({ project_id: projectId });
                    if (!res.error && res.qr_codes) {
                        setQrList(res.qr_codes);
                        setSelectedQrIndex(0);
                    } else {
                        setQrList([]);
                    }
                } catch (err) {
                    console.error('Failed to load project QR codes:', err);
                    setQrList([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchQRs();
        }
    }, [isOpen, projectId]);

    if (!isOpen) return null;

    const currentQr = qrList[selectedQrIndex] || null;
    const portalUrl = (process.env.REACT_APP_WEB_PUBLIC_URL || process.env.REACT_APP_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
    const scanUrl = currentQr ? `${portalUrl}/qr/${currentQr.qr_id}` : '';

    const handleCopyUrl = async () => {
        if (!scanUrl) return;
        try {
            await navigator.clipboard.writeText(scanUrl);
            setCopied(true);
            toast.success('QR Scan link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    const handleWhatsAppShare = () => {
        if (!scanUrl) return;
        const text = encodeURIComponent(
            `👋 Scan this QR code or click the link to start chatting with ${projectName || 'us'}: ${scanUrl}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleDownloadPng = () => {
        if (!currentQr) return;
        const canvas = document.getElementById(`client-qr-canvas-${currentQr.qr_id}`);
        if (!canvas) {
            toast.error('Canvas not ready');
            return;
        }

        const exportCanvas = document.createElement('canvas');
        const size = 600;
        const padding = 60;
        const headerHeight = 120;
        const footerHeight = 70;

        exportCanvas.width = size + padding * 2;
        exportCanvas.height = size + padding * 2 + headerHeight + footerHeight;

        const ctx = exportCanvas.getContext('2d');

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Header bar
        const gradient = ctx.createLinearGradient(0, 0, exportCanvas.width, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, exportCanvas.width, 10);

        // Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(projectName || 'Project Chat', exportCanvas.width / 2, 60);

        // Subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = '18px sans-serif';
        ctx.fillText(
            currentQr.label ? `${currentQr.label} • Scan to connect` : 'Scan with your mobile camera to join chat',
            exportCanvas.width / 2,
            95
        );

        // QR Canvas
        ctx.drawImage(canvas, padding, headerHeight + padding / 2, size, size);

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText(`ID: ${currentQr.qr_id}`, exportCanvas.width / 2, exportCanvas.height - 35);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Powered by OneChatting', exportCanvas.width / 2, exportCanvas.height - 15);

        const link = document.createElement('a');
        const fileNameSafe = (projectName || 'project').toLowerCase().replace(/[^a-z0-9]/g, '_');
        link.download = `qrcode_${fileNameSafe}_${currentQr.qr_id}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        toast.success('QR Code image downloaded!');
    };

    const handlePrint = () => {
        if (!currentQr) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups to print.');
            return;
        }

        const canvas = document.getElementById(`client-qr-canvas-${currentQr.qr_id}`);
        const dataUrl = canvas ? canvas.toDataURL('image/png') : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${projectName || 'OneChatting'}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #f8fafc;
                        color: #0f172a;
                    }
                    .card {
                        background: #ffffff;
                        border: 2px solid #e2e8f0;
                        border-radius: 24px;
                        padding: 40px;
                        text-align: center;
                        max-width: 420px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        font-size: 26px;
                        margin: 0 0 8px 0;
                        color: #1e293b;
                    }
                    p.label {
                        font-size: 16px;
                        color: #6366f1;
                        font-weight: 600;
                        margin: 0 0 20px 0;
                    }
                    .qr-container {
                        background: #ffffff;
                        padding: 16px;
                        border-radius: 16px;
                        border: 1px solid #e2e8f0;
                        display: inline-block;
                        margin-bottom: 20px;
                    }
                    .instruction {
                        font-size: 14px;
                        color: #64748b;
                        margin: 0 0 16px 0;
                        line-height: 1.5;
                    }
                    .badge {
                        display: inline-block;
                        background: #f1f5f9;
                        color: #475569;
                        font-family: monospace;
                        font-size: 12px;
                        padding: 4px 12px;
                        border-radius: 9999px;
                    }
                    @media print {
                        body { background: white; }
                        .card { border: none; box-shadow: none; padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>${projectName || 'Project Chat'}</h1>
                    ${currentQr.label ? `<p class="label">${currentQr.label}</p>` : ''}
                    <div class="qr-container">
                        <img src="${dataUrl}" width="260" height="260" alt="QR Code" />
                    </div>
                    <p class="instruction">
                        Scan this QR code with any smartphone camera or QR scanner app to start chatting instantly.
                    </p>
                    <div class="badge">Scan ID: ${currentQr.qr_id}</div>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                Project QR Code
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {projectName || 'Scan to chat'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col items-center text-center">
                        {loading ? (
                            <div className="py-16 text-center text-xs text-gray-500 dark:text-gray-400">
                                <FiRefreshCw className="animate-spin inline-block mr-2" size={16} />
                                Loading QR code...
                            </div>
                        ) : qrList.length === 0 ? (
                            <div className="py-10 space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto">
                                    <FiInfo size={28} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    No QR Code Generated Yet
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Your system administrator has not generated an official QR code for this project yet. Please contact admin to assign a QR scan point.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Multiple QR Selector if any */}
                                {qrList.length > 1 && (
                                    <div className="flex gap-2 mb-3 overflow-x-auto max-w-full pb-1">
                                        {qrList.map((qr, idx) => (
                                            <button
                                                key={qr.qr_id}
                                                onClick={() => setSelectedQrIndex(idx)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                    selectedQrIndex === idx
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}
                                            >
                                                {qr.label || `QR #${idx + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentQr?.label && (
                                    <span className="mb-3 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                                        {currentQr.label}
                                    </span>
                                )}

                                <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 inline-block mb-3">
                                    <QRCodeCanvas
                                        id={`client-qr-canvas-${currentQr.qr_id}`}
                                        value={scanUrl}
                                        size={210}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-3">
                                    Share this QR code with customers or print it on flyers/standees to let users auto-connect directly to your chatroom.
                                </p>

                                {/* URL Copy Input */}
                                <div className="w-full flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 border border-gray-200 dark:border-gray-600 mb-4">
                                    <input
                                        type="text"
                                        readOnly
                                        value={scanUrl}
                                        className="bg-transparent text-xs text-gray-700 dark:text-gray-300 flex-1 px-2 outline-none select-all font-mono truncate"
                                    />
                                    <button
                                        onClick={handleCopyUrl}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                    >
                                        {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-2 w-full">
                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                                        title="Share on WhatsApp"
                                    >
                                        <FiMessageCircle size={14} />
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={handleDownloadPng}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                                        title="Download PNG"
                                    >
                                        <FiDownload size={14} />
                                        <span>Download</span>
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl text-xs font-semibold transition-all"
                                        title="Print Stand Card"
                                    >
                                        <FiPrinter size={14} />
                                        <span>Print</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProjectQRModal;
