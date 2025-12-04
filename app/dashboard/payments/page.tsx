"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Calendar,
  FileText,
  User,
  CreditCard,
  Download,
  Filter
} from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  type: 'trip' | 'salary' | 'expense' | 'fuel' | 'other';
  amount: number;
  description: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'received';
  relatedId?: string; // Trip ID, Driver ID, etc.
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { trips, drivers, vehicles, payments, employees, addPayment, updatePayment, deletePayment, profile } = useStore();
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [showMpinDialog, setShowMpinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [mpinAction, setMpinAction] = useState<'edit' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'other' as 'trip' | 'salary' | 'expense' | 'fuel' | 'other',
    amount: '',
    description: '',
    date: '',
    employeeId: '' // Add employeeId field
  });
  const [newPayment, setNewPayment] = useState({
    type: 'other' as 'trip' | 'salary' | 'expense' | 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    employeeId: '' // Add employeeId field
  });
  
  // Export date range state
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const handleAddPayment = async () => {
    await addPayment({
      type: newPayment.type,
      amount: parseFloat(newPayment.amount),
      description: newPayment.description,
      date: newPayment.date,
      status: 'pending',
      employeeId: newPayment.employeeId || undefined // Add employeeId if provided
    });
    setNewPayment({
      type: 'other',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      employeeId: ''
    });
    toast.success("Payment added successfully");
  };

  const handleIssuePayment = async (paymentId: string) => {
    const paymentToUpdate = payments.find((p: any) => p.id === paymentId);
    if (paymentToUpdate) {
      await updatePayment({
        ...paymentToUpdate,
        status: 'paid'
      });
      toast.success("Payment marked as issued");
    }
  };

  const handleReceivePayment = async (paymentId: string) => {
    const paymentToUpdate = payments.find((p: any) => p.id === paymentId);
    if (paymentToUpdate) {
      await updatePayment({
        ...paymentToUpdate,
        status: 'received'
      });
      toast.success("Payment marked as received");
    }
  };

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment);
    setEditForm({
      type: payment.type,
      amount: payment.amount.toString(),
      description: payment.description,
      date: payment.date,
      employeeId: payment.employeeId || '' // Add employeeId field
    });
    setMpinAction('edit');
    setShowMpinDialog(true);
  };

  const handleDeleteClick = (paymentId: string) => {
    setDeletePaymentId(paymentId);
    setMpinAction('delete');
    setShowMpinDialog(true);
  };

  const handleMpinSubmit = async (pin: string) => {
    // In the new approach, the MPINVerify component handles validation
    // We just need to proceed with the action
    if (mpinAction === 'edit' && editingPayment) {
      setShowMpinDialog(false);
      // Show edit dialog
      setShowEditDialog(true);
    } else if (mpinAction === 'delete' && deletePaymentId) {
      await deletePayment(deletePaymentId);
      setShowMpinDialog(false);
      setDeletePaymentId(null);
      toast.success("Payment deleted successfully");
    }
  };

  const handleEditSubmit = async () => {
    if (editingPayment) {
      await updatePayment({
        ...editingPayment,
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        date: editForm.date,
        employeeId: editForm.employeeId || undefined // Add employeeId if provided
      });
      setShowEditDialog(false);
      toast.success("Payment updated successfully");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trip': return 'bg-blue-100 text-blue-800';
      case 'salary': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'fuel': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export payments to Excel
  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    // Filter payments by date range
    const filteredPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.date);
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    if (filteredPayments.length === 0) {
      toast.error("No payments found for the selected date range");
      return;
    }

    // Prepare data for export
    const exportData = filteredPayments.map((payment: any) => ({
      Date: payment.date,
      Type: payment.type,
      Description: payment.description,
      Amount: payment.amount,
      Status: payment.status,
      RelatedID: payment.relatedId || 'N/A'
    }));

    exportToExcel(
      exportData, 
      `payments_${exportStartDate}_to_${exportEndDate}`,
      "Payments",
      "WebLojistic Payments Report"
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage all financial transactions
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Export Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No payments recorded</h3>
              <p className="mt-1 text-muted-foreground">
                Get started by adding your first payment.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddDialog(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={getTypeColor(payment.type)}>
                        {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{payment.description}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                      </div>
                      {payment.employeeId && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {employees.find((e: any) => e.id === payment.employeeId)?.name || 'Unknown Employee'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="font-bold text-lg">₹{payment.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {payment.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleIssuePayment(payment.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Issue
                        </Button>
                      )}
                      {payment.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleReceivePayment(payment.id)}
                        >
                          Receive
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditClick(payment)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MPIN Verification Dialog */}
      {user && (
        <MPINVerify
          open={showMpinDialog}
          onClose={() => {
            setShowMpinDialog(false);
            setMpinAction(null);
            setDeletePaymentId(null);
          }}
          onSuccess={handleMpinSubmit}
          title={`Verify to ${mpinAction === 'edit' ? 'Edit' : 'Delete'} Payment`}
          description="Enter your MPIN to confirm this action"
          userId={user.uid}
        />
      )}

      {/* Edit Payment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value: any) => setEditForm({...editForm, type: value})}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-employee">Employee (Optional)</Label>
              <Select
                value={editForm.employeeId}
                onValueChange={(value) => setEditForm({...editForm, employeeId: value})}
              >
                <SelectTrigger id="edit-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-type">Type</Label>
              <Select
                value={newPayment.type}
                onValueChange={(value: any) => setNewPayment({...newPayment, type: value})}
              >
                <SelectTrigger id="add-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-amount">Amount</Label>
              <Input
                id="add-amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={newPayment.description}
                onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-date">Date</Label>
              <Input
                id="add-date"
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-employee">Employee (Optional)</Label>
              <Select
                value={newPayment.employeeId}
                onValueChange={(value) => setNewPayment({...newPayment, employeeId: value})}
              >
                <SelectTrigger id="add-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleAddPayment();
                setShowAddDialog(false);
              }}>
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
