import { LoadingPage } from "@/components/ui/loading-page";
import { en } from "@/lib/site-copy";

export default function AccountLoading() {
  return <LoadingPage label={en.accountShell.asideTitle} />;
}
