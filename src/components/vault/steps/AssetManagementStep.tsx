"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssetManagementStepProps {
  // Props will be added later when we implement the detailed forms
}

export function AssetManagementStep({}: AssetManagementStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Asset Management</h2>
        <p className="text-muted-foreground">Configure asset management policies for your vault</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asset Management Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Asset management policy configuration will be implemented here.
            This will include settings for allowed adapters, external positions, and asset management rules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
