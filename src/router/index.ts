import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import App from "@/App"; // 引入App组件
import About from "@/pages/About"; // 引入About组件
import Dashboard from "@/pages/Dashboard"; // 引入Dashboard组件
import Home from "@/pages/Home"; // 引入Home组件
import Login from "@/pages/Login"; // 引入Login组件
import NotFound from "@/pages/NotFound"; // 引入NotFound组件
import Tool from "@/pages/tool"; // 引入Tool组件
import Recorder from "@/pages/tool/Recorder";
import MusicPlayer from "@/pages/tool/MusicPlayer";
import Notebook from "@/pages/tool/Notebook";
import MediaConverter from "@/pages/tool/MediaConverter";
import ImageConverter from "@/pages/tool/ImageConverter";
import Settings from "@/pages/Settings";

import MainLayout from "@/layouts/MainLayout";

const router = createBrowserRouter([
  {
    path: "/login",
    element: createElement(Login),
  },
  {
    path: "/",
    element: createElement(App),
    errorElement: createElement(NotFound), // 配置404 Not Found页面
    children: [
      {
        element: createElement(MainLayout),
        children: [
          {
            index: true,
            element: createElement(Home),
          },
          {
            path: "about",
            element: createElement(About),
          },
          {
            path: "tool",
            children: [
              {
                index: true,
                element: createElement(Tool),
              },
              {
                path: "recorder",
                element: createElement(Recorder),
              },
              {
                path: "music",
                element: createElement(MusicPlayer),
              },
              {
                path: "notebook",
                element: createElement(Notebook),
              },
              {
                path: "converter",
                element: createElement(MediaConverter),
              },
              {
                path: "image-converter",
                element: createElement(ImageConverter),
              },
            ],
          },
          {
            path: "dashboard",
            element: createElement(Dashboard),
          },
          {
            path: "settings",
            element: createElement(Settings),
          },
        ],
      },
    ],
  },
]);

export default router;
