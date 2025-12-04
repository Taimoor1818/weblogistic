"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { updateUserDocument } from "@/lib/subscription";
import { MPINSetup } from "@/components/auth/MPINSetup";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { toast } from "react-hot-toast";
import { Building2, MapPin, Phone, KeyRound, User, Save, Edit2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showMPINSetup, setShowMPINSetup] = useState(false);
    const [showMPINVerify, setShowMPINVerify] = useState(false);
    const [hasMPIN, setHasMPIN] = useState(false);

    const [formData, setFormData] = useState({
        companyName: "",
        city: "",
        mobileNumber: "",
    });

    // Check if user has MPIN set
    useEffect(() => {
        const checkMPINStatus = async () => {
            if (user) {
                try {
                    const mpinRecordRef = doc(db, "mpin_records", user.uid);
                    const mpinRecordSnap = await getDoc(mpinRecordRef);
                    setHasMPIN(mpinRecordSnap.exists());
                } catch (error) {
                    console.error("Error checking MPIN status:", error);
                }
            }
        };

        checkMPINStatus();
    }, [user]);

    useEffect(() => {
        if (user) {
            setFormData({
                companyName: user.companyName || "",
                city: user.city || "",
                mobileNumber: user.mobileNumber || "",
            });
        }
    }, [user]);

    const handleEditClick = () => {
        if (!user) return;
        
        // Check if MPIN is set
        if (!hasMPIN) {
            toast.error("Please set up your MPIN first");
            setShowMPINSetup(true);
            return;
        }
        
        setShowMPINVerify(true);
    };

    const handleMPINVerified = () => {
        setIsEditing(true);
        setShowMPINVerify(false);
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateUserDocument(user.uid, formData);
            toast.success("Settings saved successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account and company information
                </p>
            </div>

            <div className="grid gap-6">
                {/* Account Information */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <CardTitle>Account Information</CardTitle>
                        </div>
                        <CardDescription>Your personal account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-muted-foreground">Email</Label>
                            <div className="px-4 py-2 rounded-lg bg-muted text-sm">
                                {user.email}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-muted-foreground">Company Name</Label>
                            {isEditing ? (
                                <Input
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="Enter company name"
                                />
                            ) : (
                                <div className="px-4 py-2 rounded-lg bg-muted text-sm">
                                    {formData.companyName || "Not set"}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">City</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Enter city"
                                    />
                                ) : (
                                    <div className="px-4 py-2 rounded-lg bg-muted text-sm">
                                        {formData.city || "Not set"}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">Mobile Number</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.mobileNumber}
                                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                        placeholder="Enter mobile number"
                                    />
                                ) : (
                                    <div className="px-4 py-2 rounded-lg bg-muted text-sm">
                                        {formData.mobileNumber || "Not set"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSave} disabled={loading} className="flex-1">
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            companyName: user.companyName || "",
                                            city: user.city || "",
                                            mobileNumber: user.mobileNumber || "",
                                        });
                                    }}
                                    variant="outline"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Manage your MPIN and security settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setShowMPINSetup(true)}
                            variant="outline"
                            className="w-full"
                        >
                            <KeyRound className="h-4 w-4 mr-2" />
                            {hasMPIN ? "Change MPIN" : "Set Up MPIN"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Use MPIN to secure sensitive operations like editing and deleting data
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            {user && (
                <MPINSetup
                    open={showMPINSetup}
                    onClose={() => setShowMPINSetup(false)}
                    userId={user.uid}
                    userEmail={user.email}
                    onSuccess={() => {
                        toast.success("MPIN set successfully!");
                        setHasMPIN(true);
                    }}
                />
            )}

            {user && (
                <MPINVerify
                    open={showMPINVerify}
                    onClose={() => setShowMPINVerify(false)}
                    onSuccess={handleMPINVerified}
                    title="Verify to Edit"
                    description="Enter your MPIN to edit company profile"
                />
            )}
        </div>
    );
}