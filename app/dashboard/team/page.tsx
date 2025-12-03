"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import { Users, UserPlus, Trash2, Mail, Shield, Phone, Send } from "lucide-react";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { TeamMember } from "@/lib/types";

export default function TeamPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [newMemberMobile, setNewMemberMobile] = useState("");
    const [showMPINVerify, setShowMPINVerify] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
    const [actionType, setActionType] = useState<"add" | "delete">("add");

    const fetchTeamMembers = useCallback(async () => {
        if (!user) return;
        try {
            const q = query(collection(db, "users", user.uid, "teamMembers"));
            const querySnapshot = await getDocs(q);
            const teamData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TeamMember[];
            setMembers(teamData);
        } catch (error) {
            console.error("Error fetching team members:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchTeamMembers();
        }
    }, [user, fetchTeamMembers]);

    const handleAddMember = async () => {
        if (!user || !newMemberEmail) return;

        // Check if MPIN is set
        if (!user.mpinHash) {
            toast.error("Please set up your MPIN in Settings first");
            return;
        }

        setActionType("add");
        setShowMPINVerify(true);
    };

    const handleDeleteClick = (memberId: string) => {
        if (!user?.mpinHash) {
            toast.error("Please set up your MPIN in Settings first");
            return;
        }
        setMemberToDelete(memberId);
        setActionType("delete");
        setShowMPINVerify(true);
    };

    const onMPINVerified = async () => {
        if (actionType === "add") {
            await executeAddMember();
        } else {
            await executeDeleteMember();
        }
    };

    const executeAddMember = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Check if already exists
            const exists = members.some(m => m.memberEmail === newMemberEmail);
            if (exists) {
                toast.error("This email is already in your team");
                return;
            }

            await addDoc(collection(db, "users", user.uid, "teamMembers"), {
                ownerId: user.uid,
                memberEmail: newMemberEmail,
                memberMobile: newMemberMobile,
                addedAt: serverTimestamp(),
                status: "active"
            });

            toast.success("Team member added successfully");
            setNewMemberEmail("");
            setNewMemberMobile("");
            setIsAddDialogOpen(false);
            fetchTeamMembers();
        } catch (error) {
            console.error("Error adding team member:", error);
            toast.error("Failed to add team member");
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteMember = async () => {
        if (!memberToDelete || !user) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, "users", user.uid, "teamMembers", memberToDelete));
            toast.success("Team member removed");
            setMemberToDelete(null);
            fetchTeamMembers();
        } catch (error) {
            console.error("Error removing team member:", error);
            toast.error("Failed to remove team member");
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

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your team members and their access
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Enter the email address of the team member you want to add.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mobile">Mobile Number (WhatsApp)</Label>
                                <Input
                                    id="mobile"
                                    type="tel"
                                    placeholder="e.g. 923001234567"
                                    value={newMemberMobile}
                                    onChange={(e) => setNewMemberMobile(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleAddMember} disabled={loading}>
                                {loading ? "Adding..." : "Add Member"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {members.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-primary/10 p-4 mb-4">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">No team members yet</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                Add team members to collaborate on your logistics operations.
                            </p>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                                Add Your First Member
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                            <Card key={member.id} className="group hover:border-primary/50 transition-all">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-red-500 -mt-1 -mr-2"
                                        onClick={() => handleDeleteClick(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        {member.memberEmail ? (
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.memberEmail}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium truncate hover:text-primary underline cursor-pointer"
                                                title={`Send email to ${member.memberEmail}`}
                                            >
                                                {member.memberEmail}
                                            </a>
                                        ) : (
                                            <span className="font-medium truncate text-muted-foreground">
                                                No email provided
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        {member.memberMobile ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">{member.memberMobile}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => window.open(`https://web.whatsapp.com/send?phone=${member.memberMobile}`, '_blank')}
                                                    title="Open WhatsApp Web"
                                                >
                                                    <Send className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="font-medium truncate text-muted-foreground">
                                                No mobile provided
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Shield className="h-3 w-3" />
                                        <span>Active Member</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {user?.mpinHash && (
                <MPINVerify
                    open={showMPINVerify}
                    onClose={() => setShowMPINVerify(false)}
                    mpinHash={user.mpinHash}
                    onSuccess={onMPINVerified}
                    title={actionType === "add" ? "Verify to Add Member" : "Verify to Remove Member"}
                    description="Enter your MPIN to confirm this action"
                />
            )}
        </div>
    );
}
