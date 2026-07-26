import { Outlet, Link, useLocation } from "react-router-dom"
import { useWallet } from "../context/WalletContext"
import { useTheme } from "../context/ThemeContext"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { 
  LayoutDashboard, 
  ShieldCheck, 
  WalletCards, 
  History, 
  Settings, 
  Info,
  Sun,
  Moon,
  LogOut,
  Menu,
  Bell
} from "lucide-react"
import { useState } from "react"
import { WalletPanel } from "../components/WalletPanel" // We'll rewrite this soon to just be a button/modal

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Verify Eligibility', href: '/app/verify', icon: ShieldCheck },
  { name: 'Credential Vault', href: '/app/vault', icon: WalletCards },
  { name: 'History', href: '/app/history', icon: History },
  { name: 'Privacy', href: '/app/privacy', icon: Info },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export function AppLayout() {
  const { theme, setTheme } = useTheme()
  const { connectorAPI, setConnectorAPI, setWalletAPI, setContractAddress } = useWallet()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleDisconnect = () => {
    setConnectorAPI(null)
    setWalletAPI(null)
    setContractAddress('')
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="">Midnight Auth</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                  location.pathname === item.href || (item.href !== '/app' && location.pathname.startsWith(item.href))
                    ? "bg-muted text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="w-full flex-1">
            {/* Global Search / Command Palette could go here */}
            <div className="hidden sm:block text-sm text-muted-foreground">
              {navigation.find(n => n.href === location.pathname)?.name || 'Overview'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            {connectorAPI ? (
              <div className="flex items-center gap-3">
                <Badge variant="success" className="hidden sm:inline-flex">Connected</Badge>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            ) : (
              <WalletPanel 
                onConnect={(api, wApi) => {
                  setConnectorAPI(api);
                  setWalletAPI(wApi);
                }} 
                onDisconnect={handleDisconnect}
              />
            )}
          </div>
        </header>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-b bg-background px-4 py-4">
            <nav className="grid gap-2 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    location.pathname === item.href
                      ? "bg-muted text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
