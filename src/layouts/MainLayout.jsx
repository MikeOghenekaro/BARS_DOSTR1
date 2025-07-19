import { Outlet } from "react-router-dom";
import SidebarLayout from "@/components/Sidebar";

const MainLayout = () => {
  return (
    <div className="flex flex-row h-screen overflow-hidden w-screen">
      <SidebarLayout>{/* <Outlet /> */}</SidebarLayout>
      <main className="flex-1 relative h-full w-full overflow-y-auto">
        <video
          autoPlay
          muted
          loop
          src="/videos/ai-bg-blue.mp4"
          className="absolute object-fill bg-cover z-[-5] h-full w-full"
        ></video>
        <p className="absolute left-1/2 -translate-x-1/2">BARS</p>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
