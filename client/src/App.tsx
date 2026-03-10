import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ClassList from "@/pages/classes/ClassList";
import ClassDashboard from "@/pages/classes/ClassDashboard";
import StudentList from "@/pages/classes/StudentList";
import TransactionList from "@/pages/classes/TransactionList";
import AttendanceList from "@/pages/classes/AttendanceList";
import TuitionTracker from "@/pages/classes/TuitionTracker";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <ClassList />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/classes/:id/dashboard">
        <ProtectedRoute>
          <Layout>
            <ClassDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/classes/:id/students">
        <ProtectedRoute>
          <Layout>
            <StudentList />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/classes/:id/transactions">
        <ProtectedRoute>
          <Layout>
            <TransactionList />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/classes/:id/tuition">
        <ProtectedRoute>
          <Layout>
            <TuitionTracker />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/classes/:id/attendance">
        <ProtectedRoute>
          <Layout>
            <AttendanceList />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
