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

        setActionType("add");
        setShowMPINVerify(true);
    };

    const handleDeleteClick = (memberId: string) => {
        setMemberToDelete(memberId);
        setActionType("delete");
        setShowMPINVerify(true);
    };

    const onMPINVerified = async (pin: string) => {
        // In the new approach, we just proceed with the action
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
            toast.error("Failed to add team member. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteMember = async () => {
        if (!user || !memberToDelete) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, "users", user.uid, "teamMembers", memberToDelete));
            toast.success("Team member removed successfully");
            setMemberToDelete(null);
            fetchTeamMembers();
        } catch (error) {
            console.error("Error removing team member:", error);
            toast.error("Failed to remove team member. Please try again.");
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
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your team members and their permissions
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Team Member</DialogTitle>
                                <DialogDescription>
                                    Invite a new member to join your team
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="member@example.com"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile">Mobile (Optional)</Label>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={newMemberMobile}
                                        onChange={(e) => setNewMemberMobile(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddMember} disabled={loading || !newMemberEmail}>
                                    {loading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Send Invitation
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div>
                {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by adding your first team member
                        </p>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                            <Card key={member.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <span className="text-primary font-semibold">
                                                    {member.memberEmail.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{member.memberEmail}</p>
                                                {member.memberMobile ? (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{member.memberMobile}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-medium truncate text-muted-foreground">
                                                        No mobile provided
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteClick(member.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Shield className="h-3 w-3" />
                                        <span>Active Member</span>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {user && (
                <MPINVerify
                    open={showMPINVerify}
                    onClose={() => {
                        setShowMPINVerify(false);
                        setActionType("add");
                        setMemberToDelete(null);
                    }}
                    onSuccess={onMPINVerified}
                    title={actionType === "add" ? "Verify to Add Member" : "Verify to Remove Member"}
                    description="Enter your MPIN to confirm this action"
                    userId={user.uid}
                />
            )}
        </div>
    );
}