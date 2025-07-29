import { CreateVaultForm } from "@/components/vault/CreateVaultForm";
import { PageLayout } from "@/components/PageLayout";

export default function CreateVaultPage() {
  return (
    <main>
      <PageLayout>
        <CreateVaultForm />
      </PageLayout>
    </main>
  );
}

export const metadata = {
  title: "Create Vault",
  description: "Deploy a new on-chain asset management vault",
};
