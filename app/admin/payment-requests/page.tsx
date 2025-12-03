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
            })) as PaymentRequest[];
            setRequests(requestsData);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to fetch payment requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (id: string, type: "approve" | "reject" | "delete") => {
        setSelectedAction({ id, type });
        setShowMPINVerify(true);
    };

    const executeAction = async () => {
        if (!selectedAction || !user) return;

        setProcessingId(selectedAction.id);
        try {
            const requestRef = doc(db, "paymentRequests", selectedAction.id);
            const request = requests.find(r => r.id === selectedAction.id);

            if (selectedAction.type === "approve") {
                if (request) {
                    // Activate user subscription
                    await activateSubscription(request.userId);

                    // Update request status
                    await updateDoc(requestRef, {
                        status: "approved",
                        processedDate: serverTimestamp(),
                        processedBy: user.email
                    });
                    toast.success("Payment approved & subscription activated");
                }
            } else if (selectedAction.type === "reject") {
                await updateDoc(requestRef, {
                    status: "rejected",
                    processedDate: serverTimestamp(),
                    processedBy: user.email
                });
                toast.success("Payment request rejected");
            } else if (selectedAction.type === "delete") {
                await deleteDoc(requestRef);
                toast.success("Request deleted");
            }

            fetchRequests();
        } catch (error) {
            console.error("Error processing request:", error);
            toast.error("Failed to process request");
        } finally {
            setProcessingId(null);
            setSelectedAction(null);
        }
    };

    return (
        <AdminGuard>
            <div className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Payment Requests</h1>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : requests.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No payment requests found.
                            </CardContent>
                        </Card>
                    ) : (
                        requests.map((request) => (
                            <Card key={request.id} className="overflow-hidden">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg">{request.userName}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {request.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Requested: {request.requestDate?.toDate().toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4">
                                            <p className="text-2xl font-bold">SR {request.amount}</p>
                                            <p className="text-xs text-muted-foreground">4 Months</p>
                                        </div>

                                        {request.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(request.id, "approve")}
                                                    disabled={!!processingId}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleAction(request.id, "reject")}
                                                    disabled={!!processingId}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}

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
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {user?.mpinHash && (
                    <MPINVerify
                        open={showMPINVerify}
                        onClose={() => setShowMPINVerify(false)}
                        mpinHash={user.mpinHash}
                        onSuccess={executeAction}
                        title={`Confirm ${selectedAction?.type}`}
                        description="Enter MPIN to confirm this action"
                    />
                )}
            </div>
        </AdminGuard>
    );
}
