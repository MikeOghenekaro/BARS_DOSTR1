import { Outlet } from "react-router-dom";
import SidebarLayout from "@/components/Sidebar";

const MainLayout = () => {
    const handleCloseWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  return (
    <div className="flex flex-row h-screen overflow-hidden w-screen">
      <div className="window-controls">
                <div className="flex flex-row justify-end gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #505050, #131313)' }}
            onClick={handleMinimizeWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#995700] text-[9px] font-bold opacity-0 hover:opacity-100">−</span>
          </div>
          <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #ad403a, #471a18)' }}
            onClick={handleCloseWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8b0000] text-[9px] font-bold opacity-0 hover:opacity-100">×</span>
          </div>
        </div>
      </div>
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
        <div className="window-controls">
          <div className="flex flex-row justify-end gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #505050, #131313)' }}
            onClick={handleMinimizeWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#995700] text-[9px] font-bold opacity-0 hover:opacity-100">−</span>
          </div>
          <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #ad403a, #471a18)' }}
            onClick={handleCloseWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8b0000] text-[9px] font-bold opacity-0 hover:opacity-100">×</span>
          </div>
        </div>
      </div>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
