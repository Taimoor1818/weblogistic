"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuard from "@/components/admin/AdminGuard";
import { PaymentRequest } from "@/lib/types";
import { toast } from "react-hot-toast";
import { Check, X, Trash2 } from "lucide-react";
import { activateSubscription } from "@/lib/subscription";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showMPINVerify, setShowMPINVerify] = useState(false);
    const [selectedAction, setSelectedAction] = useState<{
        id: string;
        type: "approve" | "reject" | "delete";
    } | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const q = query(collection(db, "paymentRequests"), orderBy("requestDate", "desc"));
            const querySnapshot = await getDocs(q);
            const requestsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PaymentRequest));
            setRequests(requestsData);
        } catch (error) {
            console.error("Error fetching payment requests:", error);
            toast.error("Failed to load payment requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (id: string, type: "approve" | "reject" | "delete") => {
        setSelectedAction({ id, type });
        setShowMPINVerify(true);
    };

    const executeAction = async (pin: string) => {
        // In the new approach, we just proceed with the action
        if (!selectedAction) return;
        
        const { id, type } = selectedAction;
        setProcessingId(id);
        
        try {
            if (type === "delete") {
                await deleteDoc(doc(db, "paymentRequests", id));
                toast.success("Payment request deleted");
            } else {
                const updates: any = {
                    status: type === "approve" ? "approved" : "rejected",
                    processedDate: serverTimestamp(),
                    processedBy: user?.uid
                };

                if (type === "approve") {
                    // Get the request to get the userId
                    const requestDoc = await getDocs(query(collection(db, "paymentRequests")));
                    const request = requestDoc.docs.find(d => d.id === id);
                    if (request) {
                        const requestData = request.data() as PaymentRequest;
                        // Activate the user's subscription
                        await activateSubscription(requestData.userId);
                    }
                }

                await updateDoc(doc(db, "paymentRequests", id), updates);
                toast.success(`Payment request ${type}d`);
            }

            // Refresh the list
            fetchRequests();
        } catch (error) {
            console.error(`Error ${type}ing payment request:`, error);
            toast.error(`Failed to ${type} payment request`);
        } finally {
            setProcessingId(null);
            setShowMPINVerify(false);
            setSelectedAction(null);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Payment Requests</h1>
                    <p className="text-muted-foreground mt-2">
                        Review and manage subscription payment requests
                    </p>
                </div>

                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No pending payment requests</p>
                            </CardContent>
                        </Card>
                    ) : (
                        requests.map((request) => (
                            <Card key={request.id}>
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-medium">{request.userName}</h3>
                                            <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                                            <p className="text-lg font-bold mt-2">₹{request.amount}</p>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                Status: <span className="font-medium">{request.status}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requested: {request.requestDate.toDate().toLocaleString()}
                                            </p>
                                            {request.processedDate && (
                                                <p className="text-xs text-muted-foreground">
                                                    Processed: {request.processedDate.toDate().toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {request.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAction(request.id, "approve")}
                                                    disabled={!!processingId}
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(request.id, "reject")}
                                                    disabled={!!processingId}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                        {request.status !== "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleAction(request.id, "delete")}
                                                    disabled={!!processingId}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <MPINVerify
                    open={showMPINVerify}
                    onClose={() => {
                        setShowMPINVerify(false);
                        setSelectedAction(null);
                    }}
                    onSuccess={executeAction}
                    title={`Confirm ${selectedAction?.type}`}
                    description="Enter MPIN to confirm this action"
                />
            </div>
        </AdminGuard>
    );
}