import { CountdownScreen } from "@/components/CountdownScreen";
import { isBeforeLaunch } from "@/lib/launch";
import HomeClient from "./HomeClient";

export default function Home() {
  if (isBeforeLaunch()) {
    return <CountdownScreen />;
  }
  return <HomeClient />;
}
