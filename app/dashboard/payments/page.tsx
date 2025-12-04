"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  Truck, 
  User, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  CreditCard,
  Fuel,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { verifyMPIN } from "@/lib/encryption";
import { exportToExcel } from "@/lib/export";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

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
  const { trips, drivers, vehicles, payments, addPayment, updatePayment, deletePayment, profile } = useStore();
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [mpin, setMpin] = useState('');
  const [showMpinDialog, setShowMpinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [mpinAction, setMpinAction] = useState<'edit' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'other' as 'trip' | 'salary' | 'expense' | 'fuel' | 'other',
    amount: '',
    description: '',
    date: ''
  });
  const [newPayment, setNewPayment] = useState({
    type: 'other' as 'trip' | 'salary' | 'expense' | 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Export date range state
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  // Calculate financial metrics
  // Total Revenue = Received payments from trips
  const totalRevenue = payments
    .filter((p: any) => p.type === 'trip' && p.status === 'received')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);
    
  // Total Expenses = Salary + Expense payments that are paid
  // Total Expenses = All payment types except trip that are paid
  const totalExpenses = payments
    .filter((p: any) => p.type !== 'trip' && p.status === 'paid')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);
    
  // Issue Payments = Trip payments that are pending (to be issued)
  const issuePayments = payments
    .filter((p: any) => p.type === 'trip' && p.status === 'pending')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);
    
  // Net Profit = Total Revenue - Total Expenses
  const netProfit = totalRevenue - totalExpenses;
  
  const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
  
  // For backward compatibility with existing code that expects this variable

  // Remove useEffect since we're now using the store

  const handleAddPayment = async () => {
    if (!newPayment.amount || !newPayment.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payment = {
      type: newPayment.type,
      amount: parseFloat(newPayment.amount),
      description: newPayment.description,
      date: newPayment.date,
      status: 'pending' as 'pending',
    };

    await addPayment(payment);
    setNewPayment({
      type: 'other',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    
    toast.success("Payment added successfully");
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

  const verifyMpin = async (enteredMpin: string) => {
    // Use proper MPIN verification with bcrypt
    if (!profile?.mpinHash) return false;
    try {
      const isValid = await verifyMPIN(enteredMpin, profile.mpinHash);
      return isValid;
    } catch (error) {
      console.error("Error verifying MPIN:", error);
      return false;
    }
  };

  const handleEditClick = (payment: any) => {
    setEditingPayment(payment);
    setEditForm({
      type: payment.type,
      amount: payment.amount.toString(),
      description: payment.description,
      date: payment.date
    });
    setMpinAction('edit');
    setShowMpinDialog(true);
  };

  const handleDeleteClick = (paymentId: string) => {
    setDeletePaymentId(paymentId);
    setMpinAction('delete');
    setShowMpinDialog(true);
  };

  const handleMpinSubmit = async () => {
    const isValid = await verifyMpin(mpin);
    if (isValid) {
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
      setMpin('');
    } else {
      toast.error("Invalid MPIN. Please try again.");
    }
  };

  const handleEditSubmit = async () => {
    if (editingPayment) {
      await updatePayment({
        ...editingPayment,
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        date: editForm.date
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle export with date range
  const handleExport = async () => {
    // Filter payments by date range if provided
    let filteredPayments = [...payments];
    
    if (exportStartDate && exportEndDate) {
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }
    
    if (filteredPayments.length === 0) {
      toast.error("No payments found for the selected date range");
      return;
    }
    
    // Prepare data for export
    const exportData = filteredPayments.map(payment => ({
      ID: payment.id,
      Type: payment.type,
      Description: payment.description,
      Amount: payment.amount,
      Status: payment.status,
      Date: format(new Date(payment.date), 'yyyy-MM-dd'),
      RelatedID: payment.relatedId || ''
    }));
    
    if (exportFormat === 'excel') {
      // Export to Excel
      exportToExcel(exportData, "Financial_Transactions", "Payments");
    } else {
      // For PDF, we'll implement a simple CSV-like export for now
      // In a real implementation, you would use a PDF library like jsPDF
      const csvContent = [
        ['ID', 'Type', 'Description', 'Amount', 'Status', 'Date', 'Related ID'],
        ...exportData.map(item => [
          item.ID,
          item.Type,
          item.Description,
          item.Amount,
          item.Status,
          item.Date,
          item.RelatedID
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, "Financial_Transactions.csv");
      toast.success("Exported as CSV (PDF library not installed)");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Payments & Finance Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage trip payments, driver salaries, fuel expenses, and other costs
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Salaries & expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issue Payments</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuePayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">To be issued</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add">Add Payment</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>All financial transactions</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.description}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(payment.type)}>
                          {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(payment.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {payment.status === 'pending' && (
                              <div className="flex gap-1">
                                {payment.type === 'trip' ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleReceivePayment(payment.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Receive
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleIssuePayment(payment.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Issue
                                  </Button>
                                )}
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditClick(payment)}
                              className="h-6 px-2 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteClick(payment.id)}
                              className="h-6 px-2 text-xs text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Payment</CardTitle>
              <CardDescription>Record a new financial transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Payment Type</Label>
                  <select
                    id="type"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value as any})}
                  >
                    <option value="trip">Trip Payment</option>
                    <option value="salary">Driver Salary</option>
                    <option value="expense">Expense</option>
                    <option value="fuel">Fuel Usage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter payment description"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                />
              </div>
              
              <Button onClick={handleAddPayment} className="w-full">
                Add Payment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/trips')}>
              <CardHeader>
                <CardTitle>Income by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        Trip Payments
                      </span>
                      <span className="text-sm text-muted-foreground">${totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${totalRevenue > 0 ? 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/payments')}>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Driver Salaries
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ${payments.filter((p: any) => p.type === 'salary' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ 
                          width: `${totalExpenses > 0 ? 
                            (payments.filter((p: any) => p.type === 'salary' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0) / totalExpenses * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-orange-500" />
                        Other Expenses
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ${(payments.filter((p: any) => p.type === 'expense' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0) + payments.filter((p: any) => p.type === 'other' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ 
                          width: `${totalExpenses > 0 ? 
                            ((payments.filter((p: any) => p.type === 'expense' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0) + payments.filter((p: any) => p.type === 'other' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0)) / totalExpenses * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-yellow-500" />
                        Fuel Expenses
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ${payments.filter((p: any) => p.type === 'fuel' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ 
                          width: `${totalExpenses > 0 ? 
                            (payments.filter((p: any) => p.type === 'fuel' && p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0) / totalExpenses * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Financial Data</DialogTitle>
            <DialogDescription>
              Select date range and format for export
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === 'excel' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('excel')}
                  className="flex-1"
                >
                  Excel
                </Button>
                <Button
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pdf')}
                  className="flex-1"
                  disabled
                >
                  PDF (Coming Soon)
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* MPIN Verification Dialog */}
      <Dialog open={showMpinDialog} onOpenChange={setShowMpinDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter MPIN to Continue</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mpin">MPIN</Label>
              <Input
                id="mpin"
                type="password"
                placeholder="Enter your 4-digit MPIN"
                value={mpin}
                onChange={(e) => setMpin(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowMpinDialog(false);
                setMpin('');
                setMpinAction(null);
                setDeletePaymentId(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleMpinSubmit}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Payment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Payment Type</Label>
                <select
                  id="edit-type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.type}
                  onChange={(e) => setEditForm({...editForm, type: e.target.value as any})}
                >
                  <option value="trip">Trip Payment</option>
                  <option value="salary">Driver Salary</option>
                  <option value="expense">Expense</option>
                  <option value="fuel">Fuel Usage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  placeholder="0.00"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Enter payment description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({...editForm, date: e.target.value})}
              />
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
    </div>
  );
}
