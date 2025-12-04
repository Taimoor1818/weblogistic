"use client";

import { useState } from "react";
import { MPINSetup } from "@/components/auth/MPINSetup";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { Button } from "@/components/ui/button";

export default function MPINTestPage() {
    const [showSetup, setShowSetup] = useState(false);
    const [showVerify, setShowVerify] = useState(false);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">MPIN Component Test</h1>
            
            <div className="space-y-4">
                <Button onClick={() => setShowSetup(true)}>
                    Test MPIN Setup
                </Button>
                
                <Button onClick={() => setShowVerify(true)}>
                    Test MPIN Verify
                </Button>
            </div>

            <MPINSetup
                open={showSetup}
                onClose={() => setShowSetup(false)}
                userId="test-user-id"
                userEmail="test@example.com"
                onSuccess={() => {
                    console.log("MPIN setup successful!");
                    alert("MPIN setup successful!");
                }}
            />

            <MPINVerify
                open={showVerify}
                onClose={() => setShowVerify(false)}
                onSuccess={() => {
                    console.log("MPIN verification successful!");
                    alert("MPIN verification successful!");
                }}
                title="Test MPIN Verification"
                description="Enter your MPIN to test the component"
            />
        </div>
    );
}