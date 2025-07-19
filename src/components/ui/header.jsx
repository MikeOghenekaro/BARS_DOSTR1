import Logo from "../logo/logo";
import Navbar from "./navbar";

export default function header() {
  return (
    <header className="w-full h-40 bg-gray-800">
      <div className="flex flex-row h-full w-full items-center justify-between px-4 py-2">
        <Logo />
        <Navbar />
      </div>
    </header>
  );
}
