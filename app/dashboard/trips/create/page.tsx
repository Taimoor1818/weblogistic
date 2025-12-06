"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TripDialog } from "@/components/trips/TripDialog";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function CreateShipmentPage() {
  const router = useRouter();
  const { drivers, vehicles, customers } = useStore();
  const [showDialog, setShowDialog] = useState(false);

  // Open the dialog when the page loads
  useEffect(() => {
    // Check if we have the required data to create a shipment
    if (drivers.length > 0 && vehicles.length > 0 && customers.length > 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setShowDialog(true);
    }
  }, [drivers.length, vehicles.length, customers.length]);

  const handleDialogClose = () => {
    setShowDialog(false);
    router.push("/dashboard/trips");
  };

  const handleGoBack = () => {
    router.push("/dashboard/trips");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trips
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Shipment</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new shipment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-muted-foreground mb-6">
              Configure your shipment details in the form below.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleGoBack} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => setShowDialog(true)}>
                Create Shipment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden TripDialog that opens automatically */}
      <TripDialog
        open={showDialog}
        onOpenChange={(open: boolean) => {
          if (!open) handleDialogClose();
        }}
      />
    </div>
  );
}