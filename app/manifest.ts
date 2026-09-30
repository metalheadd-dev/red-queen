import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RQ Corp | Red Queen",
    short_name: "RQ Corp",
    description: "Your survival field terminal. Ask Red Queen, review live threats and prepare your next move.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#ff1748",
    icons: [
      {
        src: "/token-image.png",
        sizes: "512x512",
        type: "image/png",
      }
    ],
    shortcuts: [
      {
        name: "Live threats",
        short_name: "Threats",
        description: "Review verified signals and your Signal Watch.",
        url: "/pulse",
        icons: [{ src: "/token-image.png", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Ask Red Queen",
        short_name: "Red Queen",
        description: "Talk to your AI survival agent.",
        url: "/red-queen",
        icons: [{ src: "/token-image.png", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Gaming Room",
        short_name: "Gaming",
        description: "Find survival games and plan a run with Queen.",
        url: "/gaming",
        icons: [{ src: "/token-image.png", sizes: "512x512", type: "image/png" }],
      },
    ],
  };
}
