import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./navigation-menu";
import { Link } from "react-router-dom";
import { Route } from "react-router-dom";
import { Routes } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="w-3/4 bg-white">
      <nav className="flex flex-row w-full">
        <ul className="flex flex-row w-full items-center justify-around">
          <li className="text-lg font-bold white py-2 px-3 rounded-lg">
            <Link to="/Posts">Department</Link>
          </li>
          <li className="text-lg font-bold white py-2 px-3 rounded-lg">
            <Link to="/Posts">Of Science</Link>
          </li>
          <li className="text-lg font-bold white py-2 px-3 rounded-lg">
            <Link to="/Posts">And Tech</Link>
          </li>
          <li className="text-lg font-bold white py-2 px-3 rounded-lg">
            <Link to="/Posts">Nology</Link>
          </li>
        </ul>
      </nav>
      <div className="hidden"></div>
    </div>
  );
}
