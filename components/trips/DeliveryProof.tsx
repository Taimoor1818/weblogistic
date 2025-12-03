"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, uploadString } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { CheckCircle, Eraser } from "lucide-react";
import { Trip } from "@/types";

interface DeliveryProofProps {
    trip: Trip;
    trigger?: React.ReactNode;
}

export function DeliveryProof({ trip, trigger }: DeliveryProofProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);
    const { updateTrip, profile } = useStore();

    const handleComplete = async () => {
        if (!profile?.uid) return;
        setUploading(true);

        try {
            let signatureUrl = "";
            let photoUrl = "";

            // Upload Signature
            if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
                const signatureRef = ref(storage, `users/${profile.uid}/trips/${trip.id}/signature.png`);
                await uploadString(signatureRef, signatureData, "data_url");
                signatureUrl = await getDownloadURL(signatureRef);
            }

            // Upload Photo (if input exists and has file)
            const fileInput = document.getElementById("proof-photo") as HTMLInputElement;
            if (fileInput?.files?.[0]) {
                const file = fileInput.files[0];
                const photoRef = ref(storage, `users/${profile.uid}/trips/${trip.id}/proof-${uuidv4()}`);
                await uploadBytes(photoRef, file);
                photoUrl = await getDownloadURL(photoRef);
            }

            await updateTrip({
                ...trip,
                status: "delivered",
                deliveryTime: new Date().toISOString(),
                proofOfDelivery: {
                    signature: signatureUrl,
                    photoURL: photoUrl,
                    timestamp: new Date().toISOString(),
                },
            });

            toast.success("Delivery completed!");
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save delivery proof");
        } finally {
            setUploading(false);
        }
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Delivery
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Proof of Delivery</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Customer Signature</Label>
                        <div className="border rounded-md bg-white">
                            <SignatureCanvas
                                ref={sigCanvas}
                                penColor="black"
                                canvasProps={{
                                    width: 375,
                                    height: 150,
                                    className: "signature-canvas",
                                }}
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs">
                            <Eraser className="mr-2 h-3 w-3" />
                            Clear Signature
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proof-photo">Delivery Photo</Label>
                        <Input id="proof-photo" type="file" accept="image/*" />
                    </div>

                    <Button onClick={handleComplete} className="w-full" disabled={uploading}>
                        {uploading ? "Saving..." : "Confirm Delivery"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
