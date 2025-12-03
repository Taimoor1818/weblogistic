"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import { CreditCard, Copy, MessageCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaymentRequest } from "@/lib/types";

export default function PaymentPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

    const BANK_DETAILS = {
        accountName: "Taimoor Shah",
        iban: "PK48UNIL0109000306653591",
        whatsapp: "+966537499276",
        amount: 400,
        currency: "SR",
        duration: "4 months",
    };

    const checkExistingRequest = useCallback(async () => {
        if (!user) return;

        try {
            const requestsRef = collection(db, "paymentRequests");
            const q = query(requestsRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Get the latest request
                const requests = querySnapshot.docs.map((doc) => ({
                    ...(doc.data() as PaymentRequest),
                    id: doc.id,
                }));
                const sortedRequests = requests.sort((a, b) =>
                    (b as PaymentRequest).requestDate.toMillis() - (a as PaymentRequest).requestDate.toMillis()
                );
                setPaymentRequest(sortedRequests[0]);
            }
        } catch (error) {
            console.error("Error checking payment request:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            checkExistingRequest();
        }
    }, [user, checkExistingRequest]);

    const handleRequestPayment = async () => {
        if (!user) return;

        if (paymentRequest && paymentRequest.status === "pending") {
            toast.error("You already have a pending payment request");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "paymentRequests"), {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName,
                amount: BANK_DETAILS.amount,
                status: "pending",
                requestDate: serverTimestamp(),
            });

            toast.success("Payment request submitted successfully!");
            await checkExistingRequest();
        } catch (error) {
            console.error("Error submitting payment request:", error);
            toast.error("Failed to submit payment request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!user) return null;

    const getStatusIcon = () => {
        if (!paymentRequest) return <Clock className="h-5 w-5" />;

        switch (paymentRequest.status) {
            case "approved":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "rejected":
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Subscription Payment</h1>
                <p className="text-muted-foreground mt-2">
                    Complete your payment to activate your subscription
                </p>
            </div>

            <div className="grid gap-6">
                {/* Subscription Details */}
                <Card className="border-2 border-primary/20">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <CardTitle>Subscription Plan</CardTitle>
                        </div>
                        <CardDescription>4-month access to all features</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-bold text-primary">
                                {BANK_DETAILS.currency} {BANK_DETAILS.amount}
                            </span>
                            <span className="text-muted-foreground">/ {BANK_DETAILS.duration}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Full access to all features</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Manage drivers, vehicles, customers, and trips</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Live tracking and delivery proof</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Excel export and notifications</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Transfer Details */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle>Bank Transfer Details</CardTitle>
                        <CardDescription>
                            Transfer the amount to the following account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Name</p>
                                    <p className="font-medium">{BANK_DETAILS.accountName}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div>
                                    <p className="text-xs text-muted-foreground">IBAN</p>
                                    <p className="font-mono font-medium">{BANK_DETAILS.iban}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(BANK_DETAILS.iban, "IBAN")}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-bold text-primary">
                                        {BANK_DETAILS.currency} {BANK_DETAILS.amount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() =>
                                    window.open(`https://wa.me/${BANK_DETAILS.whatsapp.replace("+", "")}`, "_blank")
                                }
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contact on WhatsApp
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                                {BANK_DETAILS.whatsapp}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status */}
                {paymentRequest && (
                    <Card className="border-2 border-primary/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon()}
                                    <CardTitle>Payment Status</CardTitle>
                                </div>
                                <StatusBadge
                                    status={
                                        paymentRequest.status === "approved"
                                            ? "active"
                                            : paymentRequest.status === "rejected"
                                                ? "expired"
                                                : "pending"
                                    }
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {paymentRequest.status === "approved" &&
                                    "Your payment has been approved! Your subscription is now active."}
                                {paymentRequest.status === "pending" &&
                                    "Your payment request is pending admin approval."}
                                {paymentRequest.status === "rejected" &&
                                    "Your payment request was rejected. Please contact support."}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Submit Payment Button */}
                {(!paymentRequest || paymentRequest.status !== "pending") && (
                    <Button
                        onClick={handleRequestPayment}
                        disabled={loading || user.subscriptionStatus === "active"}
                        size="lg"
                        className="w-full text-lg py-6"
                    >
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : user.subscriptionStatus === "active" ? (
                            "Subscription Active"
                        ) : (
                            "I have made the payment"
                        )}
                    </Button>
                )}

                {paymentRequest && paymentRequest.status === "pending" && (
                    <p className="text-center text-sm text-muted-foreground">
                        Please wait for admin approval. You&apos;ll be notified once your payment is verified.
                    </p>
                )}
            </div>
        </div>
    );
}
