import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/enhanced-button";
import { UserNav } from "@/components/UserNav";
import { 
  LayoutDashboard, 
  Send, 
  FileText, 
  Users, 
  Layers, 
  Settings,
  Mail,
  Menu
} from "lucide-react";
import { LoadingProvider } from "@/components/loading-provider";

export default async function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <LoadingProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-md">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden md:inline-block">
                  Email Campaign App
                </span>
              </Link>
            </div>
            <UserNav user={session.user} />
          </div>
        </header>
        
        <div className="flex flex-1">
          <aside className="w-64 border-r bg-white shadow-md hidden md:block transition-all duration-300">
            <nav className="space-y-0.5 py-3">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Main</p>
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/campaigns" className="flex items-center">
                      <Send className="h-4 w-4 mr-3" />
                      Campaigns
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/templates" className="flex items-center">
                      <FileText className="h-4 w-4 mr-3" />
                      Templates
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Audience</p>
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/contacts" className="flex items-center">
                      <Users className="h-4 w-4 mr-3" />
                      Contacts
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/groups" className="flex items-center">
                      <Layers className="h-4 w-4 mr-3" />
                      Groups
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Account</p>
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 rounded-md" 
                    asChild
                  >
                    <Link href="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </nav>
            
            <div className="mt-auto p-4 border-t">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Need help?</p>
                <p className="text-xs text-blue-600 mt-1">Check our documentation or contact support</p>
                <EnhancedButton 
                  size="sm" 
                  className="w-full mt-2 text-xs h-8" 
                  asChild
                >
                  <Link href="/documentation">View Documentation</Link>
                </EnhancedButton>
              </div>
            </div>
          </aside>
          
          <main className="flex-1 overflow-auto">
            <div className="container py-6 px-4 md:px-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        
        <footer className="border-t py-4 bg-white">
          <div className="container flex items-center justify-between px-6">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Email Campaign App
            </p>
            <Link 
              href="/documentation" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
            >
              View Documentation
            </Link>
          </div>
        </footer>
      </div>
    </LoadingProvider>
  );
}