import { PageLayout } from "@/components/PageLayout";
import { VaultList } from "@/components/vault/VaultList";
import { VaultSearch } from "@/components/vault/VaultSearch";


export default function RootPage() {
  return (
    <main>
      <PageLayout className="flex flex-col items-center p-24">
        <VaultList />
        {/* <VaultSearch /> */}
      </PageLayout>
    </main>
  );
}
