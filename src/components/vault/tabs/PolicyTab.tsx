import { type Deployment } from "@/lib/consts";
import { type Address } from "viem";

interface PolicyTabProps {
  vault: Address;
  deployment: Deployment;
}

export function PolicyTab({ vault, deployment }: PolicyTabProps) {
  return (
    <div className="text-center py-12">
      <div className="h-12 w-12 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
        <div className="h-6 w-6 bg-gray-400 rounded"></div>
      </div>
      <h3 className="text-lg font-semibold mb-2">Policy Management</h3>
      <p className="text-muted-foreground">
        Policy configuration features will be available here soon.
      </p>
    </div>
  );
}
