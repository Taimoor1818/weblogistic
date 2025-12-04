"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import {
  PlusCircle,
  Edit3,
  Trash2,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Download,
  CheckCircle,
  Clock
} from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { payments, employees, addPayment, updatePayment, deletePayment } = useStore();
  const [activeTab, setActiveTab] = useState("overview");
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
    employeeId: ''
  });

  const [newPayment, setNewPayment] = useState({
    type: 'other' as 'trip' | 'salary' | 'expense' | 'fuel' | 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    employeeId: ''
  });

  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = payments
      .filter((p: any) => p.type === 'trip' && p.status === 'received')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const totalExpense = payments
      .filter((p: any) => ['salary', 'expense', 'fuel', 'other'].includes(p.type) && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const netProfit = totalRevenue - totalExpense;

    const issuedPaymentsCount = payments.filter((p: any) => p.status === 'pending').length;

    return { totalRevenue, totalExpense, netProfit, issuedPaymentsCount };
  }, [payments]);

  // Calculate report data
  const reportData = useMemo(() => {
    const tripRevenue = payments
      .filter((p: any) => p.type === 'trip' && p.status === 'received')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const salaryExpense = payments
      .filter((p: any) => p.type === 'salary' && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const generalExpense = payments
      .filter((p: any) => p.type === 'expense' && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const fuelExpense = payments
      .filter((p: any) => p.type === 'fuel' && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const otherExpense = payments
      .filter((p: any) => p.type === 'other' && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const totalExpenses = salaryExpense + generalExpense + fuelExpense + otherExpense;

    return {
      tripRevenue,
      expenses: [
        { name: 'Salary', amount: salaryExpense, percentage: totalExpenses > 0 ? (salaryExpense / totalExpenses) * 100 : 0 },
        { name: 'Expense', amount: generalExpense, percentage: totalExpenses > 0 ? (generalExpense / totalExpenses) * 100 : 0 },
        { name: 'Fuel', amount: fuelExpense, percentage: totalExpenses > 0 ? (fuelExpense / totalExpenses) * 100 : 0 },
        { name: 'Other', amount: otherExpense, percentage: totalExpenses > 0 ? (otherExpense / totalExpenses) * 100 : 0 }
      ],
      totalExpenses
    };
  }, [payments]);

  const handleAddPayment = async () => {
    // Validation
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!newPayment.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (newPayment.type === 'salary' && !newPayment.employeeId) {
      toast.error("Please select an employee for salary payment");
      return;
    }

    await addPayment({
      type: newPayment.type,
      amount: parseFloat(newPayment.amount),
      description: newPayment.description,
      date: newPayment.date,
      status: 'pending',
      employeeId: newPayment.employeeId || undefined
    });

    setNewPayment({
      type: 'other',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      employeeId: ''
    });
    setShowAddDialog(false);
    toast.success("Payment added successfully");
  };

  const handleIssuePayment = async (paymentId: string) => {
    const paymentToUpdate = payments.find((p: any) => p.id === paymentId);
    if (paymentToUpdate) {
      await updatePayment({
        ...paymentToUpdate,
        status: 'paid'
      });
      toast.success("Payment status changed to Paid");
    }
  };

  const handleCompletePayment = async (paymentId: string) => {
    const paymentToUpdate = payments.find((p: any) => p.id === paymentId);
    if (paymentToUpdate && paymentToUpdate.type === 'trip') {
      await updatePayment({
        ...paymentToUpdate,
        status: 'received'
      });
      toast.success("Payment status changed to Received");
    }
  };

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment);
    setEditForm({
      type: payment.type,
      amount: payment.amount.toString(),
      description: payment.description,
      date: payment.date,
      employeeId: payment.employeeId || ''
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
    if (mpinAction === 'edit' && editingPayment) {
      setShowMpinDialog(false);
      setShowEditDialog(true);
    } else if (mpinAction === 'delete' && deletePaymentId) {
      await deletePayment(deletePaymentId);
      setShowMpinDialog(false);
      setDeletePaymentId(null);
      toast.success("Payment deleted successfully");
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!editForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (editForm.type === 'salary' && !editForm.employeeId) {
      toast.error("Please select an employee for salary payment");
      return;
    }

    if (editingPayment) {
      await updatePayment({
        ...editingPayment,
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        date: editForm.date,
        employeeId: editForm.employeeId || undefined
      });
      setShowEditDialog(false);
      setEditingPayment(null);
      toast.success("Payment updated successfully");
    }
  };

  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const filteredPayments = payments.filter((payment: any) => {
      const paymentDate = new Date(payment.date);
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    if (filteredPayments.length === 0) {
      toast.error("No payments found for the selected date range");
      return;
    }

    const exportData = filteredPayments.map((payment: any) => ({
      Date: payment.date,
      Type: payment.type,
      Description: payment.description,
      Amount: payment.amount,
      Status: payment.status,
      Employee: payment.employeeId ? (employees.find((e: any) => e.id === payment.employeeId)?.name || 'N/A') : 'N/A'
    }));

    exportToExcel(
      exportData,
      `payments_${exportStartDate}_to_${exportEndDate}`,
      "Payments",
      "WebLogistic Payments Report"
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trip': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'salary': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expense': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'fuel': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'received': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground mt-2">
              Track revenue, expenses, and financial transactions
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{metrics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From completed trips
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{metrics.totalExpense.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Salary, fuel & other expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₹{metrics.netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue - Expense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issued Payments</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.issuedPaymentsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Export Section */}
          <Card>
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

          {/* All Payments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Payments
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
                </div>
              ) : (
                <div className="space-y-3">
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
                            <span>
                              Employee: {employees.find((e: any) => e.id === payment.employeeId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="font-bold text-lg">₹{payment.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {payment.status === 'pending' && payment.type !== 'trip' && (
                            <Button
                              size="sm"
                              onClick={() => handleIssuePayment(payment.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Issue
                            </Button>
                          )}
                          {payment.status === 'pending' && payment.type === 'trip' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleIssuePayment(payment.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Issue
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCompletePayment(payment.id)}
                              >
                                Complete
                              </Button>
                            </>
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
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-6">
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
                </div>
              ) : (
                <div className="space-y-3">
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
                            <span>
                              Employee: {employees.find((e: any) => e.id === payment.employeeId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="font-bold text-lg">₹{payment.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {payment.status === 'pending' && payment.type !== 'trip' && (
                            <Button
                              size="sm"
                              onClick={() => handleIssuePayment(payment.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Issue
                            </Button>
                          )}
                          {payment.status === 'pending' && payment.type === 'trip' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleIssuePayment(payment.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Issue
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCompletePayment(payment.id)}
                              >
                                Complete
                              </Button>
                            </>
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
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Trip Revenue Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Trip Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Revenue from Trips</span>
                  <span className="text-2xl font-bold text-green-600">₹{reportData.tripRevenue.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenue Progress</span>
                    <span className="font-medium">
                      {payments.filter((p: any) => p.type === 'trip' && p.status === 'received').length} completed trips
                    </span>
                  </div>
                  <Progress
                    value={reportData.tripRevenue > 0 ? 100 : 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Expenses Breakdown Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Expenses Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-2xl font-bold text-red-600">₹{reportData.totalExpenses.toFixed(2)}</span>
                </div>
                {reportData.expenses.map((expense) => (
                  <div key={expense.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{expense.name}</span>
                      <span className="text-muted-foreground">₹{expense.amount.toFixed(2)}</span>
                    </div>
                    <Progress
                      value={expense.percentage}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                onValueChange={(value: any) => setEditForm({ ...editForm, type: value })}
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
                step="0.01"
                min="0"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            {editForm.type === 'salary' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-employee">Employee</Label>
                <Select
                  value={editForm.employeeId}
                  onValueChange={(value) => setEditForm({ ...editForm, employeeId: value })}
                >
                  <SelectTrigger id="edit-employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                onValueChange={(value: any) => setNewPayment({ ...newPayment, type: value, employeeId: '' })}
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
                step="0.01"
                min="0"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-date">Date</Label>
              <Input
                id="add-date"
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
              />
            </div>
            {newPayment.type === 'salary' && (
              <div className="grid gap-2">
                <Label htmlFor="add-employee">Employee</Label>
                <Select
                  value={newPayment.employeeId}
                  onValueChange={(value) => setNewPayment({ ...newPayment, employeeId: value })}
                >
                  <SelectTrigger id="add-employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment}>
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
