"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import {
  PlusCircle,
  Edit3,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Download,
  TrendingUp,
  Wallet,
  CreditCard
} from "lucide-react";
import { exportToExcel } from "@/lib/export";
import { MPINVerify } from "@/components/auth/MPINVerify";
import { useAuth } from "@/hooks/useAuth";
import { getCurrencySymbol } from "@/lib/currency";

interface Payment {
  id: string;
  type: 'trip' | 'salary' | 'expense' | 'fuel' | 'other';
  amount: number;
  description: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'received';
  employeeId?: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const { trips, drivers, vehicles, payments, employees, addPayment, updatePayment, deletePayment, profile, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'reports'>('overview');
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

  // Export date range state
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const issuedPayments = payments.filter((p: Payment) => p.status === 'paid');
    const receivedPayments = payments.filter((p: Payment) => p.status === 'received');

    // Total revenue from received trip payments
    const totalRevenue = receivedPayments
      .filter((p: Payment) => p.type === 'trip')
      .reduce((sum: number, p: Payment) => sum + p.amount, 0);

    // Total expenses from paid non-trip payments
    const totalExpenses = issuedPayments
      .filter((p: Payment) => p.type !== 'trip')
      .reduce((sum: number, p: Payment) => sum + p.amount, 0);

    // Net profit
    const netProfit = totalRevenue - totalExpenses;

    return {
      issuedCount: issuedPayments.length,
      totalRevenue,
      totalExpenses,
      netProfit
    };
  }, [payments]);

  // Get recent payments (last 5)
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [payments]);

  const handleAddPayment = async () => {
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

  const handleCompletePayment = async (paymentId: string) => {
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
      Employee: payment.employeeId ? employees.find((e: any) => e.id === payment.employeeId)?.name || 'Unknown' : 'N/A'
    }));

    exportToExcel(
      exportData,
      `payments_${exportStartDate}_to_${exportEndDate}`,
      "Payments",
      "WebLojistic Payments Report"
    );
  };

  // Calculate progress data for reports
  const revenueData = useMemo(() => {
    const tripPayments = payments.filter((p: any) => p.type === 'trip' && p.status === 'received');
    const totalAmount = tripPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      totalAmount,
      count: tripPayments.length
    };
  }, [payments]);

  const expenseData = useMemo(() => {
    const expensePayments = payments.filter((p: any) => p.type !== 'trip' && p.status === 'paid');
    const totalAmount = expensePayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Group by type
    const byType: Record<string, { count: number; amount: number }> = {};
    expensePayments.forEach((p: Payment) => {
      if (!byType[p.type]) {
        byType[p.type] = { count: 0, amount: 0 };
      }
      byType[p.type].count += 1;
      byType[p.type].amount += p.amount;
    });

    return {
      totalAmount,
      count: expensePayments.length,
      byType
    };
  }, [payments]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage financial transactions, track revenue and expenses
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="px-4"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'payments' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('payments')}
          className="px-4"
        >
          Payments
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reports')}
          className="px-4"
        >
          Reports
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issue Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentStats.issuedCount}</div>
                <p className="text-xs text-muted-foreground">Payments issued</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{paymentStats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From trip payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Wallet className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{paymentStats.totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Salaries & expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${paymentStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getCurrencySymbol(settings.currency)}{paymentStats.netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
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
                  {recentPayments.map((payment: any) => (
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
                          <p className="font-bold text-lg">{getCurrencySymbol(settings.currency)}{payment.amount.toFixed(2)}</p>
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
                          {payment.status === 'paid' && payment.type === 'trip' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompletePayment(payment.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
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
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Export Section */}
          <Card className="mb-6">
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
                <DollarSign className="h-5 w-5" />
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
                          <p className="font-bold text-lg">{getCurrencySymbol(settings.currency)}{payment.amount.toFixed(2)}</p>
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
                          {payment.status === 'paid' && payment.type === 'trip' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompletePayment(payment.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
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
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trip Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Revenue</span>
                      <span className="font-medium">{getCurrencySymbol(settings.currency)}{revenueData.totalAmount.toFixed(2)}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{revenueData.count} trip payments received</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-red-500" />
                  Expenses & Salaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Expenses</span>
                      <span className="font-medium">{getCurrencySymbol(settings.currency)}{expenseData.totalAmount.toFixed(2)}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{expenseData.count} expense payments issued</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(expenseData.byType).map(([type, data]) => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type}:</span>
                          <span>{data.count} payments ({getCurrencySymbol(settings.currency)}{data.amount.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Profit Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-xl font-bold text-green-800">{getCurrencySymbol(settings.currency)}{paymentStats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">Total Expenses</p>
                  <p className="text-xl font-bold text-red-800">{getCurrencySymbol(settings.currency)}{paymentStats.totalExpenses.toFixed(2)}</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${paymentStats.netProfit >= 0 ? 'bg-purple-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-purple-700">Net Profit</p>
                  <p className={`text-xl font-bold ${paymentStats.netProfit >= 0 ? 'text-purple-800' : 'text-orange-800'}`}>
                    {getCurrencySymbol(settings.currency)}{paymentStats.netProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update the payment details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value as any })}
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
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount ({getCurrencySymbol(settings.currency)})</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                placeholder="Enter amount"
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

            {(editForm.type === 'salary') && (
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
                    <SelectItem value="">None</SelectItem>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Add a new payment to your records
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-type">Type</Label>
              <Select
                value={newPayment.type}
                onValueChange={(value) => setNewPayment({ ...newPayment, type: value as any })}
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
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-amount">Amount ({getCurrencySymbol(settings.currency)})</Label>
              <Input
                id="add-amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="Enter amount"
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

            {(newPayment.type === 'salary') && (
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
                    <SelectItem value="">None</SelectItem>
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