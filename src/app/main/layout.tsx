import { Header } from '@/components/ui/Header';
import { TabBar } from '@/components/ui/TabBar';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen minDuration={2000} />
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full relative">
          <div className="w-full h-full pb-20">
            {children}
          </div>
        </main>
        <TabBar />
      </div>
    </>
  );
}
