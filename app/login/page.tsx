"use client";

import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Truck, KeyRound, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { MPINLogin } from "@/components/auth/MPINLogin";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [showMPINLogin, setShowMPINLogin] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [videoFade, setVideoFade] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    // Video playlist with all four videos
    const videos = [
        "/videos/v1.mp4",
        "/videos/v2.mp4",
        "/videos/v3.mp4",
        "/videos/v4.mp4"
    ];

    // Handle client-side mounting to avoid hydration errors
    useEffect(() => {
        setMounted(true);
    }, []);

    // Smooth video transitions every 5 seconds
    useEffect(() => {
        if (!mounted) return;

        const interval = setInterval(() => {
            // Trigger slow fade out
            setVideoFade(true);

            // Change video after fade completes
            setTimeout(() => {
                setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
                setVideoFade(false);
            }, 200); // 200ms fade
        }, 5000); // Every 5 seconds

        return () => clearInterval(interval);
    }, [videos.length, mounted]);

    // Check for PWA installation support
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
        };

        // Check if user is on iOS Safari
        const checkIOS = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        setIsIOS(checkIOS());

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Use popup to show account selection
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                // Store the last login email in localStorage
                if (result.user.email) {
                    localStorage.setItem("last_login_email", result.user.email);
                }
                toast.success("Welcome back!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error("Google login error:", error);
            // Handle specific error codes
            if (error.code === 'auth/popup-blocked') {
                toast.error("Popup blocked. Please allow popups for this site and try again.");
            } else if (error.code === 'auth/cancelled-popup-request') {
                // User closed the popup without completing sign in
                toast.error("Sign in was cancelled. Please try again.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                // User closed the popup
                toast.error("Sign in window was closed. Please try again.");
            } else if (error.code === 'auth/network-request-failed') {
                toast.error("Network error. Please check your connection and try again.");
            } else {
                toast.error(`Login failed: ${error.message || "Please try again"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadApp = async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);

            if (outcome === 'accepted') {
                toast.success("App installation started! Check your desktop/mobile home screen for the shortcut.");
            } else {
                toast.success("Installation cancelled. You can try again later.");
            }
        } else {
            // Instructions for browsers that don't support beforeinstallprompt
            if (isIOS) {
                toast.success("To install this app on iOS: Tap the Share button, then select 'Add to Home Screen'.");
            } else {
                toast.success("To install this app: Look for the install option in your browser's address bar or menu.");
            }
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
            {/* Video Background with smooth fade */}
            {mounted && (
                <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                    <video
                        key={currentVideoIndex}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover brightness-[0.7] transition-opacity duration-200 ease-in-out"
                        style={{ opacity: videoFade ? 0 : 1 }}
                    >
                        <source src={videos[currentVideoIndex]} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="z-10 w-full max-w-md space-y-8 rounded-2xl p-8 backdrop-blur-xl bg-black/20"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-4">
                        <Truck className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">WebLogistic</h1>
                    <p className="mt-2 text-white/80">
                        Your complete logistics command center.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full py-6 text-lg font-medium transition-all hover:scale-[1.02] bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50"
                        onClick={handleLogin}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign in with Google
                            </div>
                        )}
                    </Button>

                    {loading && (
                        <p className="text-center text-sm text-white/80">
                            Please check your browser for the authentication popup
                        </p>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/30" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-white/80">Or</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full py-6 text-lg font-medium transition-all hover:scale-[1.02] bg-white/10 text-white hover:bg-white/20"
                        onClick={() => setShowMPINLogin(true)}
                        disabled={loading}
                    >
                        <KeyRound className="h-5 w-5 mr-2" />
                        Login with MPIN
                    </Button>

                    {/* Download PWA Button */}
                    <Button
                        variant="ghost"
                        className="w-full py-6 text-lg font-medium transition-all hover:scale-[1.02] bg-white/10 text-white hover:bg-white/20 mt-4"
                        onClick={handleDownloadApp}
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Install App
                    </Button>

                    <p className="text-center text-xs text-white/70">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </motion.div>

            <MPINLogin
                open={showMPINLogin}
                onClose={() => setShowMPINLogin(false)}
                onSwitchToGoogle={() => {
                    setShowMPINLogin(false);
                    handleLogin();
                }}
            />
        </div>
    );
}